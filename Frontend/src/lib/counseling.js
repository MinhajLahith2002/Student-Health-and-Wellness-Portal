import { apiFetch } from './api';
import { getAuthenticatedSocket, onAvailabilityUpdated, onCounselingSessionUpdated } from './socket';

const COUNSELOR_DASHBOARD_CACHE_KEY = 'campushealth_counselor_dashboard_cache_v1';
const COUNSELOR_DASHBOARD_CACHE_TTL = 30 * 1000;
const COUNSELOR_DASHBOARD_REFRESH_EVENT = 'campushealth:counselor-dashboard-refresh';
const COUNSELOR_DASHBOARD_REFRESH_SIGNAL_KEY = 'campushealth_counselor_dashboard_refresh_signal';
const COUNSELING_SESSION_REFRESH_EVENT = 'campushealth:counseling-session-refresh';
const COUNSELING_SESSION_REFRESH_SIGNAL_KEY = 'campushealth_counseling_session_refresh_signal';
const COUNSELING_LIVE_REFRESH_EVENT = 'campushealth:counseling-live-refresh';
const COUNSELING_LIVE_REFRESH_SIGNAL_KEY = 'campushealth_counseling_live_refresh_signal';
const COUNSELOR_NOTES_CACHE_PREFIX = 'campushealth_counselor_notes_cache_v1';
const COUNSELOR_WORKSPACE_CACHE_PREFIX = 'campushealth_counselor_workspace_cache_v2';
const COUNSELOR_TRENDS_CACHE_PREFIX = 'campushealth_counselor_trends_cache_v1';
const COUNSELOR_BROWSE_CACHE_PREFIX = 'campushealth_counselor_browse_cache_v1';
const COUNSELING_SESSION_CACHE_PREFIX = 'campushealth_counseling_session_cache_v1';
export const COUNSELOR_TREND_RANGE_DEFAULT = '8w';
export const COUNSELOR_TREND_GROUP_DEFAULT = 'week';
const COUNSELOR_BROWSE_TTL_MS = {
  directory: 60 * 1000,
  profile: 60 * 1000,
  slots: 30 * 1000,
  feedback: 60 * 1000
};
const counselorBrowseRequestCache = new Map();
const COUNSELING_SESSION_TTL_MS = {
  list: 30 * 1000,
  detail: 30 * 1000
};
const counselingSessionRequestCache = new Map();

const MODE_LABELS = {
  video: 'Video Call',
  in_person: 'In-Person',
  chat: 'Chat'
};

const LEGACY_TO_CANONICAL = {
  'video call': 'video',
  'video': 'video',
  'in-person': 'in_person',
  'in person': 'in_person',
  'in_person': 'in_person',
  'chat': 'chat'
};
const COUNSELING_BOOKING_CONFLICT_STATUSES = new Set(['Pending', 'Confirmed', 'Ready', 'In Progress']);
const COUNSELOR_WORKSPACE_ACTIVE_STATUSES = new Set(['Pending', 'Confirmed', 'Ready', 'In Progress']);
const COUNSELOR_WORKSPACE_OUTCOME_STATUSES = new Set(['Completed', 'Cancelled', 'No Show']);

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function getCurrentUserId() {
  if (typeof window === 'undefined') return 'guest';

  try {
    const rawUser = window.localStorage.getItem('campushealth_user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    return user?.id || user?._id || 'guest';
  } catch {
    return 'guest';
  }
}

function getCounselorNotesCacheKey() {
  return `${COUNSELOR_NOTES_CACHE_PREFIX}:${getCurrentUserId()}`;
}

function getCounselorWorkspaceCacheKey() {
  return `${COUNSELOR_WORKSPACE_CACHE_PREFIX}:${getCurrentUserId()}`;
}

function getCounselorTrendCacheKey(range, groupBy) {
  return `${COUNSELOR_TRENDS_CACHE_PREFIX}:${getCurrentUserId()}:${range}:${groupBy}`;
}

function getCounselorBrowseCacheKey(segment) {
  return `${COUNSELOR_BROWSE_CACHE_PREFIX}:${getCurrentUserId()}:${segment}`;
}

function getCounselingSessionCacheKey(segment) {
  return `${COUNSELING_SESSION_CACHE_PREFIX}:${getCurrentUserId()}:${segment}`;
}

function writeCounselorDashboardCache(data) {
  if (!canUseSessionStorage() || !data) return;

  try {
    window.sessionStorage.setItem(
      COUNSELOR_DASHBOARD_CACHE_KEY,
      JSON.stringify({
        createdAt: Date.now(),
        data
      })
    );
  } catch {
    // Ignore cache write failures.
  }
}

export function getCachedCounselorDashboard() {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(COUNSELOR_DASHBOARD_CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached?.data || !cached?.createdAt) return null;
    if (Date.now() - cached.createdAt > COUNSELOR_DASHBOARD_CACHE_TTL) return null;
    return cached.data;
  } catch {
    return null;
  }
}

