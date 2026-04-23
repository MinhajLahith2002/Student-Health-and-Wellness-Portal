// controllers/prescriptionController.js

import { unlink } from 'fs/promises';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import cloudinaryService from '../utils/cloudinaryService.js';
import { generatePrescriptionReview } from '../utils/prescriptionReviewService.js';

const { uploadPrescription: uploadPrescriptionImage, isCloudinaryConfigured } = cloudinaryService;

function hasValidMedicines(medicines) {
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return false;
  }

  return medicines.every((medicine) => (
    medicine
    && typeof medicine === 'object'
    && `${medicine.name || ''}`.trim()
    && `${medicine.dosage || ''}`.trim()
    && `${medicine.duration || ''}`.trim()
    && `${medicine.instructions || ''}`.trim()
  ));
}

// @desc    Get prescriptions
// @route   GET /api/prescriptions
// @access  Private
const getPrescriptions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'student') {
      query.studentId = req.user.id;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user.id;
    } else if (req.user.role === 'pharmacist') {
      query.status = status || 'Pending';
    }

    if (status && status !== 'All') query.status = status;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const prescriptions = await Prescription.find(query)
      .populate('studentId', 'name email')
      .populate('doctorId', 'name specialty')
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Prescription.countDocuments(query);

    res.json({
      prescriptions,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload prescription
// @route   POST /api/prescriptions/upload
// @access  Private/Student
const uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const isImageFile = req.file.mimetype?.startsWith('image/');
    const isPdfFile = req.file.mimetype === 'application/pdf';

    if (!isImageFile && !isPdfFile) {
      if (req.file.path) {
        await unlink(req.file.path).catch(() => {});
      }

      return res.status(400).json({
        message: 'Prescription upload only supports image files or PDFs.'
      });
    }

    let imageUrl = `/uploads/prescriptions/${req.file.filename}`;
    let imagePublicId = null;

    if (isCloudinaryConfigured() && isImageFile) {
      const result = await uploadPrescriptionImage(req.file.path);
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const prescription = await Prescription.create({
      studentId: req.user.id,
      studentName: req.user.name,
      status: 'Pending',
      imageUrl,
      fileMimeType: req.file.mimetype,
      imagePublicId,
      notes: req.body.notes
    });

    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate prescription review assistant output
// @route   GET /api/prescriptions/:id/review
// @access  Private/Pharmacist
const getPrescriptionReview = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('studentId', 'name email studentId')
      .populate('doctorId', 'name specialty');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const duplicateCount = await Prescription.countDocuments({
      studentId: prescription.studentId?._id || prescription.studentId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const review = await generatePrescriptionReview(prescription, duplicateCount);
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify prescription (Pharmacist)
// @route   PUT /api/prescriptions/:id/verify
// @access  Private/Pharmacist
const verifyPrescription = async (req, res) => {
  try {
    const { status, pharmacistNotes, rejectionReason } = req.body;
    const prescription = await Prescription.findById(req.params.id)
      .populate('studentId', 'name email');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    prescription.status = status;
    prescription.pharmacistNotes = pharmacistNotes;

    if (status === 'Rejected') {
      prescription.rejectionReason = rejectionReason;
    }

    if (status === 'Approved') {
      prescription.verifiedBy = req.user.id;
      prescription.verifiedAt = Date.now();
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
      createdBy: req.user.id,
      status: 'Sent',
      sentAt: Date.now()
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: `Prescription ${status}`,
      module: 'Prescriptions',
      details: `Prescription ID: ${prescription._id} ${status.toLowerCase()}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: status === 'Approved' ? 'success' : 'warning',
      timestamp: Date.now()
    });

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('studentId', 'name email phone')
      .populate('doctorId', 'name specialty');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const isOwnerStudent = prescription.studentId?._id?.toString() === req.user.id;
    const isAssignedDoctor = prescription.doctorId?._id?.toString() === req.user.id;
    const isPrivilegedRole = ['pharmacist', 'admin'].includes(req.user.role);

    if (!isOwnerStudent && !isAssignedDoctor && !isPrivilegedRole) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create prescription (Doctor)
// @route   POST /api/prescriptions
// @access  Private/Doctor
const createPrescription = async (req, res) => {
  try {
    const { appointmentId, studentId, medicines, notes } = req.body;

    if (!appointmentId || !studentId) {
      return res.status(400).json({ message: 'Appointment ID and student ID are required' });
    }

    if (!hasValidMedicines(medicines)) {
      return res.status(400).json({ message: 'At least one valid medicine is required' });
    }

    const appointment = await Appointment.findById(appointmentId)
      .select('doctorId studentId studentName prescriptionId');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctorId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to prescribe for this appointment' });
    }

    if (appointment.studentId?.toString() !== `${studentId}`) {
      return res.status(400).json({ message: 'Selected student does not match the appointment' });
    }

    const existingPrescription = await Prescription.findOne({
      appointmentId,
      studentId,
      doctorId: req.user.id,
      status: 'Approved'
    }).sort({ createdAt: -1 });

    if (existingPrescription) {
      if (appointment.prescriptionId?.toString() !== existingPrescription._id.toString()) {
        appointment.prescriptionId = existingPrescription._id;
        await appointment.save();
      }

      return res.status(200).json(existingPrescription);
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const prescription = await Prescription.create({
      appointmentId,
      studentId,
      studentName: appointment.studentName || student.name,
      doctorId: req.user.id,
      doctorName: req.user.name,
      medicines,
      notes,
      status: 'Approved'
    });

    if (appointment.prescriptionId?.toString() !== prescription._id.toString()) {
      appointment.prescriptionId = prescription._id;
      await appointment.save();
    }

    await Notification.create({
      title: 'New Prescription',
      message: `Dr. ${req.user.name} has issued a prescription for you.`,
      type: 'prescription',
      target: 'Specific User',
      targetUsers: [studentId],
      recipients: [studentId],
      link: `/student/prescriptions/${prescription._id}`,
      createdBy: req.user.id,
      status: 'Sent',
      sentAt: Date.now()
    });

    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getPrescriptions,
  uploadPrescription,
  getPrescriptionReview,
  verifyPrescription,
  getPrescriptionById,
  createPrescription
};
