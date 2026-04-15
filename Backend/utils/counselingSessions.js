import CounselingSession from '../models/CounselingSession.js';
import { normalizeDateOnly, toMinutes } from './timeSlots.js';

export const COUNSELING_ACTIVE_SLOT_STATUSES = ['Pending', 'Confirmed', 'Ready', 'In Progress', 'Completed'];
export const COUNSELING_WORKSPACE_SESSION_STATUSES = ['Confirmed', 'Ready', 'In Progress', 'Completed', 'Cancelled', 'No Show'];
export const COUNSELING_MANAGEABLE_SESSION_STATUSES = ['Pending', 'Confirmed', 'Ready', 'In Progress'];
export const COUNSELING_UPCOMING_SESSION_STATUSES = ['Pending', 'Confirmed', 'Ready', 'In Progress'];
export const COUNSELING_HISTORY_SESSION_STATUSES = ['Completed', 'Cancelled', 'No Show'];
export const COUNSELING_TERMINAL_STATUSES = ['Completed', 'Cancelled', 'No Show'];
export const COUNSELING_AUTO_NO_SHOW_STATUSES = ['Confirmed', 'Ready'];
export const COUNSELING_BOOKING_CONFLICT_STATUSES = ['Pending', 'Confirmed', 'Ready', 'In Progress'];

export function getCounselingSessionDateTime(session) {
  const minutes = toMinutes(session?.time);
  if (!session?.date || minutes === null) {
    return normalizeDateOnly(session?.date || new Date());
  }

  const dateTime = normalizeDateOnly(session.date);
  dateTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return dateTime;
}

export function getCounselingSessionEndDateTime(session) {
  const startTime = getCounselingSessionDateTime(session);
  const endTime = new Date(startTime);
  const duration = Math.max(15, Number(session?.duration) || 50);
  endTime.setMinutes(endTime.getMinutes() + duration);
  return endTime;
}

export function isCounselingSessionStarted(session) {
  return getCounselingSessionDateTime(session).getTime() <= Date.now();
}

export function isCounselingSessionEnded(session) {
  return getCounselingSessionEndDateTime(session).getTime() <= Date.now();
}

export function compareCounselingSessionDateTimeAsc(left, right) {
  return getCounselingSessionDateTime(left).getTime() - getCounselingSessionDateTime(right).getTime();
}

export function compareCounselingSessionDateTimeDesc(left, right) {
  return getCounselingSessionDateTime(right).getTime() - getCounselingSessionDateTime(left).getTime();
}

function toValidTimeStamp(value) {
  if (!value) return 0;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function getCounselingSessionOutcomeDateTime(session) {
  const outcomeTimeStamp = toValidTimeStamp(session?.outcomeAt)
    || (session?.status === 'Cancelled' ? toValidTimeStamp(session?.cancelledAt) : 0)
    || toValidTimeStamp(session?.updatedAt)
    || toValidTimeStamp(session?.createdAt)
    || getCounselingSessionDateTime(session).getTime();

  return new Date(outcomeTimeStamp);
}

export function compareCounselingSessionOutcomeDesc(left, right) {
  const outcomeDifference = getCounselingSessionOutcomeDateTime(right).getTime()
    - getCounselingSessionOutcomeDateTime(left).getTime();

  return outcomeDifference || compareCounselingSessionDateTimeDesc(left, right);
}

export function isUpcomingCounselingSession(session) {
  if (!COUNSELING_UPCOMING_SESSION_STATUSES.includes(session?.status)) {
    return false;
  }

  return !isCounselingSessionEnded(session);
}

export function isHistoryCounselingSession(session) {
  return COUNSELING_HISTORY_SESSION_STATUSES.includes(session?.status) || !isUpcomingCounselingSession(session);
}

export function canAutoMarkCounselingSessionNoShow(session) {
  if (!COUNSELING_AUTO_NO_SHOW_STATUSES.includes(session?.status)) {
    return false;
  }

  if (!isCounselingSessionEnded(session)) {
    return false;
  }

  if (session.status === 'Ready') {
    return !session.checkInAt;
  }

  return true;
}

export function clearCounselingSessionForNoShow(session) {
  session.status = 'No Show';
  session.cancelledAt = null;
  session.cancelledBy = null;
  session.cancellationReason = '';
  session.checkInAt = null;
  session.confidentialNotes = '';
  session.sharedSummary = '';
  session.actionPlan = '';
  session.assignedResources = [];
  session.assignedResourceMessage = '';
  session.followUpRecommended = false;
  session.followUpDate = null;
  session.feedbackSubmitted = false;
  return session;
}

export async function markCounselingSessionNoShow(session) {
  clearCounselingSessionForNoShow(session);
  await session.save();
  return session;
}

export async function syncCounselingSessionNoShow(session) {
  if (!session || !canAutoMarkCounselingSessionNoShow(session)) {
    return session;
  }

  return markCounselingSessionNoShow(session);
}

export async function syncCounselingNoShows(match = {}) {
  const today = normalizeDateOnly(new Date());
  const candidates = await CounselingSession.find({
    ...match,
    status: { $in: COUNSELING_AUTO_NO_SHOW_STATUSES },
    date: { $lte: today }
  }).select(
    'status date time duration checkInAt confidentialNotes sharedSummary actionPlan assignedResources assignedResourceMessage followUpRecommended followUpDate feedbackSubmitted cancellationReason cancelledAt cancelledBy'
  );

  let updates = 0;
  for (const session of candidates) {
    if (!canAutoMarkCounselingSessionNoShow(session)) {
      continue;
    }

    await markCounselingSessionNoShow(session);
    updates += 1;
  }

  return updates;
}
