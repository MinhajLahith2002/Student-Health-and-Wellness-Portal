import { createHash } from 'crypto';

import Appointment from '../models/Appointment.js';
import { emitAppointmentUpdate, emitQueuePosition, emitQueueUpdate } from '../utils/socket.js';
import { getDateRange, normalizeDateOnly } from '../utils/timeSlots.js';

const QUEUE_ACTIVE_STATUSES = ['Confirmed', 'Ready', 'In Progress'];

function toIdString(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  return value.toString();
}

function getJitsiDomain() {
  return String(process.env.JITSI_DOMAIN || 'meet.jit.si')
    .replace(/^https?:\/\//i, '')
    .split('/')[0];
}

function buildMeetingRoomName({ appointmentId, doctorId, studentId, date, time }) {
  const fingerprint = createHash('sha1')
    .update(`${appointmentId}:${doctorId}:${studentId}:${normalizeDateOnly(date).toISOString()}:${time}`)
    .digest('hex')
    .slice(0, 12);

  return `campus-health-${appointmentId}-${fingerprint}`;
}

function buildVideoMeetingDetails({ appointmentId, doctorId, studentId, date, time }) {
  const meetingDomain = getJitsiDomain();
  const meetingRoom = buildMeetingRoomName({
    appointmentId,
    doctorId,
    studentId,
    date,
    time
  });

  return {
    meetingProvider: 'jitsi',
    meetingDomain,
    meetingRoom,
    meetingLink: `https://${meetingDomain}/${meetingRoom}`
  };
}

function applyVideoMeetingDetails(appointment) {
  if (!appointment || appointment.type !== 'Video Call') {
    appointment.meetingProvider = null;
    appointment.meetingDomain = null;
    appointment.meetingRoom = null;
    appointment.meetingLink = null;
    return appointment;
  }

  if (!appointment.meetingRoom || !appointment.meetingLink) {
    const details = buildVideoMeetingDetails({
      appointmentId: appointment._id.toString(),
      doctorId: toIdString(appointment.doctorId),
      studentId: toIdString(appointment.studentId),
      date: appointment.date,
      time: appointment.time
    });

    appointment.meetingProvider = details.meetingProvider;
    appointment.meetingDomain = details.meetingDomain;
    appointment.meetingRoom = details.meetingRoom;
    appointment.meetingLink = details.meetingLink;
  }

  return appointment;
}

async function getDoctorQueueSnapshot({ doctorId, date }) {
  const { start, end } = getDateRange(date);
  const queue = await Appointment.find({
    doctorId,
    date: { $gte: start, $lt: end },
    status: { $in: QUEUE_ACTIVE_STATUSES }
  })
    .populate('studentId', 'name email studentId profileImage')
    .sort({ time: 1, createdAt: 1 });

  let accumulatedWait = 0;

  return queue.map((appointment, index) => {
    const estimatedWait = accumulatedWait;
    accumulatedWait += Number(appointment.duration) || 30;

    return {
      appointmentId: appointment._id.toString(),
      doctorId: appointment.doctorId.toString(),
      studentId: appointment.studentId?._id?.toString() || appointment.studentId?.toString?.() || '',
      studentName: appointment.studentName || appointment.studentId?.name || 'Student',
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      queuePosition: index + 1,
      totalInQueue: queue.length,
      estimatedWait,
      checkInAt: appointment.checkInAt,
      startedAt: appointment.startedAt
    };
  });
}

async function broadcastQueueSnapshot({ doctorId, date }) {
  const snapshot = await getDoctorQueueSnapshot({ doctorId, date });

  emitQueueUpdate(doctorId.toString(), {
    type: 'queue-snapshot',
    totalInQueue: snapshot.length,
    queue: snapshot
  });

  snapshot.forEach((entry) => {
    emitQueuePosition(entry.appointmentId, {
      appointmentId: entry.appointmentId,
      queuePosition: entry.queuePosition,
      totalInQueue: entry.totalInQueue,
      estimatedWait: entry.estimatedWait,
      status: entry.status
    });
  });

  return snapshot;
}

export {
  QUEUE_ACTIVE_STATUSES,
  getJitsiDomain,
  buildVideoMeetingDetails,
  applyVideoMeetingDetails,
  getDoctorQueueSnapshot,
  broadcastQueueSnapshot
};
