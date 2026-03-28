// controllers/appointmentController.js

import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import emailService from '../utils/emailService.js'; 

// @desc    Get user appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'student') {
      query.studentId = req.user.id;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user.id;
    }

    if (status && status !== 'All') query.status = status;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const appointments = await Appointment.find(query)
      .populate('studentId', 'name email')
      .populate('doctorId', 'name specialty')
      .sort({ date: -1, time: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('studentId', 'name email phone allergies medicalHistory')
      .populate('doctorId', 'name specialty experience bio image');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (req.user.role === 'student' && appointment.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (req.user.role === 'doctor' && appointment.doctorId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Book appointment
// @route   POST /api/appointments
// @access  Private
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, type, symptoms, notes } = req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const student = await User.findById(req.user.id);

    // Check if time slot is available
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      time,
      status: { $nin: ['Cancelled', 'Completed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot already booked' });
    }

    const appointment = await Appointment.create({
      studentId: req.user.id,
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
      status: 'Confirmed'
    });

    // Create notification for doctor
    await Notification.create({
      title: 'New Appointment',
      message: `${student.name} has booked an appointment with you on ${new Date(date).toLocaleDateString()} at ${time}`,
      type: 'appointment',
      target: 'Specific User',
      targetUsers: [doctorId],
      recipients: [doctorId],
      link: `/doctor/appointments/${appointment._id}`,
      createdBy: req.user.id,
      status: 'Sent',
      sentAt: Date.now()
    });

    // Send email notification using default import
    try {
      if (typeof emailService.sendEmail === 'function') {
        await emailService.sendEmail({
          to: doctor.email,
          subject: 'New Appointment Booking',
          html: `<p>${student.name} has booked an appointment with you on ${new Date(date).toLocaleDateString()} at ${time}.</p>`
        });
      } else if (typeof emailService === 'function') {
        // fallback if emailService itself is a function
        await emailService({
          to: doctor.email,
          subject: 'New Appointment Booking',
          html: `<p>${student.name} has booked an appointment with you on ${new Date(date).toLocaleDateString()} at ${time}.</p>`
        });
      } else {
        console.warn('emailService.sendEmail not available; skipping email send.');
      }
    } catch (emailErr) {
      console.warn('Failed to send appointment email:', emailErr);
    }

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('doctorId', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (req.user.role === 'doctor' && appointment.doctorId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (req.user.role === 'student' && appointment.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const oldStatus = appointment.status;
    appointment.status = status;

    if (status === 'Cancelled') {
      appointment.cancelledBy = req.user.role;
      appointment.cancelledAt = Date.now();
      appointment.cancellationReason = cancellationReason;
    }

    await appointment.save();

    // Create notification for student
    await Notification.create({
      title: `Appointment ${status}`,
      message: `Your appointment on ${appointment.date.toLocaleDateString()} at ${appointment.time} has been ${status.toLowerCase()}`,
      type: 'appointment',
      target: 'Specific User',
      targetUsers: [appointment.studentId._id],
      recipients: [appointment.studentId._id],
      link: `/student/appointments/${appointment._id}`,
      createdBy: req.user.id,
      status: 'Sent',
      sentAt: Date.now()
    });

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: `Appointment ${status}`,
      module: 'Appointments',
      details: `Appointment ID: ${appointment._id} changed from ${oldStatus} to ${status}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'info',
      createdAt: Date.now()
    });

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor availability
// @route   GET /api/appointments/availability/:doctorId
// @access  Public
const getDoctorAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    const doctorId = req.params.doctorId;

    const existingAppointments = await Appointment.find({
      doctorId,
      date: new Date(date),
      status: { $nin: ['Cancelled', 'Completed'] }
    });

    const bookedSlots = existingAppointments.map(a => a.time);

    // Define available time slots
    const allSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
      '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
      '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ];

    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({ availableSlots, bookedSlots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor queue
// @route   GET /api/appointments/queue
// @access  Private/Doctor
const getDoctorQueue = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queue = await Appointment.find({
      doctorId: req.user.id,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['Confirmed', 'In Progress'] }
    }).sort({ time: 1 });

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getAppointments,
  getAppointmentById,
  bookAppointment,
  updateAppointmentStatus,
  getDoctorAvailability,
  getDoctorQueue
};