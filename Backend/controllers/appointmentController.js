import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import emailService from '../utils/emailService.js';
import { getAvailabilityForProvider } from '../services/availabilityService.js';
import {
  applyVideoMeetingDetails,
  broadcastQueueSnapshot,
  getDoctorQueueSnapshot
} from '../services/appointmentWorkflowService.js';
import {
  generateSlots,
  getDateRange,
  isDateTimeInPast,
  normalizeDateOnly,
  toMinutes
} from '../utils/timeSlots.js';
import { getDoctorScopeIds } from '../utils/doctorScope.js';
import { emitAppointmentUpdate, emitAvailabilityUpdate, emitNotification } from '../utils/socket.js';

const ACTIVE_BOOKING_STATUSES = ['Pending', 'Confirmed', 'Ready', 'In Progress'];
const CONSULTATION_TYPES = ['Video Call', 'In-Person'];
const CONSULTATION_FIELDS = [
  'consultationNotes',
  'diagnosis',
  'followUpDate',
  'followUpReason',
  'meetingLink',
  'location',
  'prescriptionId'
];
const STATUS_TRANSITIONS = {
  student: {
    Pending: ['Cancelled'],
    Confirmed: ['Cancelled'],
    Ready: ['Cancelled']
  },
  doctor: {
    Pending: ['Confirmed', 'Cancelled'],
    Confirmed: ['Ready', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
    Ready: ['Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
    'In Progress': ['Completed', 'Cancelled']
  },
  admin: {
    Pending: ['Confirmed', 'Cancelled'],
    Confirmed: ['Ready', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
    Ready: ['Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
    'In Progress': ['Completed', 'Cancelled']
  }
};

function cleanText(value, maxLength = 500) {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, maxLength);
}

function matchesTime(left, right) {
  const leftMinutes = toMinutes(left);
  const rightMinutes = toMinutes(right);
  return leftMinutes !== null && rightMinutes !== null && leftMinutes === rightMinutes;
}

function isToday(dateValue) {
  return normalizeDateOnly(dateValue).getTime() === normalizeDateOnly(new Date()).getTime();
}

function extractId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  return value.toString();
}

function canAccessAppointment(req, appointment) {
  if (req.user.role === 'student') {
    return extractId(appointment.studentId) === req.user.id;
  }

  if (req.user.role === 'doctor') {
    return extractId(appointment.doctorId) === req.user.id;
  }

  return req.user.role === 'admin';
}

function getReschedulePayload(body = {}) {
  return {
    date: body.date || body.newDate,
    time: body.time || body.newTime,
    type: body.type
  };
}

function hasConsultationPayload(body = {}) {
  return CONSULTATION_FIELDS.some((field) => body[field] !== undefined);
}

function formatAppointmentLabel(dateValue, timeValue) {
  return `${normalizeDateOnly(dateValue).toLocaleDateString()} at ${timeValue}`;
}

function isAllowedTransition(role, currentStatus, nextStatus) {
  if (!nextStatus || currentStatus === nextStatus) return true;
  return Boolean(STATUS_TRANSITIONS[role]?.[currentStatus]?.includes(nextStatus));
}

function slotSupportsConsultationType(entries = [], requestedTime, type) {
  if (!entries.length) {
    return CONSULTATION_TYPES.includes(type);
  }

  return entries.some((entry) => {
    const supportsRequestedType =
      !Array.isArray(entry.consultationTypes) ||
      entry.consultationTypes.length === 0 ||
      entry.consultationTypes.includes(type);

    if (!supportsRequestedType) return false;

    const entrySlots = generateSlots({
      startTime: entry.startTime,
      endTime: entry.endTime,
      slotDuration: entry.slotDuration,
      breaks: entry.breaks
    });

    return entrySlots.some((slot) => matchesTime(slot, requestedTime));
  });
}

async function safeSendEmail(options) {
  try {
    if (typeof emailService.sendEmail === 'function') {
      await emailService.sendEmail(options);
    }
  } catch (error) {
    console.warn('Appointment email delivery failed:', error.message);
  }
}

async function createAppointmentNotification({
  recipientId,
  createdBy,
  title,
  message,
  link
}) {
  if (!recipientId) return null;

  const notification = await Notification.create({
    title,
    message,
    type: 'appointment',
    target: 'Specific User',
    targetUsers: [recipientId],
    recipients: [recipientId],
    link,
    createdBy,
    status: 'Sent',
    sentAt: Date.now()
  });

  emitNotification(recipientId.toString(), {
    id: notification._id.toString(),
    title,
    message,
    type: 'appointment',
    link
  });

  return notification;
}

async function writeAuditLog(req, action, details, metadata = {}, level = 'info') {
  try {
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action,
      module: 'Appointments',
      details,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level,
      metadata
    });
  } catch (error) {
    console.warn('Failed to create appointment audit log:', error.message);
  }
}