export function invalidateCounselorDashboardCache() {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(COUNSELOR_DASHBOARD_CACHE_KEY);
  } catch {
    // Ignore cache removal failures.
  }
}

export function getCachedCounselorNotes() {
  if (!canUseSessionStorage()) return [];

  try {
    const raw = window.sessionStorage.getItem(getCounselorNotesCacheKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setCachedCounselorNotes(notes) {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(
      getCounselorNotesCacheKey(),
      JSON.stringify(Array.isArray(notes) ? notes : [])
    );
  } catch {
    // Ignore transient cache write failures.
  }
}

export function getCachedCounselorWorkspace() {
  const emptyWorkspace = {
    openSlots: [],
    bookedSessions: [],
    recentOutcomes: []
  };

  if (!canUseSessionStorage()) {
    return emptyWorkspace;
  }

  try {
    const raw = window.sessionStorage.getItem(getCounselorWorkspaceCacheKey());
    const parsed = raw ? JSON.parse(raw) : null;

    return normalizeCounselorWorkspacePayload(parsed);
  } catch {
    return emptyWorkspace;
  }
}

export function setCachedCounselorWorkspace(workspace) {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(
      getCounselorWorkspaceCacheKey(),
      JSON.stringify({
        openSlots: Array.isArray(workspace?.openSlots) ? workspace.openSlots : [],
        bookedSessions: Array.isArray(workspace?.bookedSessions) ? workspace.bookedSessions : [],
        recentOutcomes: Array.isArray(workspace?.recentOutcomes) ? workspace.recentOutcomes : []
      })
    );
  } catch {
    // Ignore transient cache write failures.
  }
}

export function getCachedCounselorSessionTrends(
  range = COUNSELOR_TREND_RANGE_DEFAULT,
  groupBy = COUNSELOR_TREND_GROUP_DEFAULT
) {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(getCounselorTrendCacheKey(range, groupBy));
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed) return null;

    return {
      ...parsed,
      points: Array.isArray(parsed?.points) ? parsed.points : [],
      summary: {
        completedTotal: parsed?.summary?.completedTotal || 0,
        pendingTotal: parsed?.summary?.pendingTotal || 0,
        pendingAttentionThreshold: parsed?.summary?.pendingAttentionThreshold || 0
      }
    };
  } catch {
    return null;
  }
}

export function setCachedCounselorSessionTrends(
  range = COUNSELOR_TREND_RANGE_DEFAULT,
  groupBy = COUNSELOR_TREND_GROUP_DEFAULT,
  payload = {}
) {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(
      getCounselorTrendCacheKey(range, groupBy),
      JSON.stringify({
        range,
        groupBy,
        generatedAt: payload?.generatedAt || '',
        points: Array.isArray(payload?.points) ? payload.points : [],
        summary: {
          completedTotal: payload?.summary?.completedTotal || 0,
          pendingTotal: payload?.summary?.pendingTotal || 0,
          pendingAttentionThreshold: payload?.summary?.pendingAttentionThreshold || 0
        }
      })
    );
  } catch {
    // Ignore transient cache write failures.
  }
}

export function broadcastCounselorDashboardRefresh() {
  invalidateCounselorDashboardCache();

  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent(COUNSELOR_DASHBOARD_REFRESH_EVENT));

  try {
    window.localStorage.setItem(COUNSELOR_DASHBOARD_REFRESH_SIGNAL_KEY, `${Date.now()}`);
  } catch {
    // Ignore localStorage sync failures.
  }
}

