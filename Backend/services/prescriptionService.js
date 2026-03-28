// services/PrescriptionService.js

import Prescription from '../models/Prescription.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendPrescriptionReady } from '../utils/emailService.js';
import { emitToUser } from '../utils/socket.js';
import { uploadPrescription as uploadToCloudinary } from '../utils/cloudinaryService.js';

class PrescriptionService {
  static async getUserPrescriptions(userId, role, filters = {}) {
    const { status, page = 1, limit = 20 } = filters;
    const query = {};

    if (role === 'student') {
      query.studentId = userId;
    } else if (role === 'doctor') {
      query.doctorId = userId;
    } else if (role === 'pharmacist') {
      // Pharmacist sees all pending and approved prescriptions by default
      if (!status) query.status = { $in: ['Pending', 'Approved'] };
    }

    if (status && status !== 'All') query.status = status;

    const skip = (page - 1) * limit;

    const [prescriptions, total] = await Promise.all([
      Prescription.find(query)
        .populate('studentId', 'name email phone')
        .populate('doctorId', 'name specialty')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .skip(skip),
      Prescription.countDocuments(query)
    ]);

    return {
      prescriptions,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async uploadPrescription(file, studentId, notes = '') {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Upload to Cloudinary (named export used)
    const uploadResult = await uploadToCloudinary(file.path);

    const prescription = await Prescription.create({
      studentId,
      studentName: student.name,
      doctorId: studentId, // if uploading on behalf of student, doctorId may be null or same as student
      doctorName: student.name,
      status: 'Pending',
      imageUrl: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
      notes
    });

    return prescription;
  }

  static async getPrescriptionById(prescriptionId, userId, role) {
    const prescription = await Prescription.findById(prescriptionId)
      .populate('studentId', 'name email phone')
      .populate('doctorId', 'name specialty');

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const isAuthorized =
      (role === 'student' && prescription.studentId._id.toString() === userId) ||
      (role === 'doctor' && prescription.doctorId && prescription.doctorId._id.toString() === userId) ||
      role === 'pharmacist' ||
      role === 'admin';

    if (!isAuthorized) {
      throw new Error('Unauthorized to view this prescription');
    }

    return prescription;
  }

  static async createPrescription(data, doctorId) {
    const { appointmentId, studentId, medicines, notes } = data;

    const student = await User.findById(studentId);
    if (!student) throw new Error('Student not found');

    const doctor = await User.findById(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    const prescription = await Prescription.create({
      appointmentId,
      studentId,
      studentName: student.name,
      doctorId,
      doctorName: doctor.name,
      medicines,
      notes,
      status: 'Approved',
      verifiedBy: doctorId,
      verifiedAt: Date.now()
    });

    await Notification.create({
      title: 'New Prescription',
      message: `Dr. ${doctor.name} has issued a prescription for you.`,
      type: 'prescription',
      target: 'Specific User',
      targetUsers: [studentId],
      recipients: [studentId],
      link: `/student/prescriptions/${prescription._id}`,
      createdBy: doctorId,
      status: 'Sent',
      sentAt: Date.now()
    });

    emitToUser(studentId, 'new-prescription', {
      prescriptionId: prescription._id,
      doctorName: doctor.name
    });

    return prescription;
  }

  static async verifyPrescription(prescriptionId, status, pharmacistId, options = {}) {
    const { pharmacistNotes, rejectionReason } = options;

    const prescription = await Prescription.findById(prescriptionId)
      .populate('studentId', 'name email');

    if (!prescription) throw new Error('Prescription not found');
    if (prescription.status !== 'Pending') throw new Error('Prescription already processed');

    prescription.status = status;
    prescription.pharmacistNotes = pharmacistNotes;
    prescription.verifiedBy = pharmacistId;
    prescription.verifiedAt = Date.now();

    if (status === 'Rejected') {
      prescription.rejectionReason = rejectionReason;
    }

    await prescription.save();

    await Notification.create({
      title: `Prescription ${status}`,
      message: `Your prescription uploaded on ${prescription.createdAt.toLocaleDateString()} has been ${status.toLowerCase()}`,
      type: 'prescription',
      target: 'Specific User',
      targetUsers: [prescription.studentId._id],
      recipients: [prescription.studentId._id],
      link: `/student/prescriptions/${prescription._id}`,
      createdBy: pharmacistId,
      status: 'Sent',
      sentAt: Date.now()
    });

    if (status === 'Approved') {
      // sendPrescriptionReady is a named export
      await sendPrescriptionReady(prescription, prescription.studentId);
    }

    emitToUser(prescription.studentId._id, 'prescription-status-update', {
      prescriptionId: prescription._id,
      status,
      message: `Your prescription has been ${status.toLowerCase()}`
    });

    return prescription;
  }

  static async createOrderFromPrescription(prescriptionId, studentId, orderData) {
    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) throw new Error('Prescription not found');
    if (prescription.studentId.toString() !== studentId) throw new Error('Unauthorized');
    if (prescription.status !== 'Approved') throw new Error('Prescription not approved yet');

    // Map prescription medicines to order items (requires mapping to actual medicine IDs/prices)
    const items = prescription.medicines.map(med => ({
      medicineId: med.medicineId || null,
      name: med.name,
      price: med.price || 0,
      quantity: med.quantity || 1,
      requiresPrescription: true
    }));

    const order = await Order.create({
      studentId,
      studentName: orderData.studentName,
      studentEmail: orderData.studentEmail,
      items,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      address: orderData.address,
      prescriptionId: prescription._id,
      status: 'Pending'
    });

    return order;
  }

  static async getPrescriptionStats(pharmacistId) {
    const stats = await Prescription.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statsMap = { pending: 0, approved: 0, rejected: 0 };

    stats.forEach(s => {
      if (s._id === 'Pending') statsMap.pending = s.count;
      if (s._id === 'Approved') statsMap.approved = s.count;
      if (s._id === 'Rejected') statsMap.rejected = s.count;
    });

    const total = statsMap.pending + statsMap.approved + statsMap.rejected;

    return {
      total,
      pending: statsMap.pending,
      approved: statsMap.approved,
      rejected: statsMap.rejected,
      approvalRate: total > 0 ? (statsMap.approved / total * 100).toFixed(1) : 0
    };
  }
}

export default PrescriptionService;
