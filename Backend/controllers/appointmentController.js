import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import emailService from '../utils/emailService.js';
import { getAvailabilityForProvider } from '../services/availabilityService.js';
import { isDateTimeInPast, normalizeDateOnly } from '../utils/timeSlots.js';

function createDemoMeetingLink(id) {
  return `https://campushealth.local/consultation/${id}`;
}

function canAccessAppointment(req, appointment) {
  if (req.user.role === 'student') {
    return appointment.studentId.toString() === req.user.id;
  }

  if (req.user.role === 'doctor') {
    return appointment.doctorId.toString() === req.user.id;
  }

  return req.user.role === 'admin';
}

const getAppointments = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'student') {
      query.studentId = req.user.id;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user.id;
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (status && status !== 'All') query.status = status;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const appointments = await Appointment.find(query)
      .populate('studentId', 'name email studentId profileImage')
      .populate('doctorId', 'name specialty profileImage')
      .sort({ date: 1, time: 1 })
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

const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('studentId', 'name email phone allergies medicalHistory studentId profileImage bloodType')
      .populate('doctorId', 'name specialty experience bio profileImage education');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (!canAccessAppointment(req, appointment)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, type, symptoms, notes } = req.body;

    if (!doctorId || !date || !time || !type) {
      return res.status(400).json({ message: 'Doctor, date, time, and consultation type are required' });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const student = await User.findById(req.user.id).select('name');
    const appointmentDate = normalizeDateOnly(date);

    if (isDateTimeInPast(appointmentDate, time)) {
      return res.status(400).json({ message: 'Appointments must be booked for a future time slot' });
    }

    const availability = await getAvailabilityForProvider({
      providerId: doctorId,
      role: 'doctor',
      date: appointmentDate
    });

    if (!availability.availableSlots.includes(time)) {
      return res.status(400).json({ message: 'Selected time slot is unavailable' });
    }

    const appointment = await Appointment.create({
      studentId: req.user.id,
      doctorId,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty || 'General Physician',
      doctorImage: doctor.profileImage,
      studentName: student?.name || req.user.name,
      date: appointmentDate,
      time,
      type,
      symptoms: symptoms?.trim() || '',
      notes: notes?.trim() || '',
      status: 'Confirmed',
      meetingLink: type === 'Video Call' ? createDemoMeetingLink(Date.now()) : null,
      location: type === 'In-Person' ? 'Campus Health Center' : null
    });

    await Notification.create({
      title: 'New Appointment',
      message: `${student?.name || req.user.name} has booked an appointment with you on ${appointmentDate.toLocaleDateString()} at ${time}.`,
      type: 'appointment',
      target: 'Specific User',
      targetUsers: [doctorId],
      recipients: [doctorId],
      link: `/doctor/consultation/${appointment._id}`,
      createdBy: req.user.id,
      status: 'Sent',
      sentAt: Date.now()
    });

    try {
      if (typeof emailService.sendEmail === 'function') {
        await emailService.sendEmail({
          to: doctor.email,
          subject: 'New Appointment Booking',
          html: `<p>${student?.name || req.user.name} has booked an appointment with you on ${appointmentDate.toLocaleDateString()} at ${time}.</p>`
        });
      }
    } catch (emailErr) {
      console.warn('Failed to send appointment email:', emailErr.message);
    }

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('doctorId', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (!canAccessAppointment(req, appointment)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const studentStatuses = ['Cancelled'];
    const doctorStatuses = ['Confirmed', 'Ready', 'In Progress', 'Completed', 'Cancelled', 'No Show'];

    if (req.user.role === 'student' && !studentStatuses.includes(status)) {
      return res.status(403).json({ message: 'Students can only cancel appointments' });
    }

    if (req.user.role === 'doctor' && !doctorStatuses.includes(status)) {
      return res.status(403).json({ message: 'Invalid status transition' });
    }

    const oldStatus = appointment.status;
    appointment.status = status;

    if (status === 'Cancelled') {
      appointment.cancelledBy = req.user.role;
      appointment.cancelledAt = Date.now();
      appointment.cancellationReason = cancellationReason || '';
    }

    await appointment.save();

    await Notification.create({
      title: `Appointment ${status}`,
      message: `Your appointment on ${appointment.date.toLocaleDateString()} at ${appointment.time} has been ${status.toLowerCase()}.`,
      type: 'appointment',
      target: 'Specific User',
      targetUsers: [appointment.studentId._id],
      recipients: [appointment.studentId._id],
      link: `/student/appointments/${appointment._id}`,
      createdBy: req.user.id,
      status: 'Sent',
      sentAt: Date.now()
    });

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

const rescheduleAppointment = async (req, res) => {
  try {
    const { date, time, type } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (!canAccessAppointment(req, appointment)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (['Completed', 'Cancelled', 'No Show'].includes(appointment.status)) {
      return res.status(400).json({ message: 'This appointment can no longer be rescheduled' });
    }

    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required' });
    }

    const appointmentDate = normalizeDateOnly(date);

    if (isDateTimeInPast(appointmentDate, time)) {
      return res.status(400).json({ message: 'Appointments must be rescheduled to a future time slot' });
    }

    const availability = await getAvailabilityForProvider({
      providerId: appointment.doctorId,
      role: 'doctor',
      date: appointmentDate,
      excludeId: appointment._id
    });

    if (!availability.availableSlots.includes(time)) {
      return res.status(400).json({ message: 'Selected time slot is unavailable' });
    }

    appointment.date = appointmentDate;
    appointment.time = time;
    appointment.type = type || appointment.type;
    appointment.status = 'Confirmed';
    appointment.meetingLink = appointment.type === 'Video Call' ? createDemoMeetingLink(appointment._id) : null;
    appointment.location = appointment.type === 'In-Person' ? 'Campus Health Center' : null;

    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkInAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (appointment.status !== 'Confirmed') {
      return res.status(400).json({ message: 'Only confirmed appointments can be checked in' });
    }

    const today = normalizeDateOnly(new Date());
    if (normalizeDateOnly(appointment.date).getTime() !== today.getTime()) {
      return res.status(400).json({ message: 'Appointments can only be checked in on the scheduled date' });
    }

    appointment.checkInAt = new Date();
    appointment.status = 'Ready';
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateConsultation = async (req, res) => {
  try {
    const {
      consultationNotes,
      diagnosis,
      followUpDate,
      followUpReason,
      meetingLink,
      location,
      status,
      prescriptionId
    } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    appointment.consultationNotes = consultationNotes ?? appointment.consultationNotes;
    appointment.diagnosis = diagnosis ?? appointment.diagnosis;
    appointment.followUpDate = followUpDate ? normalizeDateOnly(followUpDate) : appointment.followUpDate;
    appointment.followUpReason = followUpReason ?? appointment.followUpReason;
    appointment.meetingLink = meetingLink ?? appointment.meetingLink;
    appointment.location = location ?? appointment.location;

    if (prescriptionId) {
      appointment.prescriptionId = prescriptionId;
    }

    if (status && ['Confirmed', 'Ready', 'In Progress', 'Completed', 'No Show'].includes(status)) {
      appointment.status = status;
    }

    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorAvailability = async (req, res) => {
  try {
    const doctor = await User.findById(req.params.doctorId).select('name role specialty profileImage');
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const availability = await getAvailabilityForProvider({
      providerId: req.params.doctorId,
      role: 'doctor',
      date: req.query.date || new Date().toISOString().slice(0, 10)
    });

    res.json({
      provider: doctor,
      availableSlots: availability.availableSlots,
      bookedSlots: availability.bookedSlots,
      configuredSlots: availability.configuredSlots,
      entries: availability.entries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorQueue = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queue = await Appointment.find({
      doctorId: req.user.id,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['Confirmed', 'Ready', 'In Progress'] }
    })
      .populate('studentId', 'name email studentId profileImage')
      .sort({ time: 1 });

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorPatients = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.id })
      .populate('studentId', 'name email studentId profileImage')
      .sort({ date: -1, time: -1 });

    const patientMap = new Map();

    appointments.forEach((appointment) => {
      const student = appointment.studentId;
      if (!student) return;

      const key = student._id.toString();
      if (!patientMap.has(key)) {
        patientMap.set(key, {
          _id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          profileImage: student.profileImage,
          lastVisit: appointment.date,
          totalVisits: 1,
          latestStatus: appointment.status,
          latestAppointmentId: appointment._id
        });
        return;
      }

      const existing = patientMap.get(key);
      existing.totalVisits += 1;
    });

    res.json({ patients: [...patientMap.values()] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorPatientById = async (req, res) => {
  try {
    const hasRelationship = await Appointment.exists({
      doctorId: req.user.id,
      studentId: req.params.studentId
    });

    if (!hasRelationship) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const [patient, appointments, prescriptions] = await Promise.all([
      User.findById(req.params.studentId).select('name email studentId profileImage allergies medicalHistory bloodType gender dateOfBirth'),
      Appointment.find({ doctorId: req.user.id, studentId: req.params.studentId }).sort({ date: -1, time: -1 }),
      Prescription.find({ doctorId: req.user.id, studentId: req.params.studentId }).sort({ createdAt: -1 })
    ]);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ patient, appointments, prescriptions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getAppointments,
  getAppointmentById,
  bookAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  checkInAppointment,
  updateConsultation,
  getDoctorAvailability,
  getDoctorQueue,
  getDoctorPatients,
  getDoctorPatientById
};