export function subscribeCounselorDashboardRefresh(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleRefresh = () => {
    callback();
  };

  const handleStorage = (event) => {
    if (event.key === COUNSELOR_DASHBOARD_REFRESH_SIGNAL_KEY) {
      callback();
    }
  };

  window.addEventListener(COUNSELOR_DASHBOARD_REFRESH_EVENT, handleRefresh);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(COUNSELOR_DASHBOARD_REFRESH_EVENT, handleRefresh);
    window.removeEventListener('storage', handleStorage);
  };
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'All') {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

function readCounselorBrowseCache(segment, ttlMs) {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(getCounselorBrowseCacheKey(segment));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached?.createdAt) return null;
    if (Date.now() - cached.createdAt > ttlMs) return null;
    return cached.data ?? null;
  } catch {
    return null;
  }
}

function writeCounselorBrowseCache(segment, data) {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(
      getCounselorBrowseCacheKey(segment),
      JSON.stringify({
        createdAt: Date.now(),
        data
      })
    );
  } catch {
    // Ignore cache write failures.
  }
}

function getCounselorBrowseRequest(requestKey, fetcher) {
  if (counselorBrowseRequestCache.has(requestKey)) {
    return counselorBrowseRequestCache.get(requestKey);
  }

  const request = fetcher().finally(() => {
    counselorBrowseRequestCache.delete(requestKey);
  });

  counselorBrowseRequestCache.set(requestKey, request);
  return request;
}

function readCounselingSessionCache(segment, ttlMs) {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(getCounselingSessionCacheKey(segment));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached?.createdAt) return null;
    if (Date.now() - cached.createdAt > ttlMs) return null;
    return cached.data ?? null;
  } catch {
    return null;
  }
}

function writeCounselingSessionCache(segment, data) {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(
      getCounselingSessionCacheKey(segment),
      JSON.stringify({
        createdAt: Date.now(),
        data
      })
    );
  } catch {
    // Ignore cache write failures.
  }
}

function getCounselingSessionRequest(requestKey, fetcher) {
  if (counselingSessionRequestCache.has(requestKey)) {
    return counselingSessionRequestCache.get(requestKey);
  }

  const request = fetcher().finally(() => {
    counselingSessionRequestCache.delete(requestKey);
  });

  counselingSessionRequestCache.set(requestKey, request);
  return request;
}

function invalidateCounselorBrowseCaches() {
  counselorBrowseRequestCache.clear();

  if (!canUseSessionStorage()) return;

  try {
    const keyPrefix = getCounselorBrowseCacheKey('');
    const keysToDelete = [];

    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key && key.startsWith(keyPrefix)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignore cache invalidation failures.
  }
}

function invalidateCounselingSessionCaches() {
  counselingSessionRequestCache.clear();

  if (!canUseSessionStorage()) return;

  try {
    const keyPrefix = getCounselingSessionCacheKey('');
    const keysToDelete = [];

    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key && key.startsWith(keyPrefix)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignore cache invalidation failures.
  }
}

export function broadcastCounselingSessionRefresh() {
  invalidateCounselingSessionCaches();

  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent(COUNSELING_SESSION_REFRESH_EVENT));

  try {
    window.localStorage.setItem(COUNSELING_SESSION_REFRESH_SIGNAL_KEY, `${Date.now()}`);
  } catch {
    // Ignore localStorage sync failures.
  }
}

export function subscribeCounselingSessionRefresh(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleRefresh = () => {
    callback();
  };

  const handleStorage = (event) => {
    if (event.key === COUNSELING_SESSION_REFRESH_SIGNAL_KEY) {
      callback();
    }
  };

  window.addEventListener(COUNSELING_SESSION_REFRESH_EVENT, handleRefresh);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(COUNSELING_SESSION_REFRESH_EVENT, handleRefresh);
    window.removeEventListener('storage', handleStorage);
  };
}

function isCounselingLivePayload(payload) {
  if (!payload) return true;

  return payload.module === 'counseling'
    || payload.role === 'counselor'
    || Boolean(payload.counselorId)
    || Boolean(payload.availabilityEntryId)
    || Boolean(payload.sessionId);
}

export function broadcastCounselingLiveRefresh(payload = {}) {
  invalidateCounselorBrowseCaches();
  broadcastCounselorDashboardRefresh();
  broadcastCounselingSessionRefresh();

  if (typeof window === 'undefined') return;

  const eventPayload = {
    ...payload,
    module: payload.module || 'counseling',
    timestamp: Date.now()
  };

  window.dispatchEvent(new CustomEvent(COUNSELING_LIVE_REFRESH_EVENT, { detail: eventPayload }));

  try {
    window.localStorage.setItem(COUNSELING_LIVE_REFRESH_SIGNAL_KEY, JSON.stringify(eventPayload));
  } catch {
    // Ignore localStorage sync failures.
  }
}

