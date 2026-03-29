import Appointment from '../models/Appointment.js';
import Availability from '../models/Availability.js';
import CounselingSession from '../models/CounselingSession.js';
import {
  DEFAULT_PROVIDER_SLOTS,
  generateSlots,
  getDateRange,
  isDateTimeInPast,
  matchesRecurringDay,
  normalizeDateOnly
} from '../utils/timeSlots.js';

function sortSlots(slots = []) {
  return [...new Set(slots)].sort((left, right) => {
    const leftValue = Date.parse(`1970-01-01 ${left}`);
    const rightValue = Date.parse(`1970-01-01 ${right}`);
    return leftValue - rightValue;
  });
}

async function getBookedSlotsForProvider({ providerId, role, date, excludeId = null }) {
  const { start, end } = getDateRange(date);
  const activeStatuses = role === 'doctor'
    ? { $nin: ['Cancelled', 'Completed', 'No Show'] }
    : { $nin: ['Cancelled', 'Completed'] };

  if (role === 'doctor') {
    const query = {
      doctorId: providerId,
      date: { $gte: start, $lt: end },
      status: activeStatuses
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const appointments = await Appointment.find(query).select('time');
    return appointments.map((entry) => entry.time);
  }

  const query = {
    counselorId: providerId,
    date: { $gte: start, $lt: end },
    status: activeStatuses
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const sessions = await CounselingSession.find(query).select('time');
  return sessions.map((entry) => entry.time);
}

async function getScheduleEntries(providerId, date) {
  const targetDate = normalizeDateOnly(date);
  const targetDay = targetDate.getDay();

  const entries = await Availability.find({
    providerId,
    status: 'Active',
    $or: [
      { date: targetDate },
      { recurringDays: targetDay }
    ]
  }).sort({ date: 1, startTime: 1 });

  const unavailableEntries = entries.filter((entry) => entry.isUnavailable);
  const scheduleEntries = entries.filter((entry) => !entry.isUnavailable);

  return { unavailableEntries, scheduleEntries };
}

async function getAvailabilityForProvider({ providerId, role, date, excludeId = null }) {
  const normalizedDate = normalizeDateOnly(date);
  const { unavailableEntries, scheduleEntries } = await getScheduleEntries(providerId, normalizedDate);

  if (unavailableEntries.some((entry) => entry.date && normalizeDateOnly(entry.date).getTime() === normalizedDate.getTime())) {
    return {
      date: normalizedDate,
      availableSlots: [],
      bookedSlots: [],
      configuredSlots: [],
      entries: scheduleEntries
    };
  }

  const configuredSlots = scheduleEntries.length > 0
    ? sortSlots(scheduleEntries.flatMap((entry) => generateSlots({
      startTime: entry.startTime,
      endTime: entry.endTime,
      slotDuration: entry.slotDuration,
      breaks: entry.breaks
    })))
    : DEFAULT_PROVIDER_SLOTS;

  const bookedSlots = await getBookedSlotsForProvider({
    providerId,
    role,
    date: normalizedDate,
    excludeId
  });

  const availableSlots = configuredSlots.filter((slot) => (
    !bookedSlots.includes(slot) && !isDateTimeInPast(normalizedDate, slot)
  ));

  return {
    date: normalizedDate,
    availableSlots,
    bookedSlots,
    configuredSlots,
    entries: scheduleEntries
  };
}

function matchesDateEntry(entry, date) {
  if (entry.date) {
    return normalizeDateOnly(entry.date).getTime() === normalizeDateOnly(date).getTime();
  }

  return matchesRecurringDay(entry.recurringDays, date);
}

export {
  getAvailabilityForProvider,
  getBookedSlotsForProvider,
  getScheduleEntries,
  matchesDateEntry
};
