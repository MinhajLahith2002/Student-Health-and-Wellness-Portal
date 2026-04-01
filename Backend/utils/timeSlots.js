const DEFAULT_PROVIDER_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM'
];

const WEEKDAY_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

function normalizeDateOnly(value) {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDateRange(value) {
  const start = normalizeDateOnly(value);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function toMinutes(timeValue) {
  if (!timeValue) return null;

  const match = `${timeValue}`.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    if (hours === 12) hours = 0;
    if (meridiem === 'PM') hours += 12;
  }

  return hours * 60 + minutes;
}

function toDisplayTime(totalMinutes) {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
  const hours24 = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function combineDateAndTime(dateValue, timeValue) {
  const date = normalizeDateOnly(dateValue);
  const minutes = toMinutes(timeValue);

  if (minutes === null) return null;

  date.setMinutes(minutes);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

function isDateTimeInPast(dateValue, timeValue) {
  const appointmentDateTime = combineDateAndTime(dateValue, timeValue);
  if (!appointmentDateTime) return false;
  return appointmentDateTime.getTime() <= Date.now();
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function generateSlots({ startTime, endTime, slotDuration = 30, breaks = [] }) {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return [];
  }

  const blockedRanges = breaks
    .map((entry) => ({
      start: toMinutes(entry.startTime),
      end: toMinutes(entry.endTime)
    }))
    .filter((entry) => entry.start !== null && entry.end !== null && entry.end > entry.start);

  const slots = [];
  for (let cursor = startMinutes; cursor + slotDuration <= endMinutes; cursor += slotDuration) {
    const candidateEnd = cursor + slotDuration;
    const blocked = blockedRanges.some((range) => overlaps(cursor, candidateEnd, range.start, range.end));
    if (!blocked) {
      slots.push(toDisplayTime(cursor));
    }
  }

  return slots;
}

function matchesRecurringDay(recurringDays = [], dateValue) {
  const day = normalizeDateOnly(dateValue).getDay();
  return recurringDays.some((value) => {
    if (typeof value === 'number') return value === day;
    return WEEKDAY_INDEX[value] === day;
  });
}

export {
  DEFAULT_PROVIDER_SLOTS,
  WEEKDAY_INDEX,
  combineDateAndTime,
  normalizeDateOnly,
  getDateRange,
  isDateTimeInPast,
  toMinutes,
  toDisplayTime,
  overlaps,
  generateSlots,
  matchesRecurringDay
};