export function subscribeCounselingLiveRefresh(callback) {
  if (typeof window === 'undefined') return () => {};

  let refreshTimer = null;

  const scheduleRefresh = (payload = {}) => {
    if (!isCounselingLivePayload(payload)) return;
    invalidateCounselorBrowseCaches();
    invalidateCounselorDashboardCache();
    invalidateCounselingSessionCaches();
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      callback(payload);
    }, 150);
  };

  const handleLiveRefresh = (event) => {
    scheduleRefresh(event.detail || {});
  };

  const handleStorage = (event) => {
    if (event.key !== COUNSELING_LIVE_REFRESH_SIGNAL_KEY) return;

    try {
      scheduleRefresh(event.newValue ? JSON.parse(event.newValue) : {});
    } catch {
      scheduleRefresh();
    }
  };

  window.addEventListener(COUNSELING_LIVE_REFRESH_EVENT, handleLiveRefresh);
  window.addEventListener('storage', handleStorage);

  const token = window.localStorage.getItem('token');
  const socket = getAuthenticatedSocket(token);
  const unsubscribeAvailability = socket ? onAvailabilityUpdated(scheduleRefresh) : undefined;
  const unsubscribeSession = socket ? onCounselingSessionUpdated(scheduleRefresh) : undefined;

  return () => {
    window.clearTimeout(refreshTimer);
    window.removeEventListener(COUNSELING_LIVE_REFRESH_EVENT, handleLiveRefresh);
    window.removeEventListener('storage', handleStorage);
    unsubscribeAvailability?.();
    unsubscribeSession?.();
  };
}

export function normalizeCounselingMode(value) {
  const normalized = `${value || ''}`.trim().toLowerCase();
  return LEGACY_TO_CANONICAL[normalized] || 'video';
}

export function getCounselingModeLabel(value) {
  const normalized = normalizeCounselingMode(value);
  return MODE_LABELS[normalized] || MODE_LABELS.video;
}

export function parseCounselingDateTime(dateValue, timeValue = '') {
  if (!dateValue) {
    return null;
  }

  const sessionDateTime = new Date(dateValue);
  if (Number.isNaN(sessionDateTime.getTime())) {
    return null;
  }

  sessionDateTime.setHours(0, 0, 0, 0);

  const timeText = `${timeValue || ''}`.trim();
  const match = timeText.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);

  if (!match) {
    return sessionDateTime;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    if (meridiem === 'AM') {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  }

  sessionDateTime.setHours(hours, minutes, 0, 0);
  return sessionDateTime;
}

export function findCounselingBookingConflict(
  sessions,
  { date, time, excludeSessionId = '' } = {}
) {
  const targetDateTime = parseCounselingDateTime(date, time);
  if (!targetDateTime || !Array.isArray(sessions)) {
    return null;
  }

  const excludedId = normalizeEntityId(excludeSessionId);

  return sessions.find((session) => {
    if (!COUNSELING_BOOKING_CONFLICT_STATUSES.has(session?.status)) {
      return false;
    }

    const sessionId = normalizeEntityId(session?._id || session?.id);
    if (excludedId && sessionId === excludedId) {
      return false;
    }

    const sessionDateTime = parseCounselingDateTime(session?.date, session?.time);
    return sessionDateTime?.getTime() === targetDateTime.getTime();
  }) || null;
}

export function describeCounselingBookingConflict(session) {
  if (!session) {
    return 'You already have another counseling session booked for this date and time.';
  }

  const dateLabel = session?.date ? new Date(session.date).toLocaleDateString() : 'this date';
  const counselorLabel = session?.counselorName ? ` with ${session.counselorName}` : '';

  return `You already have a counseling session${counselorLabel} on ${dateLabel} at ${session.time}. Choose a different time.`;
}

function getCancellationActorDisplayName(cancelledBy) {
  const actor = `${cancelledBy || ''}`.trim().toLowerCase();

  if (actor === 'student') return 'Student';
  if (actor === 'counselor') return 'Counselor';
  if (actor === 'system') return 'System';
  return '';
}