function broadcastAvailabilityImpact({
  action,
  appointment,
  doctorId,
  date,
  status
}) {
  const resolvedDoctorId = extractId(doctorId || appointment?.doctorId);
  const resolvedDate = date || appointment?.date;

  if (!resolvedDoctorId || !resolvedDate) return;

  emitAvailabilityUpdate({
    action,
    providerId: resolvedDoctorId,
    role: 'doctor',
    appointmentId: appointment?._id?.toString?.() || null,
    date: normalizeDateOnly(resolvedDate),
    status: status || appointment?.status || null
  });
}

async function validateBookableSlot({
  doctorId,
  date,
  time,
  type,
  availabilityId = null,
  excludeAppointmentId = null
}) {
  const appointmentDate = normalizeDateOnly(date);

  if (!CONSULTATION_TYPES.includes(type)) {
    const error = new Error('Invalid consultation type');
    error.statusCode = 400;
    throw error;
  }

  if (toMinutes(time) === null) {
    const error = new Error('Invalid appointment time');
    error.statusCode = 400;
    throw error;
  }

  if (isDateTimeInPast(appointmentDate, time)) {
    const error = new Error('Appointments must be scheduled for a future time slot');
    error.statusCode = 400;
    throw error;
  }

  const availability = await getAvailabilityForProvider({
    providerId: doctorId,
    role: 'doctor',
    date: appointmentDate,
    excludeId: excludeAppointmentId
  });

  const slotAvailable = availability.availableSlots.some((slot) => matchesTime(slot, time));
  if (!slotAvailable) {
    const error = new Error('Selected time slot is unavailable');
    error.statusCode = 400;
    throw error;
  }

  if (!slotSupportsConsultationType(availability.entries, time, type)) {
    const error = new Error(`Selected slot does not support ${type.toLowerCase()} consultations`);
    error.statusCode = 400;
    throw error;
  }

  const matchingEntries = availability.entries.filter((entry) => {
    const supportsRequestedType =
      !Array.isArray(entry.consultationTypes) ||
      entry.consultationTypes.length === 0 ||
      entry.consultationTypes.includes(type);

    if (!supportsRequestedType) return false;

    const entrySlots = generateSlots({
      startTime: entry.startTime,
      endTime: entry.endTime,
      slotDuration: entry.slotDuration,
      breaks: entry.breaks
    });

    return entrySlots.some((slot) => matchesTime(slot, time));
  });

  if (matchingEntries.length === 0) {
    const error = new Error('Selected time slot does not belong to an active availability block');
    error.statusCode = 400;
    throw error;
  }

  let selectedAvailability = matchingEntries[0];
  if (availabilityId) {
    selectedAvailability = matchingEntries.find((entry) => entry._id.toString() === availabilityId);

    if (!selectedAvailability) {
      const error = new Error('Selected availability block is no longer valid for this time slot');
      error.statusCode = 400;
      throw error;
    }
  }

  const { start, end } = getDateRange(appointmentDate);
  const existingAppointments = await Appointment.find({
    doctorId,
    date: { $gte: start, $lt: end },
    status: { $in: ACTIVE_BOOKING_STATUSES },
    ...(excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {})
  }).select('time studentId');

  const slotAlreadyTaken = existingAppointments.some((entry) => matchesTime(entry.time, time));
  if (slotAlreadyTaken) {
    const error = new Error('Selected time slot has already been booked');
    error.statusCode = 409;
    throw error;
  }

  return {
    appointmentDate,
    availability,
    selectedAvailability
  };
}

