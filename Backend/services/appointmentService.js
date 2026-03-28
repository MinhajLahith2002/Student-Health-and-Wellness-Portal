// appointmentService.js

import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendAppointmentConfirmation } from '../utils/emailService.js';
import { emitToUser } from '../utils/socket.js';

class AppointmentService {
  static async getUserAppointments(userId, role, filters = {}) {
    const { status, startDate, endDate, page = 1, limit = 20 } = filters;
    const query = {};

    if (role === 'student') query.studentId = userId;
    else if (role === 'doctor') query.doctorId = userId;

    if (status && status !== 'All') query.status = status;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('studentId', 'name email phone')
        .populate('doctorId', 'name specialty profileImage')
        .sort({ date: 1, time: 1 })
        .limit(parseInt(limit))
        .skip(skip),
      Appointment.countDocuments(query)
    ]);

    return {
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getAppointmentById(appointmentId, userId, role) {
    const appointment = await Appointment.findById(appointmentId)
      .populate('studentId', 'name email phone allergies medicalHistory profileImage')
      .populate('doctorId', 'name specialty experience bio profileImage education');

    if (!appointment) throw new Error('Appointment not found');

    const isAuthorized =
      (role === 'student' && appointment.studentId._id.toString() === userId) ||
      (role === 'doctor' && appointment.doctorId._id.toString() === userId) ||
      role === 'admin';

    if (!isAuthorized) throw new Error('Unauthorized to view this appointment');

    return appointment;
  }

  static async bookAppointment(data, studentId) {
    const { doctorId, date, time, type, symptoms, notes } = data;

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    if (!doctor) throw new Error('Doctor not found or unavailable');

    const student = await User.findById(studentId);
    if (!student) throw new Error('Student not found');

    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      time,
      status: { $nin: ['Cancelled', 'Completed'] }
    });
    if (existingAppointment) throw new Error('Time slot already booked');

    const appointment = await Appointment.create({
      studentId,
      doctorId,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorImage: doctor.profileImage,
      studentName: student.name,
      date: new Date(date),
      time,
      type,
      symptoms,
      notes,
      status: 'Confirmed',
      meetingLink: type === 'Video Call'
        ? `https://meet.campushealth.edu/${Math.random().toString(36).substring(7)}`
        : null
    });

    await Notification.create({
      title: 'New Appointment',
      message: `${student.name} has booked an appointment with you on ${new Date(date).toLocaleDateString()} at ${time}`,
      type: 'appointment',
      target: 'Specific User',
      targetUsers: [doctorId],
      recipients: [doctorId],
      link: `/doctor/appointments/${appointment._id}`,
      createdBy: studentId
    });

    // ✅ Named export usage
    await sendAppointmentConfirmation(appointment, student, doctor);

    // ✅ Named export usage
    emitToUser(doctorId, 'new-appointment', {
      appointmentId: appointment._id,
      studentName: student.name,
      date: appointment.date,
      time: appointment.time
    });

    return appointment;
  }

  static async updateAppointmentStatus(appointmentId, status, userId, role, cancellationReason = null) {
    const appointment = await Appointment.findById(appointmentId)
      .populate('studentId', 'name email')
      .populate('doctorId', 'name email');

    if (!appointment) throw new Error('Appointment not found');

    const isAuthorized =
      (role === 'student' && appointment.studentId._id.toString() === userId) ||
      (role === 'doctor' && appointment.doctorId._id.toString() === userId) ||
      role === 'admin';

    if (!isAuthorized) throw new Error('Unauthorized to update this appointment');

    const oldStatus = appointment.status;
    appointment.status = status;

    if (status === 'Cancelled') {
      appointment.cancelledBy = role;
      appointment.cancelledAt = Date.now();
      appointment.cancellationReason = cancellationReason;
    }
    if (status === 'In Progress') appointment.startedAt = Date.now();
    if (status === 'Completed') appointment.completedAt = Date.now();

    await appointment.save();

    const notificationRecipient = role === 'student'
      ? appointment.doctorId._id
      : appointment.studentId._id;

    await Notification.create({
      title: `Appointment ${status}`,
      message: `Your appointment on ${appointment.date.toLocaleDateString()} at ${appointment.time} has been ${status.toLowerCase()}`,
      type: 'appointment',
      target: 'Specific User',
      targetUsers: [notificationRecipient],
      recipients: [notificationRecipient],
      link: role === 'student'
        ? `/student/appointments/${appointment._id}`
        : `/doctor/appointments/${appointment._id}`,
      createdBy: userId
    });

    emitToUser(notificationRecipient, 'appointment-status-update', {
      appointmentId: appointment._id,
      status,
      oldStatus,
      updatedBy: role
    });

    return appointment;
  }

  static async getDoctorAvailability(doctorId, date) {
    const existingAppointments = await Appointment.find({
      doctorId,
      date: new Date(date),
      status: { $nin: ['Cancelled', 'Completed'] }
    });

    const bookedSlots = existingAppointments.map(a => a.time);

    const allSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
      '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
      '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ];

    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    return {
      doctorId,
      date,
      availableSlots,
      bookedSlots,
      totalSlots: allSlots.length,
      availableCount: availableSlots.length
    };
  }

  static async getDoctorQueue(doctorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queue = await Appointment.find({
      doctorId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['Confirmed', 'In Progress'] }
    })
      .populate('studentId', 'name email')
      .sort({ time: 1 });

    return queue.map((appointment, index) => ({
      id: appointment._id,
      position: index + 1,
      studentName: appointment.studentId.name,
      studentId: appointment.studentId._id,
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      estimatedWaitTime: index * 15
    }));
  }

  static async getAppointmentStats(userId, role, dateRange = {}) {
    const query = {};
    if (role === 'student') query.studentId = userId;
    else if (role === 'doctor') query.doctorId = userId;

    if (dateRange.startDate && dateRange.endDate) {
      query.date = { $gte: new Date(dateRange.startDate), $lte: new Date(dateRange.endDate) };
    }

    const stats = await Appointment.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const statsMap = {};
    stats.forEach(s => { statsMap[s._id] = s.count; });

    return {
      total,
      confirmed: statsMap.Confirmed || 0,
      completed: statsMap.Completed || 0,
      cancelled: statsMap.Cancelled || 0,
      inProgress: statsMap['In Progress'] || 0,
      pending: statsMap.Pending || 0
    };
  }
}

export default AppointmentService;