export function getCancellationActorLabel(session) {
  const actorLabel = `${session?.cancelledByLabel || getCancellationActorDisplayName(session?.cancelledBy)}`.trim();

  if (!actorLabel) return 'Cancellation source unavailable';
  if (actorLabel.toLowerCase() === 'system') return 'Cancelled automatically';

  return `Cancelled by ${actorLabel.toLowerCase()}`;
}

function normalizeSession(session) {
  if (!session) return session;

  const counselorId = normalizeEntityId(
    session.counselorId
    || session.counselor?._id
    || session.counselor?.id
    || session.providerId
  );

  return {
    ...session,
    _id: normalizeEntityId(session._id || session.id),
    availabilityEntryId: normalizeEntityId(session.availabilityEntryId),
    counselorId,
    studentId: normalizeEntityId(session.studentId),
    mode: normalizeCounselingMode(session.mode || session.type || session.typeLabel),
    typeLabel: session.typeLabel || getCounselingModeLabel(session.mode || session.type),
    cancelledByLabel: session.cancelledByLabel || getCancellationActorDisplayName(session.cancelledBy),
    allowedActions: session.allowedActions || {}
  };
}

function normalizeSlot(slot) {
  if (!slot) return slot;

  return {
    ...slot,
    id: normalizeEntityId(slot.id || slot._id || slot.availabilityEntryId),
    availabilityEntryId: normalizeEntityId(slot.availabilityEntryId || slot.id || slot._id),
    counselorId: normalizeEntityId(slot.counselorId || slot.providerId),
    mode: normalizeCounselingMode(slot.mode || slot.typeLabel),
    typeLabel: slot.typeLabel || getCounselingModeLabel(slot.mode)
  };
}

function getCounselingEntityDateTimeStamp(entity) {
  const dateTime = parseCounselingDateTime(entity?.date, entity?.startTime || entity?.time);
  return dateTime?.getTime() || 0;
}

function getCounselingSessionEndTimeStamp(session) {
  const startStamp = getCounselingEntityDateTimeStamp(session);
  if (!startStamp) return 0;

  const durationMinutes = Math.max(15, Number(session?.duration) || 50);
  return startStamp + (durationMinutes * 60 * 1000);
}

function compareCounselingEntityDateTimeAsc(left, right) {
  return getCounselingEntityDateTimeStamp(left) - getCounselingEntityDateTimeStamp(right);
}

function compareCounselingEntityDateTimeDesc(left, right) {
  return getCounselingEntityDateTimeStamp(right) - getCounselingEntityDateTimeStamp(left);
}

function getValidTimeStamp(value) {
  if (!value) return 0;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getCounselingEntityOutcomeTimeStamp(entity) {
  return getValidTimeStamp(entity?.outcomeAt)
    || (entity?.status === 'Cancelled' ? getValidTimeStamp(entity?.cancelledAt) : 0)
    || getValidTimeStamp(entity?.updatedAt)
    || getValidTimeStamp(entity?.createdAt)
    || getCounselingEntityDateTimeStamp(entity);
}

function compareCounselingEntityOutcomeDesc(left, right) {
  const outcomeDifference = getCounselingEntityOutcomeTimeStamp(right) - getCounselingEntityOutcomeTimeStamp(left);
  return outcomeDifference || compareCounselingEntityDateTimeDesc(left, right);
}

function isFutureCounselorSlot(slot) {
  return getCounselingEntityDateTimeStamp(slot) > Date.now();
}

function isActiveCounselorWorkspaceSession(session) {
  return COUNSELOR_WORKSPACE_ACTIVE_STATUSES.has(session?.status)
    && getCounselingSessionEndTimeStamp(session) > Date.now();
}

function isCounselorWorkspaceOutcomeSession(session) {
  return COUNSELOR_WORKSPACE_OUTCOME_STATUSES.has(session?.status);
}

function normalizeCounselorWorkspacePayload(data = {}) {
  const normalizedBookedSessions = Array.isArray(data?.bookedSessions)
    ? data.bookedSessions.map(normalizeSession)
    : [];
  const normalizedRecentOutcomes = Array.isArray(data?.recentOutcomes)
    ? data.recentOutcomes.map(normalizeSession)
    : [];
  const activeBookedSlotIds = new Set(
    normalizedBookedSessions
      .filter(isActiveCounselorWorkspaceSession)
      .map((session) => session.availabilityEntryId)
      .filter(Boolean)
  );
  const normalizedOpenSlots = Array.isArray(data?.openSlots)
    ? data.openSlots
      .map(normalizeSlot)
      .filter((slot) => isFutureCounselorSlot(slot) && !activeBookedSlotIds.has(slot.availabilityEntryId))
      .sort(compareCounselingEntityDateTimeAsc)
    : [];

  return {
    openSlots: normalizedOpenSlots,
    bookedSessions: normalizedBookedSessions
      .filter(isActiveCounselorWorkspaceSession)
      .sort(compareCounselingEntityDateTimeAsc),
    recentOutcomes: (normalizedRecentOutcomes.length ? normalizedRecentOutcomes : normalizedBookedSessions)
      .filter(isCounselorWorkspaceOutcomeSession)
      .sort(compareCounselingEntityOutcomeDesc)
      .slice(0, 8)
  };
}

function normalizeEntityId(value) {
  if (!value) return '';

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    if (typeof value._id === 'string') return value._id;
    if (typeof value.id === 'string') return value.id;
  }

  const serialized = `${value}`;
  return serialized === '[object Object]' ? '' : serialized;
}

