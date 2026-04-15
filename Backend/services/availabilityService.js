import Appointment from '../models/Appointment.js';
import Availability from '../models/Availability.js';
import CounselingSession from '../models/CounselingSession.js';
import {
  DEFAULT_PROVIDER_SLOTS,
  generateSlots,
  getDateRange,
  isDateTimeInPast,
  matchesRecurringDay,
  normalizeDateOnly,
  toMinutes,
  toDisplayTime
} from '../utils/timeSlots.js';

function sortSlots(slots = []) {
  return [...new Set(slots)].sort((left, right) => {
    const leftValue = Date.parse(`1970-01-01 ${left}`);
    const rightValue = Date.parse(`1970-01-01 ${right}`);
    return leftValue - rightValue;
  });
}

/**
 * Convert 12-hour time format (e.g., "10:00 AM") to 24-hour format (e.g., "10:00")
 * This ensures API consistency regardless of input format
 */
function normalize24HourFormat(timeSlots = []) {
  return timeSlots.map((slot) => {
    // Parse to get total minutes, then convert back to HH:MM format (24-hour)
    const minutes = toMinutes(slot);
    if (minutes === null) return slot; // Return unchanged if parse fails
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
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

  // Filter available slots and normalize time format to 24-hour format for API consistency
  const filteredSlots = configuredSlots.filter((slot) => (
    !bookedSlots.includes(slot) && !isDateTimeInPast(normalizedDate, slot)
  ));

  const availableSlots = normalize24HourFormat(filteredSlots);
  const normalizedConfiguredSlots = normalize24HourFormat(configuredSlots);

  return {
    date: normalizedDate,
    availableSlots,
    bookedSlots: normalize24HourFormat(bookedSlots),
    configuredSlots: normalizedConfiguredSlots,
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