async function hydrateVideoMeetingIfNeeded(appointment) {
  if (!appointment || appointment.type !== 'Video Call') return appointment;
  if (appointment.meetingRoom && appointment.meetingLink) return appointment;

  applyVideoMeetingDetails(appointment);
  await appointment.save();
  return appointment;
}

async function broadcastQueueIfToday(doctorId, dateValue) {
  if (!doctorId || !dateValue || !isToday(dateValue)) return null;
  return broadcastQueueSnapshot({ doctorId, date: dateValue });
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

    if (status && status !== 'All') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = normalizeDateOnly(startDate);
      }
      if (endDate) {
        const endBoundary = normalizeDateOnly(endDate);
        endBoundary.setDate(endBoundary.getDate() + 1);
        query.date.$lt = endBoundary;
      }
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('studentId', 'name email studentId profileImage')
        .populate('doctorId', 'name specialty profileImage')
        .sort({ date: 1, time: 1 })
        .limit(parsedLimit)
        .skip((parsedPage - 1) * parsedLimit),
      Appointment.countDocuments(query)
    ]);

    res.json({
      appointments,
      totalPages: Math.ceil(total / parsedLimit) || 1,
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

    await hydrateVideoMeetingIfNeeded(appointment);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const doctorId = cleanText(req.body.doctorId, 64);
    const availabilityId = cleanText(req.body.availabilityId, 64);
    const date = req.body.date;
    const time = cleanText(req.body.time, 20);
    const type = cleanText(req.body.type, 20);
    const symptoms = cleanText(req.body.symptoms, 1000);
    const notes = cleanText(req.body.notes, 500);

    if (!doctorId || !date || !time || !type) {
      return res.status(400).json({ message: 'Doctor, date, time, and consultation type are required' });
    }

    const doctor = await User.findById(doctorId).select('name specialty profileImage email role isActive');
    if (!doctor || doctor.role !== 'doctor' || !doctor.isActive) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const student = await User.findById(req.user.id).select('name email');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { appointmentDate, selectedAvailability } = await validateBookableSlot({
      doctorId,
      date,
      time,
      type,
      availabilityId: availabilityId || null
    });

    const appointment = new Appointment({
      studentId: req.user.id,
      doctorId,
      availabilityId: selectedAvailability?._id || null,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty || 'General Physician',
      doctorImage: doctor.profileImage || '',
      studentName: student.name || req.user.name,
      date: appointmentDate,
      time,
      duration: 30,
      type,
      symptoms,
      notes,
      status: 'Confirmed',
      location: type === 'In-Person' ? 'Campus Health Center' : null
    });

    applyVideoMeetingDetails(appointment);
    await appointment.save();

    const appointmentLabel = formatAppointmentLabel(appointment.date, appointment.time);

    await Promise.all([
      createAppointmentNotification({
        recipientId: doctor._id,
        createdBy: req.user.id,
        title: 'New appointment booked',
        message: `${student.name} booked an appointment for ${appointmentLabel}.`,
        link: `/doctor/consultation/${appointment._id}`
      }),
      createAppointmentNotification({
        recipientId: student._id,
        createdBy: req.user.id,
        title: 'Appointment confirmed',
        message: `Your appointment with ${doctor.name} is confirmed for ${appointmentLabel}.`,
        link: appointment.type === 'Video Call'
          ? `/student/consultation/${appointment._id}`
          : `/student/appointments/${appointment._id}/queue`
      })
    ]);

    await Promise.all([
      safeSendEmail({
        to: doctor.email,
        subject: 'New appointment booking',
        html: `<p>${student.name} booked an appointment for ${appointmentLabel}.</p>`
      }),
      typeof emailService.sendAppointmentConfirmation === 'function'
        ? emailService.sendAppointmentConfirmation(appointment, student, doctor)
        : safeSendEmail({
            to: student.email,
            subject: 'Appointment confirmed',
            html: `<p>Your appointment with ${doctor.name} is confirmed for ${appointmentLabel}.</p>`
          })
    ]);

    emitAppointmentUpdate(appointment._id.toString(), {
      status: appointment.status,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      meetingLink: appointment.meetingLink
    });

    broadcastAvailabilityImpact({
      action: 'appointment-booked',
      appointment
    });

    await writeAuditLog(
      req,
      'Appointment Booked',
      `Appointment ${appointment._id} booked with ${doctor.name} for ${appointmentLabel}`,
      {
        appointmentId: appointment._id.toString(),
        doctorId: doctor._id.toString(),
        studentId: student._id.toString()
      },
      'success'
    );

    await broadcastQueueIfToday(doctor._id, appointment.date);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const status = cleanText(req.body.status, 30);
    const cancellationReason = cleanText(req.body.cancellationReason, 500);
    const appointment = await Appointment.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('doctorId', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (!canAccessAppointment(req, appointment)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    if (!isAllowedTransition(req.user.role, appointment.status, status)) {
      return res.status(400).json({
        message: `Cannot change appointment from ${appointment.status} to ${status}`
      });
    }

    if (status === 'No Show' && !isDateTimeInPast(appointment.date, appointment.time)) {
      return res.status(400).json({ message: 'No Show can only be marked after the appointment time has passed' });
    }

    const previousStatus = appointment.status;
    appointment.status = status;

    if (status === 'Cancelled') {
      appointment.cancelledBy = req.user.role;
      appointment.cancelledAt = new Date();
      appointment.cancellationReason = cancellationReason;
    } else {
      appointment.cancelledBy = undefined;
      appointment.cancelledAt = undefined;
      appointment.cancellationReason = '';
    }

    if (status === 'Ready' && !appointment.checkInAt) {
      appointment.checkInAt = new Date();
    }

    if (status === 'In Progress' && !appointment.startedAt) {
      appointment.startedAt = new Date();
    }

    if (status === 'Completed' && !appointment.completedAt) {
      appointment.completedAt = new Date();
    }

    if (appointment.type === 'Video Call') {
      applyVideoMeetingDetails(appointment);
    }

    await appointment.save();

    const notifyDoctor = req.user.role === 'student' || req.user.role === 'admin';
    const notifyStudent = req.user.role === 'doctor' || req.user.role === 'admin';
    const appointmentLabel = formatAppointmentLabel(appointment.date, appointment.time);

    await Promise.all([
      notifyDoctor
        ? createAppointmentNotification({
            recipientId: appointment.doctorId._id,
            createdBy: req.user.id,
            title: `Appointment ${status}`,
            message: `${appointment.studentName} marked the appointment for ${appointmentLabel} as ${status.toLowerCase()}.`,
            link: `/doctor/consultation/${appointment._id}`
          })
        : null,
      notifyStudent
        ? createAppointmentNotification({
            recipientId: appointment.studentId._id,
            createdBy: req.user.id,
            title: `Appointment ${status}`,
            message: `Your appointment with ${appointment.doctorName} for ${appointmentLabel} is now ${status.toLowerCase()}.`,
            link: appointment.type === 'Video Call'
              ? `/student/consultation/${appointment._id}`
              : `/student/appointments/${appointment._id}/queue`
          })
        : null
    ]);

    emitAppointmentUpdate(appointment._id.toString(), {
      status: appointment.status,
      previousStatus,
      cancellationReason: appointment.cancellationReason,
      checkInAt: appointment.checkInAt,
      startedAt: appointment.startedAt,
      completedAt: appointment.completedAt,
      meetingLink: appointment.meetingLink
    });

    broadcastAvailabilityImpact({
      action: 'appointment-status-updated',
      appointment,
      status: appointment.status
    });

    await writeAuditLog(
      req,
      `Appointment ${status}`,
      `Appointment ${appointment._id} moved from ${previousStatus} to ${status}`,
      {
        appointmentId: appointment._id.toString(),
        previousStatus,
        status
      },
      status === 'Cancelled' ? 'warning' : 'info'
    );

    await broadcastQueueIfToday(appointment.doctorId._id, appointment.date);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rescheduleAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('doctorId', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (!canAccessAppointment(req, appointment)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (['Completed', 'Cancelled', 'No Show', 'In Progress'].includes(appointment.status)) {
      return res.status(400).json({ message: 'This appointment can no longer be rescheduled' });
    }

    const payload = getReschedulePayload(req.body);
    const nextType = cleanText(payload.type, 20) || appointment.type;
    const nextAvailabilityId = cleanText(req.body.availabilityId, 64);

    if (!payload.date || !payload.time) {
      return res.status(400).json({ message: 'Date and time are required' });
    }

    const previousDate = appointment.date;
    const previousTime = appointment.time;
    const previousType = appointment.type;

    const { appointmentDate, selectedAvailability } = await validateBookableSlot({
      doctorId: appointment.doctorId._id,
      date: payload.date,
      time: payload.time,
      type: nextType,
      availabilityId: nextAvailabilityId || null,
      excludeAppointmentId: appointment._id
    });

    appointment.date = appointmentDate;
    appointment.time = cleanText(payload.time, 20);
    appointment.type = nextType;
    appointment.availabilityId = selectedAvailability?._id || null;
    appointment.status = 'Confirmed';
    appointment.checkInAt = null;
    appointment.startedAt = null;
    appointment.completedAt = null;
    appointment.cancelledBy = undefined;
    appointment.cancelledAt = undefined;
    appointment.cancellationReason = '';
    appointment.location = appointment.type === 'In-Person' ? 'Campus Health Center' : null;

    if (appointment.type === 'Video Call') {
      applyVideoMeetingDetails(appointment);
    } else {
      appointment.meetingProvider = null;
      appointment.meetingDomain = null;
      appointment.meetingRoom = null;
      appointment.meetingLink = null;
    }

    await appointment.save();

    const appointmentLabel = formatAppointmentLabel(appointment.date, appointment.time);
    await Promise.all([
      createAppointmentNotification({
        recipientId: appointment.studentId._id,
        createdBy: req.user.id,
        title: 'Appointment rescheduled',
        message: `Your appointment is now scheduled for ${appointmentLabel}.`,
        link: appointment.type === 'Video Call'
          ? `/student/consultation/${appointment._id}`
          : `/student/appointments/${appointment._id}/queue`
      }),
      createAppointmentNotification({
        recipientId: appointment.doctorId._id,
        createdBy: req.user.id,
        title: 'Appointment rescheduled',
        message: `${appointment.studentName}'s appointment has been moved to ${appointmentLabel}.`,
        link: `/doctor/consultation/${appointment._id}`
      })
    ]);

    emitAppointmentUpdate(appointment._id.toString(), {
      status: appointment.status,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      previousDate,
      previousTime,
      previousType,
      meetingLink: appointment.meetingLink
    });

    broadcastAvailabilityImpact({
      action: 'appointment-rescheduled-release',
      appointment,
      doctorId: appointment.doctorId,
      date: previousDate,
      status: 'Released'
    });
    broadcastAvailabilityImpact({
      action: 'appointment-rescheduled-booked',
      appointment,
      doctorId: appointment.doctorId,
      date: appointment.date,
      status: appointment.status
    });

    await writeAuditLog(
      req,
      'Appointment Rescheduled',
      `Appointment ${appointment._id} moved from ${formatAppointmentLabel(previousDate, previousTime)} to ${appointmentLabel}`,
      {
        appointmentId: appointment._id.toString(),
        previousDate,
        previousTime,
        previousType,
        nextDate: appointment.date,
        nextTime: appointment.time,
        nextType: appointment.type
      }
    );

    await Promise.all([
      broadcastQueueIfToday(appointment.doctorId._id, previousDate),
      broadcastQueueIfToday(appointment.doctorId._id, appointment.date)
    ]);

    res.json(appointment);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const checkInAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId', 'name email')
      .populate('studentId', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (['Ready', 'In Progress'].includes(appointment.status) && appointment.checkInAt) {
      return res.json(appointment);
    }

    if (appointment.status !== 'Confirmed') {
      return res.status(400).json({ message: 'Only confirmed appointments can be checked in' });
    }

    if (!isToday(appointment.date)) {
      return res.status(400).json({ message: 'Appointments can only be checked in on the scheduled date' });
    }

    appointment.checkInAt = new Date();
    appointment.status = 'Ready';
    if (appointment.type === 'Video Call') {
      applyVideoMeetingDetails(appointment);
    }
    await appointment.save();

    await createAppointmentNotification({
      recipientId: appointment.doctorId._id,
      createdBy: req.user.id,
      title: 'Student checked in',
      message: `${appointment.studentName} checked in for ${formatAppointmentLabel(appointment.date, appointment.time)}.`,
      link: `/doctor/consultation/${appointment._id}`
    });

    emitAppointmentUpdate(appointment._id.toString(), {
      status: appointment.status,
      checkInAt: appointment.checkInAt,
      meetingLink: appointment.meetingLink
    });

    broadcastAvailabilityImpact({
      action: 'appointment-status-updated',
      appointment,
      status: appointment.status
    });

    await writeAuditLog(
      req,
      'Appointment Check-In',
      `Student checked in for appointment ${appointment._id}`,
      {
        appointmentId: appointment._id.toString(),
        doctorId: appointment.doctorId._id.toString()
      },
      'success'
    );

    await broadcastQueueIfToday(appointment.doctorId._id, appointment.date);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateConsultation = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('doctorId', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctorId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const previousStatus = appointment.status;
    const nextStatus = req.body.status ? cleanText(req.body.status, 30) : appointment.status;

    if (!isAllowedTransition('doctor', appointment.status, nextStatus)) {
      return res.status(400).json({
        message: `Cannot change appointment from ${appointment.status} to ${nextStatus}`
      });
    }

    if (req.body.prescriptionId) {
      const prescription = await Prescription.findById(req.body.prescriptionId).select('appointmentId studentId doctorId');
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }

      const belongsToAppointment = prescription.appointmentId?.toString() === appointment._id.toString();
      const belongsToStudent = prescription.studentId?.toString() === appointment.studentId._id.toString();
      const belongsToDoctor = prescription.doctorId?.toString() === req.user.id;

      if (!belongsToAppointment || !belongsToStudent || !belongsToDoctor) {
        return res.status(400).json({ message: 'Prescription does not belong to this consultation' });
      }

      appointment.prescriptionId = prescription._id;
    }

    appointment.consultationNotes = req.body.consultationNotes !== undefined
      ? cleanText(req.body.consultationNotes, 4000)
      : appointment.consultationNotes;
    appointment.diagnosis = req.body.diagnosis !== undefined
      ? cleanText(req.body.diagnosis, 1000)
      : appointment.diagnosis;
    appointment.followUpDate = req.body.followUpDate
      ? normalizeDateOnly(req.body.followUpDate)
      : appointment.followUpDate;
    appointment.followUpReason = req.body.followUpReason !== undefined
      ? cleanText(req.body.followUpReason, 500)
      : appointment.followUpReason;
    appointment.meetingLink = req.body.meetingLink !== undefined
      ? cleanText(req.body.meetingLink, 500)
      : appointment.meetingLink;
    appointment.location = req.body.location !== undefined
      ? cleanText(req.body.location, 200)
      : appointment.location;
    appointment.status = nextStatus;

    if (appointment.type === 'Video Call') {
      applyVideoMeetingDetails(appointment);
    }

    if (nextStatus === 'Ready' && !appointment.checkInAt) {
      appointment.checkInAt = new Date();
    }
    if (nextStatus === 'In Progress' && !appointment.startedAt) {
      appointment.startedAt = new Date();
    }
    if (nextStatus === 'Completed' && !appointment.completedAt) {
      appointment.completedAt = new Date();
    }

    await appointment.save();

    const consultationSaved =
      req.body.consultationNotes !== undefined ||
      req.body.diagnosis !== undefined ||
      req.body.followUpDate !== undefined ||
      req.body.followUpReason !== undefined;

    if (consultationSaved || previousStatus !== appointment.status || req.body.prescriptionId) {
      await createAppointmentNotification({
        recipientId: appointment.studentId._id,
        createdBy: req.user.id,
        title: previousStatus !== appointment.status ? `Appointment ${appointment.status}` : 'Consultation updated',
        message: previousStatus !== appointment.status
          ? `Your appointment with ${appointment.doctorName} is now ${appointment.status.toLowerCase()}.`
          : `Dr. ${appointment.doctorName} updated your consultation notes.`,
        link: appointment.type === 'Video Call'
          ? `/student/consultation/${appointment._id}`
          : `/student/appointments/${appointment._id}/queue`
      });
    }

    emitAppointmentUpdate(appointment._id.toString(), {
      status: appointment.status,
      previousStatus,
      consultationNotes: appointment.consultationNotes,
      diagnosis: appointment.diagnosis,
      followUpDate: appointment.followUpDate,
      prescriptionId: appointment.prescriptionId,
      meetingLink: appointment.meetingLink,
      startedAt: appointment.startedAt,
      completedAt: appointment.completedAt
    });

    broadcastAvailabilityImpact({
      action: 'appointment-status-updated',
      appointment,
      status: appointment.status
    });

    await writeAuditLog(
      req,
      'Consultation Updated',
      `Doctor updated consultation for appointment ${appointment._id}`,
      {
        appointmentId: appointment._id.toString(),
        previousStatus,
        status: appointment.status,
        prescriptionId: appointment.prescriptionId?.toString() || null
      }
    );

    await broadcastQueueIfToday(appointment.doctorId._id, appointment.date);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAppointmentCompat = async (req, res) => {
  const { date, time, newDate, newTime } = req.body || {};

  if (hasConsultationPayload(req.body)) {
    return updateConsultation(req, res);
  }

  if (date || time || newDate || newTime) {
    return rescheduleAppointment(req, res);
  }

  if (req.body?.status) {
    return updateAppointmentStatus(req, res);
  }

  return res.status(400).json({
    message: 'Unsupported appointment update payload. Use status, consultation fields, or reschedule fields.'
  });
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
    const queue = await getDoctorQueueSnapshot({
      doctorId: req.user.id,
      date: new Date()
    });

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorPatients = async (req, res) => {
  try {
    const doctorScopeIds = await getDoctorScopeIds(req.user);
    const appointments = await Appointment.find({ doctorId: { $in: doctorScopeIds } })
      .populate('studentId', 'name email studentId profileImage')
      .sort({ date: -1, time: -1 });

    const patientMap = new Map();

    appointments.forEach((appointment) => {
      const student = appointment.studentId;
      if (!student) return;

      const key = student._id.toString();
      const existing = patientMap.get(key);

      if (!existing) {
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

      existing.totalVisits += 1;
    });

    res.json({ patients: [...patientMap.values()] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorPatientById = async (req, res) => {
  try {
    const doctorScopeIds = await getDoctorScopeIds(req.user);
    const hasRelationship = await Appointment.exists({
      doctorId: { $in: doctorScopeIds },
      studentId: req.params.studentId
    });

    if (!hasRelationship) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const [patient, appointments, prescriptions] = await Promise.all([
      User.findById(req.params.studentId).select('name email studentId profileImage allergies medicalHistory bloodType gender dateOfBirth'),
      Appointment.find({ doctorId: { $in: doctorScopeIds }, studentId: req.params.studentId }).sort({ date: -1, time: -1 }),
      Prescription.find({ doctorId: { $in: doctorScopeIds }, studentId: req.params.studentId }).sort({ createdAt: -1 })
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
  updateAppointmentCompat,
  getDoctorAvailability,
  getDoctorQueue,
  getDoctorPatients,
  getDoctorPatientById
};