function requireCounselorId(counselorId) {
  const normalizedId = normalizeEntityId(counselorId);
  if (!normalizedId) {
    throw new Error('Counselor information is missing. Refresh the page and try again.');
  }

  return normalizedId;
}

export async function getCounselors(params = {}) {
  const query = buildQuery(params);
  const cacheSegment = `directory:${query || 'default'}`;
  const requestKey = `directory:${query || 'default'}`;

  const data = await getCounselorBrowseRequest(requestKey, async () => {
    const response = await apiFetch(`/counseling/counselors${query}`);
    const normalized = {
      ...response,
      providers: Array.isArray(response?.providers) ? response.providers.map((provider) => ({
        ...provider,
        _id: normalizeEntityId(provider._id || provider.id),
        nextOpenSlot: provider.nextOpenSlot ? normalizeSlot(provider.nextOpenSlot) : null
      })) : []
    };
    writeCounselorBrowseCache(cacheSegment, normalized);
    return normalized;
  });

  return data;
}

export async function getCounselorProfile(id) {
  const counselorId = requireCounselorId(id);
  const cacheSegment = `profile:${counselorId}`;
  const requestKey = `profile:${counselorId}`;

  const data = await getCounselorBrowseRequest(requestKey, async () => {
    const response = await apiFetch(`/counseling/counselors/${counselorId}`);
    const normalized = {
      ...response,
      _id: normalizeEntityId(response?._id || response?.id || counselorId),
      openSlots: Array.isArray(response?.openSlots) ? response.openSlots.map(normalizeSlot) : [],
      feedback: {
        averageRating: response?.feedback?.averageRating || '0.0',
        reviewCount: response?.feedback?.reviewCount || 0,
        recentFeedback: Array.isArray(response?.feedback?.recentFeedback) ? response.feedback.recentFeedback : []
      }
    };
    writeCounselorBrowseCache(cacheSegment, normalized);
    return normalized;
  });

  return data;
}

export async function getCounselorSlots(counselorId, params = {}) {
  const safeCounselorId = requireCounselorId(counselorId);
  const query = buildQuery(params);
  const cacheSegment = `slots:${safeCounselorId}:${query || 'default'}`;
  const requestKey = `slots:${safeCounselorId}:${query || 'default'}`;

  const data = await getCounselorBrowseRequest(requestKey, async () => {
    const response = await apiFetch(`/counseling/counselors/${safeCounselorId}/slots${query}`);
    const normalized = {
      ...response,
      slots: Array.isArray(response?.slots) ? response.slots.map(normalizeSlot) : []
    };
    writeCounselorBrowseCache(cacheSegment, normalized);
    return normalized;
  });

  return data;
}

export function getCounselorFeedback(counselorId) {
  const safeCounselorId = requireCounselorId(counselorId);
  const cacheSegment = `feedback:${safeCounselorId}`;
  const requestKey = `feedback:${safeCounselorId}`;

  return getCounselorBrowseRequest(requestKey, async () => {
    const response = await apiFetch(`/counseling/counselors/${safeCounselorId}/feedback`);
    writeCounselorBrowseCache(cacheSegment, response);
    return response;
  });
}

export function getCachedCounselors(params = {}) {
  return readCounselorBrowseCache(
    `directory:${buildQuery(params) || 'default'}`,
    COUNSELOR_BROWSE_TTL_MS.directory
  );
}

export function getCachedCounselorProfile(id) {
  const counselorId = normalizeEntityId(id);
  if (!counselorId) return null;
  return readCounselorBrowseCache(`profile:${counselorId}`, COUNSELOR_BROWSE_TTL_MS.profile);
}

export function getCachedCounselorSlots(counselorId, params = {}) {
  const safeCounselorId = normalizeEntityId(counselorId);
  if (!safeCounselorId) return null;
  return readCounselorBrowseCache(
    `slots:${safeCounselorId}:${buildQuery(params) || 'default'}`,
    COUNSELOR_BROWSE_TTL_MS.slots
  );
}

export function getCachedCounselorFeedback(counselorId) {
  const safeCounselorId = normalizeEntityId(counselorId);
  if (!safeCounselorId) return null;
  return readCounselorBrowseCache(`feedback:${safeCounselorId}`, COUNSELOR_BROWSE_TTL_MS.feedback);
}

export function prefetchCounselorDirectory(params = {}) {
  return getCounselors(params).catch(() => null);
}

export function prefetchCounselorProfile(counselorId) {
  return getCounselorProfile(counselorId).catch(() => null);
}

export function prefetchCounselorSlots(counselorId, params = {}) {
  return getCounselorSlots(counselorId, params).catch(() => null);
}

export async function getCounselingSessions(params = {}) {
  const query = buildQuery(params);
  const cacheSegment = `list:${query || 'default'}`;
  const requestKey = `list:${query || 'default'}`;

  const data = await getCounselingSessionRequest(requestKey, async () => {
    const response = await apiFetch(`/counseling/sessions${query}`);
    const normalized = {
      ...response,
      sessions: Array.isArray(response?.sessions) ? response.sessions.map(normalizeSession) : []
    };
    writeCounselingSessionCache(cacheSegment, normalized);
    return normalized;
  });

  return data;
}

export async function getCounselingSessionById(id) {
  const sessionId = normalizeEntityId(id);
  const cacheSegment = `detail:${sessionId}`;
  const requestKey = `detail:${sessionId}`;

  return getCounselingSessionRequest(requestKey, async () => {
    const response = normalizeSession(await apiFetch(`/counseling/sessions/${sessionId}`));
    writeCounselingSessionCache(cacheSegment, response);
    return response;
  });
}

export function getCachedCounselingSessions(params = {}) {
  return readCounselingSessionCache(
    `list:${buildQuery(params) || 'default'}`,
    COUNSELING_SESSION_TTL_MS.list
  );
}

export function getCachedCounselingSessionById(id) {
  const sessionId = normalizeEntityId(id);
  if (!sessionId) return null;
  return readCounselingSessionCache(`detail:${sessionId}`, COUNSELING_SESSION_TTL_MS.detail);
}

export function prefetchCounselingSessions(params = {}) {
  return getCounselingSessions(params).catch(() => null);
}

export function prefetchCounselingSessionById(id) {
  return getCounselingSessionById(id).catch(() => null);
}

export async function getCounselingSessionChat(id) {
  const data = await apiFetch(`/counseling/sessions/${id}/chat`);
  return {
    conversationId: normalizeEntityId(data?.conversationId),
    sessionId: normalizeEntityId(data?.sessionId || id),
    canSend: Boolean(data?.canSend),
    messages: Array.isArray(data?.messages) ? data.messages.map((message) => ({
      ...message,
      _id: normalizeEntityId(message?._id),
      sender: message?.sender ? {
        ...message.sender,
        _id: normalizeEntityId(message.sender._id || message.sender.id),
        id: normalizeEntityId(message.sender.id || message.sender._id)
      } : null
    })) : []
  };
}

export async function sendCounselingSessionChatMessage(id, payload) {
  const data = await apiFetch(`/counseling/sessions/${id}/chat/messages`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return {
    conversationId: normalizeEntityId(data?.conversationId),
    message: data?.message ? {
      ...data.message,
      _id: normalizeEntityId(data.message._id),
      sender: data.message.sender ? {
        ...data.message.sender,
        _id: normalizeEntityId(data.message.sender._id || data.message.sender.id),
        id: normalizeEntityId(data.message.sender.id || data.message.sender._id)
      } : null
    } : null
  };
}

export function markCounselingSessionChatRead(id) {
  return apiFetch(`/counseling/sessions/${id}/chat/read`, {
    method: 'POST'
  });
}

export async function bookCounselingSession(payload) {
  const data = await apiFetch('/counseling/sessions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  broadcastCounselingLiveRefresh({ action: 'session-created' });
  return normalizeSession(data);
}

export async function rescheduleCounselingSession(id, payload) {
  const data = await apiFetch(`/counseling/sessions/${id}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  broadcastCounselingLiveRefresh({ action: 'session-rescheduled', sessionId: id });
  return normalizeSession(data);
}

export async function deleteCounselingSession(id, payload = {}) {
  const data = await apiFetch(`/counseling/sessions/${id}`, {
    method: 'DELETE',
    body: JSON.stringify(payload)
  });
  broadcastCounselingLiveRefresh({ action: 'session-cancelled', sessionId: id });
  return {
    ...data,
    session: data?.session ? normalizeSession(data.session) : null
  };
}

export async function updateCounselingSessionStatus(id, payload) {
  const data = await apiFetch(`/counseling/sessions/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  broadcastCounselingLiveRefresh({ action: 'session-status-updated', sessionId: id });
  return normalizeSession(data);
}

export async function updateCounselingSessionNotes(id, payload) {
  const data = await apiFetch(`/counseling/sessions/${id}/notes`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  broadcastCounselingLiveRefresh({ action: 'session-notes-updated', sessionId: id });
  return normalizeSession(data);
}

export function submitCounselingFeedback(id, payload) {
  return apiFetch(`/counseling/sessions/${id}/feedback`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }).then((response) => {
    broadcastCounselingLiveRefresh({ action: 'session-feedback-submitted', sessionId: id });
    return response;
  });
}

export async function getCounselorWorkspace() {
  const data = await apiFetch(`/counseling/workspace?t=${Date.now()}`);
  const workspace = normalizeCounselorWorkspacePayload(data);
  setCachedCounselorWorkspace(workspace);
  return workspace;
}

export function createCounselorSlot(payload) {
  return apiFetch('/counseling/slots', {
    method: 'POST',
    body: JSON.stringify(payload)
  }).then((data) => {
    broadcastCounselingLiveRefresh({ action: 'slot-created' });
    return normalizeSlot(data);
  });
}

export function updateCounselorSlot(id, payload) {
  return apiFetch(`/counseling/slots/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }).then((data) => {
    broadcastCounselingLiveRefresh({ action: 'slot-updated', availabilityEntryId: id });
    return normalizeSlot(data);
  });
}

export function deleteCounselorSlot(id) {
  return apiFetch(`/counseling/slots/${id}`, {
    method: 'DELETE'
  }).then((data) => {
    broadcastCounselingLiveRefresh({ action: 'slot-deleted', availabilityEntryId: id });
    return data;
  });
}

export function getCounselorNotes() {
  return apiFetch('/counseling/notes').then((data) => {
    setCachedCounselorNotes(Array.isArray(data?.notes) ? data.notes : []);
    return data;
  });
}

export function getCounselorDashboard() {
  return apiFetch('/dashboard/counselor').then((data) => {
    writeCounselorDashboardCache(data);
    return data;
  });
}

export function getCounselorSessionTrends(params = {}) {
  const safeParams = {
    range: params.range || COUNSELOR_TREND_RANGE_DEFAULT,
    groupBy: params.groupBy || COUNSELOR_TREND_GROUP_DEFAULT,
    timezone: params.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  };

  return apiFetch(`/dashboard/counselor/session-trends${buildQuery(safeParams)}`).then((data) => ({
    ...(() => {
      const normalized = {
        ...data,
        points: Array.isArray(data?.points) ? data.points : [],
        summary: {
          completedTotal: data?.summary?.completedTotal || 0,
          pendingTotal: data?.summary?.pendingTotal || 0,
          pendingAttentionThreshold: data?.summary?.pendingAttentionThreshold || 0
        }
      };
      setCachedCounselorSessionTrends(safeParams.range, safeParams.groupBy, normalized);
      return normalized;
    })()
  }));
}
