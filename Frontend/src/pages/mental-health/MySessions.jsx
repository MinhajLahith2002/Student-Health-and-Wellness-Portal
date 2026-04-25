import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Filter, Lock, MessageSquareText, RefreshCcw, Search, Trash2 } from 'lucide-react';
import {
  describeCounselingBookingConflict,
  getCachedCounselingSessions,
  getCancellationActorLabel,
  deleteCounselingSession,
  findCounselingBookingConflict,
  getCounselingSessions,
  getCounselorSlots,
  prefetchCounselingSessionById,
  rescheduleCounselingSession,
  subscribeCounselingLiveRefresh,
  subscribeCounselingSessionRefresh
} from '../../lib/counseling';
import DismissibleBanner from '../../components/DismissibleBanner';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';


const SESSION_FETCH_LIMIT = 100;
const UPCOMING_DATE_FILTERS = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'next-7-days', label: 'Next 7 days' },
  { value: 'later', label: 'Later' }
];
const HISTORY_DATE_FILTERS = [
  { value: 'all', label: 'All time' },
  { value: 'last-30-days', label: 'Last 30 days' },
  { value: 'last-90-days', label: 'Last 90 days' },
  { value: 'older', label: 'Older' }
];

function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return getDateInputValue(date);
}

function getDateInputValue(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function normalizeDate(dateValue) {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseSessionDateTime(session) {
  if (!session?.date) {
    return null;
  }

  const baseDate = new Date(session.date);
  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  const sessionDateTime = new Date(baseDate);
  sessionDateTime.setHours(0, 0, 0, 0);

  const timeText = `${session.time || ''}`.trim();
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

function matchesUpcomingDateFilter(session, filterValue) {
  if (filterValue === 'all') {
    return true;
  }

  const today = normalizeDate(new Date());
  const targetDate = normalizeDate(parseSessionDateTime(session) || session?.date);
  const diffInDays = Math.round((targetDate.getTime() - today.getTime()) / 86400000);

  if (filterValue === 'today') {
    return diffInDays === 0;
  }

  if (filterValue === 'next-7-days') {
    return diffInDays >= 0 && diffInDays <= 7;
  }

  if (filterValue === 'later') {
    return diffInDays > 7;
  }

  return true;
}

function matchesHistoryDateFilter(session, filterValue) {
  if (filterValue === 'all') {
    return true;
  }

  const today = normalizeDate(new Date());
  const targetDate = normalizeDate(parseSessionDateTime(session) || session?.date);
  const diffInDays = Math.round((today.getTime() - targetDate.getTime()) / 86400000);

  if (filterValue === 'last-30-days') {
    return diffInDays >= 0 && diffInDays <= 30;
  }

  if (filterValue === 'last-90-days') {
    return diffInDays >= 0 && diffInDays <= 90;
  }

  if (filterValue === 'older') {
    return diffInDays > 90;
  }

  return true;
}
function isUpcomingSession(session) {
  if (!['Confirmed', 'Ready', 'In Progress'].includes(session?.status)) {
    return false;
  }

  const scheduledAt = parseSessionDateTime(session);
  if (!scheduledAt) {
    return true;
  }

  const durationMinutes = Math.max(15, Number(session?.duration) || 50);
  const endsAt = new Date(scheduledAt);
  endsAt.setMinutes(endsAt.getMinutes() + durationMinutes);
  return endsAt.getTime() > Date.now();
}

function getSessionStatusTone(status) {
  if (status === 'Completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'Cancelled') return 'bg-rose-50 text-rose-700';
  if (status === 'No Show') return 'bg-amber-50 text-amber-700';
  return 'bg-sky-50 text-sky-700';
}

function isLiveSessionLocked(session) {
  const startDate = session?.startsAt ? new Date(session.startsAt) : parseSessionDateTime(session);
  const hasStarted = Boolean(startDate && !Number.isNaN(startDate.getTime()) && startDate.getTime() <= Date.now());

  return ['video', 'chat'].includes(session?.mode)
    && ['Confirmed', 'Ready'].includes(session?.status)
    && (!session?.allowedActions?.canJoin || !hasStarted);
}

function formatSessionStart(session) {
  const startDate = session?.startsAt ? new Date(session.startsAt) : parseSessionDateTime(session);
  if (!startDate || Number.isNaN(startDate.getTime())) {
    return session?.time || 'the scheduled time';
  }

  return startDate.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function SessionCard({
  session,
  actionId,
  rescheduleState,
  onSelectDate,
  onLoadSlots,
  onPickSlot,
  onPrefetchSession,
  onReschedule,
  onDelete,
  onOpenReschedule
}) {
  const isRescheduleOpen = rescheduleState.sessionId === session._id;
  const liveSessionLocked = isLiveSessionLocked(session);
  const sessionStartLabel = formatSessionStart(session);

  return (
    <article className="pharmacy-card p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Counseling session</p>
          {liveSessionLocked ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-2xl font-semibold text-primary-text">{session.counselorName}</p>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <Lock className="h-3.5 w-3.5" />
                Opens at {sessionStartLabel}
              </span>
            </div>
          ) : (
            <Link
              to={`/mental-health/sessions/${session._id}`}
              onMouseEnter={() => onPrefetchSession(session._id)}
              onFocus={() => onPrefetchSession(session._id)}
              className="mt-3 block text-2xl font-semibold text-primary-text"
            >
              {session.counselorName}
            </Link>
          )}
          <p className="mt-2 text-sm text-secondary-text">{new Date(session.date).toLocaleDateString()} • {session.time} • {session.typeLabel}</p>
          <p className="mt-4 text-sm leading-6 text-secondary-text">{session.reason}</p>
        </div>

        <span className={cn(
          'pharmacy-pill',
          getSessionStatusTone(session.status)
        )}>
          {session.status}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {liveSessionLocked ? (
          <button
            type="button"
            disabled
            className="pharmacy-secondary cursor-not-allowed opacity-60"
            title={`This session opens at ${sessionStartLabel}`}
          >
            <Lock className="w-4 h-4" />
            Open Session
          </button>
        ) : (
          <Link
            to={`/mental-health/sessions/${session._id}`}
            onMouseEnter={() => onPrefetchSession(session._id)}
            onFocus={() => onPrefetchSession(session._id)}
            className="pharmacy-secondary"
          >
            <MessageSquareText className="w-4 h-4" />
            Open Session
          </Link>
        )}
        {session.allowedActions?.canReschedule && (
          <button type="button" onClick={() => onOpenReschedule(session)} className="pharmacy-secondary">
            <RefreshCcw className="w-4 h-4" />
            Change Slot
          </button>
        )}
        {session.allowedActions?.canCancel && (
          <button
            type="button"
            onClick={() => onDelete(session._id)}
            disabled={actionId === session._id}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3.5 font-bold text-rose-700 transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete Booking
          </button>
        )}
        {session.allowedActions?.canLeaveFeedback && (
          <Link to={`/mental-health/sessions/${session._id}/feedback`} className="pharmacy-primary">
            Leave Feedback
          </Link>
        )}
      </div>

      {session.status === 'Cancelled' && (
        <div className="mt-6 rounded-[1.5rem] border border-rose-100 bg-rose-50/90 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-700">Cancelled session</p>
          <p className="mt-2 text-sm leading-6 text-secondary-text">
            This counseling booking has been cancelled and is no longer active.
            <span className="mt-1 block font-semibold text-rose-700">{getCancellationActorLabel(session)}.</span>
            {session.cancellationReason && (
              <span className="mt-1 block">Reason: {session.cancellationReason}</span>
            )}
          </p>
        </div>
      )}

      {session.status === 'No Show' && (
        <div className="mt-6 rounded-[1.5rem] border border-amber-100 bg-amber-50/90 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">Missed session</p>
          <p className="mt-2 text-sm leading-6 text-secondary-text">
            This counseling session was marked as a no-show because the scheduled time passed without the session being attended.
          </p>
        </div>
      )}

      {isRescheduleOpen && (
        <div className="mt-6 rounded-[1.5rem] border border-[#d7e4ea] bg-white/80 p-5">
          <div className="grid gap-4 lg:grid-cols-[220px,1fr]">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Choose a new date</label>
              <input
                type="date"
                min={getDateInputValue()}
                value={rescheduleState.date}
                onChange={(event) => {
                  onSelectDate(event.target.value);
                  onLoadSlots(session, event.target.value);
                }}
                className="student-field"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Available replacement slots</label>
              <div className="grid gap-3 md:grid-cols-2">
                {rescheduleState.slots.map((slot) => (
                  <button
                    key={slot.availabilityEntryId}
                    type="button"
                    disabled={Boolean(slot.conflictSession)}
                    onClick={() => onPickSlot(slot.availabilityEntryId)}
                    className={cn(
                      'rounded-[1.25rem] border px-4 py-3 text-left',
                      slot.conflictSession && 'cursor-not-allowed border-amber-200 bg-amber-50/80 opacity-90',
                      rescheduleState.selectedSlotId === slot.availabilityEntryId
                        ? 'border-accent-primary bg-white shadow-[0_16px_32px_rgba(20,116,139,0.10)]'
                        : 'border-white/80 bg-secondary-bg/70'
                    )}
                  >
                    <p className="font-semibold text-primary-text">{slot.time}</p>
                    <p className="mt-1 text-sm text-secondary-text">{slot.typeLabel} • {slot.duration} min</p>
                    {slot.conflictSession && (
                      <p className="mt-2 text-sm text-amber-700">
                        {describeCounselingBookingConflict(slot.conflictSession)}
                      </p>
                    )}
                  </button>
                ))}
              </div>
              {!rescheduleState.loading && !rescheduleState.slots.length && (
                <p className="text-sm text-secondary-text">No open slots are available for that date.</p>
              )}
            </div>
          </div>

          {rescheduleState.error && <p className="mt-4 text-sm text-red-600">{rescheduleState.error}</p>}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onReschedule(session._id)}
              disabled={!rescheduleState.selectedSlotId || actionId === session._id}
              className="pharmacy-primary disabled:opacity-50"
            >
              Confirm New Slot
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function MySessions() {
  const { user } = useAuth();
  const location = useLocation();
  const cachedSessions = getCachedCounselingSessions({ limit: SESSION_FETCH_LIMIT });
  const initialSessions = Array.isArray(cachedSessions?.sessions) ? cachedSessions.sessions : [];
  const initialHasCache = initialSessions.length > 0;
  const refreshRequestIdRef = useRef(0);
  const [sessions, setSessions] = useState(() => Array.isArray(cachedSessions?.sessions) ? cachedSessions.sessions : []);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState(location.state?.statusMessage || '');
  const [loading, setLoading] = useState(() => !initialHasCache);
  const [actionId, setActionId] = useState('');
  const [rescheduleState, setRescheduleState] = useState({
    sessionId: '',
    date: getTomorrow(),
    slots: [],
    selectedSlotId: '',
    loading: false,
    error: ''
  });
  const [upcomingFilters, setUpcomingFilters] = useState({
    query: '',
    type: 'all',
    status: 'all',
    dateWindow: 'all'
  });
  const [historyFilters, setHistoryFilters] = useState({
    query: '',
    type: 'all',
    status: 'all',
    dateWindow: 'all'
  });
  const deferredUpcomingQuery = useDeferredValue(upcomingFilters.query);
  const deferredHistoryQuery = useDeferredValue(historyFilters.query);

  const applySessionList = useCallback((nextSessions) => {
    startTransition(() => {
      setSessions(nextSessions);
    });
  }, []);

  function replaceSession(updatedSession) {
    if (!updatedSession?._id) return;

    startTransition(() => {
      setSessions((current) => current.map((session) => (
        session._id === updatedSession._id ? updatedSession : session
      )));
    });
  }

  const loadSessions = useCallback(async (options = {}) => {
    const {
      silent = false,
      suppressError = false
    } = options;
    const requestId = refreshRequestIdRef.current + 1;
    refreshRequestIdRef.current = requestId;

    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await getCounselingSessions({ limit: SESSION_FETCH_LIMIT });
      if (requestId !== refreshRequestIdRef.current) {
        return;
      }

      applySessionList(Array.isArray(data?.sessions) ? data.sessions : []);
      if (!suppressError) {
        setError('');
      }
    } catch (err) {
      if (requestId !== refreshRequestIdRef.current || suppressError) {
        return;
      }

      setError(err.message || 'Failed to load counseling sessions');
    } finally {
      if (requestId === refreshRequestIdRef.current && !silent) {
        setLoading(false);
      }
    }
  }, [applySessionList]);

  function handlePrefetchSession(sessionId) {
    prefetchCounselingSessionById(sessionId).catch(() => {});
  }

  useEffect(() => {
    let active = true;
    const refreshSessions = (options = {}) => {
      if (!active) return;
      loadSessions(options);
    };

    refreshSessions({ silent: initialHasCache });

    const intervalId = window.setInterval(() => {
      refreshSessions({ silent: true, suppressError: true });
    }, 15000);

    const handleWindowFocus = () => {
      refreshSessions({ silent: true, suppressError: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSessions({ silent: true, suppressError: true });
      }
    };

    const unsubscribeSessionRefresh = subscribeCounselingSessionRefresh(() => {
      refreshSessions({ silent: true, suppressError: true });
    });

    const unsubscribeLiveRefresh = subscribeCounselingLiveRefresh(() => {
      refreshSessions({ silent: true, suppressError: true });
    });

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      unsubscribeSessionRefresh();
      unsubscribeLiveRefresh();
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [initialHasCache, loadSessions]);

  const upcomingSessions = useMemo(
    () => sessions
      .filter((session) => isUpcomingSession(session))
      .sort((left, right) => (
        (parseSessionDateTime(left)?.getTime() ?? new Date(left.date).getTime())
        - (parseSessionDateTime(right)?.getTime() ?? new Date(right.date).getTime())
      )),
    [sessions]
  );
  const upcomingTypeOptions = useMemo(
    () => [...new Set(upcomingSessions.map((session) => session.typeLabel).filter(Boolean))],
    [upcomingSessions]
  );
  const upcomingStatusOptions = useMemo(
    () => [...new Set(upcomingSessions.map((session) => session.status).filter(Boolean))],
    [upcomingSessions]
  );
  const filteredUpcomingSessions = useMemo(() => {
    const normalizedQuery = deferredUpcomingQuery.trim().toLowerCase();

    return upcomingSessions.filter((session) => {
      const matchesQuery = !normalizedQuery || [
        session.counselorName,
        session.reason,
        session.typeLabel,
        session.time
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery));

      const matchesType = upcomingFilters.type === 'all' || session.typeLabel === upcomingFilters.type;
      const matchesStatus = upcomingFilters.status === 'all' || session.status === upcomingFilters.status;
      const matchesDateWindow = matchesUpcomingDateFilter(session, upcomingFilters.dateWindow);

      return matchesQuery && matchesType && matchesStatus && matchesDateWindow;
    });
  }, [deferredUpcomingQuery, upcomingFilters.dateWindow, upcomingFilters.status, upcomingFilters.type, upcomingSessions]);
  const historySessions = useMemo(
    () => sessions
      .filter((session) => ['Completed', 'Cancelled', 'No Show'].includes(session.status) || !isUpcomingSession(session))
      .sort((left, right) => (
        (parseSessionDateTime(right)?.getTime() ?? new Date(right.date).getTime())
        - (parseSessionDateTime(left)?.getTime() ?? new Date(left.date).getTime())
      )),
    [sessions]
  );
  const historyTypeOptions = useMemo(
    () => [...new Set(historySessions.map((session) => session.typeLabel).filter(Boolean))],
    [historySessions]
  );
  const historyStatusOptions = useMemo(
    () => [...new Set(historySessions.map((session) => session.status).filter(Boolean))],
    [historySessions]
  );
  const filteredHistorySessions = useMemo(() => {
    const normalizedQuery = deferredHistoryQuery.trim().toLowerCase();

    return historySessions.filter((session) => {
      const matchesQuery = !normalizedQuery || [
        session.counselorName,
        session.reason,
        session.typeLabel,
        session.time
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery));

      const matchesType = historyFilters.type === 'all' || session.typeLabel === historyFilters.type;
      const matchesStatus = historyFilters.status === 'all' || session.status === historyFilters.status;
      const matchesDateWindow = matchesHistoryDateFilter(session, historyFilters.dateWindow);

      return matchesQuery && matchesType && matchesStatus && matchesDateWindow;
    });
  }, [deferredHistoryQuery, historyFilters.dateWindow, historyFilters.status, historyFilters.type, historySessions]);

  async function loadRescheduleSlots(session, date) {
    if (!session?.counselorId) {
      setRescheduleState((current) => ({
        ...current,
        loading: false,
        slots: [],
        selectedSlotId: '',
        error: 'Counselor information is missing for this session. Refresh the page and try again.'
      }));
      return;
    }

    try {
      setRescheduleState((current) => ({
        ...current,
        loading: true,
        error: '',
        slots: [],
        selectedSlotId: ''
      }));

      const data = await getCounselorSlots(session.counselorId, { date });
      const slots = Array.isArray(data?.slots)
        ? data.slots
          .filter((slot) => slot.availabilityEntryId !== session.availabilityEntryId)
          .map((slot) => ({
            ...slot,
            conflictSession: findCounselingBookingConflict(sessions, {
              date: slot.date,
              time: slot.time,
              excludeSessionId: session._id
            })
          }))
        : [];
      const firstAvailableSlot = slots.find((slot) => !slot.conflictSession);

      setRescheduleState((current) => ({
        ...current,
        loading: false,
        slots,
        selectedSlotId: firstAvailableSlot?.availabilityEntryId || ''
      }));
    } catch (err) {
      setRescheduleState((current) => ({
        ...current,
        loading: false,
        error: err.message || 'Failed to load replacement slots'
      }));
    }
  }

  function openReschedule(session) {
    const nextDate = session.date ? getDateInputValue(new Date(session.date)) : getTomorrow();
    setRescheduleState({
      sessionId: session._id,
      date: nextDate,
      slots: [],
      selectedSlotId: '',
      loading: false,
      error: ''
    });
    loadRescheduleSlots(session, nextDate);
  }

  async function handleReschedule(sessionId) {
    if (!rescheduleState.selectedSlotId) {
      setRescheduleState((current) => ({ ...current, error: 'Choose a replacement open slot before saving.' }));
      return;
    }

    const selectedSlot = rescheduleState.slots.find((slot) => slot.availabilityEntryId === rescheduleState.selectedSlotId);
    const bookingConflict = findCounselingBookingConflict(sessions, {
      date: selectedSlot?.date,
      time: selectedSlot?.time,
      excludeSessionId: sessionId
    });

    if (bookingConflict) {
      setRescheduleState((current) => ({
        ...current,
        error: describeCounselingBookingConflict(bookingConflict)
      }));
      return;
    }

    try {
      setActionId(sessionId);
      setError('');
      setStatusMessage('');
      const updatedSession = await rescheduleCounselingSession(sessionId, {
        availabilityEntryId: rescheduleState.selectedSlotId
      });
      replaceSession(updatedSession);
      setRescheduleState({
        sessionId: '',
        date: getTomorrow(),
        slots: [],
        selectedSlotId: '',
        loading: false,
        error: ''
      });
      setStatusMessage('Counseling session updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update the counseling booking');
    } finally {
      setActionId('');
    }
  }

  async function handleDelete(sessionId) {
    try {
      setActionId(sessionId);
      setError('');
      setStatusMessage('');
      const response = await deleteCounselingSession(sessionId);
      const updatedSession = response?.session;
      if (updatedSession?._id) {
        replaceSession(updatedSession);
      } else {
        await loadSessions({ silent: true });
      }
      setStatusMessage('Booking deleted and the slot is available again.');
    } catch (err) {
      setError(err.message || 'Failed to delete the booking');
    } finally {
      setActionId('');
    }
  }

  function updateUpcomingFilter(key, value) {
    setUpcomingFilters((current) => ({
      ...current,
      [key]: value
    }));
  }

  function resetUpcomingFilters() {
    setUpcomingFilters({
      query: '',
      type: 'all',
      status: 'all',
      dateWindow: 'all'
    });
  }

  function updateHistoryFilter(key, value) {
    setHistoryFilters((current) => ({
      ...current,
      [key]: value
    }));
  }

  function resetHistoryFilters() {
    setHistoryFilters({
      query: '',
      type: 'all',
      status: 'all',
      dateWindow: 'all'
    });
  }

  if (user?.role !== 'student') {
    return null;
  }

  return (
    <div className="pharmacy-shell pt-36 pb-16 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="pharmacy-hero">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <span className="pharmacy-pill bg-emerald-50 text-emerald-700">My Counseling Sessions</span>
              <h1 className="mt-5 text-5xl font-semibold tracking-tight text-primary-text">Manage booked sessions and counseling history.</h1>
              <p className="mt-4 text-lg text-secondary-text">
                Reschedule by choosing a new open slot from the same counselor, remove bookings before completion, and return after completion for follow-up summaries and feedback.
              </p>
            </div>

            <Link to="/mental-health/counselors" className="pharmacy-secondary w-full justify-center lg:w-auto lg:shrink-0">
              <ArrowLeft className="w-4 h-4" />
              Back to Counselor Directory
            </Link>
          </div>
        </section>

        <DismissibleBanner
          message={statusMessage}
          tone="success"
          onClose={() => setStatusMessage('')}
        />

        {loading ? (
          <section className="pharmacy-panel p-8 text-secondary-text">Loading counseling sessions...</section>
        ) : (
          <>
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-accent-primary" />
                <h2 className="text-3xl font-semibold text-primary-text">Upcoming sessions</h2>
              </div>

              {upcomingSessions.length > 0 && (
                <div className="pharmacy-panel p-4 sm:p-5">
                  <div className="overflow-x-auto">
                    <div className="grid min-w-[980px] w-full grid-cols-[minmax(260px,1.6fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto] items-center gap-3 rounded-[1.75rem] border border-[#d7e4ea] bg-white/85 p-2.5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
                      <label className="flex h-12 items-center gap-3 rounded-[1.1rem] border border-[#d7e4ea] bg-[#fdfefe] px-4">
                        <Search className="h-4 w-4 text-secondary-text" />
                        <input
                          type="search"
                          value={upcomingFilters.query}
                          onChange={(event) => updateUpcomingFilter('query', event.target.value)}
                          placeholder="Search counselor or reason"
                          className="w-full border-0 bg-transparent text-sm text-primary-text outline-none placeholder:text-secondary-text"
                        />
                      </label>

                      <label className="flex h-12 items-center gap-3 rounded-[1.1rem] border border-[#d7e4ea] bg-[#fdfefe] px-4">
                        <Filter className="h-4 w-4 text-secondary-text" />
                        <select
                          value={upcomingFilters.type}
                          onChange={(event) => updateUpcomingFilter('type', event.target.value)}
                          className="w-full border-0 bg-transparent text-sm font-medium text-primary-text outline-none"
                        >
                          <option value="all">All formats</option>
                          {upcomingTypeOptions.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex h-12 items-center gap-3 rounded-[1.1rem] border border-[#d7e4ea] bg-[#fdfefe] px-4">
                        <CalendarDays className="h-4 w-4 text-secondary-text" />
                        <select
                          value={upcomingFilters.dateWindow}
                          onChange={(event) => updateUpcomingFilter('dateWindow', event.target.value)}
                          className="w-full border-0 bg-transparent text-sm font-medium text-primary-text outline-none"
                        >
                          {UPCOMING_DATE_FILTERS.map((filter) => (
                            <option key={filter.value} value={filter.value}>{filter.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex h-12 items-center gap-3 rounded-[1.1rem] border border-[#d7e4ea] bg-[#fdfefe] px-4">
                        <Filter className="h-4 w-4 text-secondary-text" />
                        <select
                          value={upcomingFilters.status}
                          onChange={(event) => updateUpcomingFilter('status', event.target.value)}
                          className="w-full border-0 bg-transparent text-sm font-medium text-primary-text outline-none"
                        >
                          <option value="all">All statuses</option>
                          {upcomingStatusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={resetUpcomingFilters}
                        className="pharmacy-secondary h-12 px-5 justify-center"
                      >
                        Reset filters
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pharmacy-panel p-4 sm:p-5">
                {upcomingSessions.length === 0 ? (
                  <div className="p-4 text-secondary-text">No upcoming counseling sessions yet.</div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between gap-3 px-1">
                      <p className="text-sm text-secondary-text">
                        Showing {filteredUpcomingSessions.length} of {upcomingSessions.length} upcoming sessions
                      </p>
                    </div>

                    <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 sm:pr-2">
                      {filteredUpcomingSessions.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-dashed border-[#d7e4ea] bg-secondary-bg/60 px-5 py-8 text-center text-secondary-text">
                          No sessions match the selected filters.
                        </div>
                      ) : filteredUpcomingSessions.map((session) => (
                        <SessionCard
                          key={session._id}
                          session={session}
                          actionId={actionId}
                          rescheduleState={rescheduleState}
                          onSelectDate={(date) => setRescheduleState((current) => ({ ...current, date }))}
                          onLoadSlots={loadRescheduleSlots}
                          onPickSlot={(slotId) => setRescheduleState((current) => ({ ...current, selectedSlotId: slotId, error: '' }))}
                          onPrefetchSession={handlePrefetchSession}
                          onReschedule={handleReschedule}
                          onDelete={handleDelete}
                          onOpenReschedule={openReschedule}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-accent-primary" />
                <h2 className="text-3xl font-semibold text-primary-text">History</h2>
              </div>

              {historySessions.length > 0 && (
                <div className="pharmacy-panel p-4 sm:p-5">
                  <div className="overflow-x-auto">
                    <div className="grid min-w-[980px] w-full grid-cols-[minmax(260px,1.6fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto] items-center gap-3 rounded-[1.75rem] border border-[#d7e4ea] bg-white/85 p-2.5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
                      <label className="flex h-12 items-center gap-3 rounded-[1.1rem] border border-[#d7e4ea] bg-[#fdfefe] px-4">
                        <Search className="h-4 w-4 text-secondary-text" />
                        <input
                          type="search"
                          value={historyFilters.query}
                          onChange={(event) => updateHistoryFilter('query', event.target.value)}
                          placeholder="Search counselor or reason"
                          className="w-full border-0 bg-transparent text-sm text-primary-text outline-none placeholder:text-secondary-text"
                        />
                      </label>

                      <label className="flex h-12 items-center gap-3 rounded-[1.1rem] border border-[#d7e4ea] bg-[#fdfefe] px-4">
                        <Filter className="h-4 w-4 text-secondary-text" />
                        <select
                          value={historyFilters.type}
                          onChange={(event) => updateHistoryFilter('type', event.target.value)}
                          className="w-full border-0 bg-transparent text-sm font-medium text-primary-text outline-none"
                        >
                          <option value="all">All formats</option>
                          {historyTypeOptions.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex h-12 items-center gap-3 rounded-[1.1rem] border border-[#d7e4ea] bg-[#fdfefe] px-4">
                        <CalendarDays className="h-4 w-4 text-secondary-text" />
                        <select
                          value={historyFilters.dateWindow}
                          onChange={(event) => updateHistoryFilter('dateWindow', event.target.value)}
                          className="w-full border-0 bg-transparent text-sm font-medium text-primary-text outline-none"
                        >
                          {HISTORY_DATE_FILTERS.map((filter) => (
                            <option key={filter.value} value={filter.value}>{filter.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex h-12 items-center gap-3 rounded-[1.1rem] border border-[#d7e4ea] bg-[#fdfefe] px-4">
                        <Filter className="h-4 w-4 text-secondary-text" />
                        <select
                          value={historyFilters.status}
                          onChange={(event) => updateHistoryFilter('status', event.target.value)}
                          className="w-full border-0 bg-transparent text-sm font-medium text-primary-text outline-none"
                        >
                          <option value="all">All statuses</option>
                          {historyStatusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={resetHistoryFilters}
                        className="pharmacy-secondary h-12 px-5 justify-center"
                      >
                        Reset filters
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {historySessions.length === 0 ? (
                <div className="pharmacy-panel p-8 text-secondary-text">Past, completed, cancelled, and missed sessions will appear here.</div>
              ) : (
                <div className="pharmacy-panel p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3 px-1">
                    <p className="text-sm text-secondary-text">
                      Showing {filteredHistorySessions.length} of {historySessions.length} history sessions
                    </p>
                  </div>

                  <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 sm:pr-2">
                    {filteredHistorySessions.length === 0 ? (
                      <div className="rounded-[1.5rem] border border-dashed border-[#d7e4ea] bg-secondary-bg/60 px-5 py-8 text-center text-secondary-text">
                        No history sessions match the selected filters.
                      </div>
                    ) : filteredHistorySessions.map((session) => (
                      <SessionCard
                        key={session._id}
                        session={session}
                        actionId={actionId}
                        rescheduleState={rescheduleState}
                        onSelectDate={(date) => setRescheduleState((current) => ({ ...current, date }))}
                        onLoadSlots={loadRescheduleSlots}
                        onPickSlot={(slotId) => setRescheduleState((current) => ({ ...current, selectedSlotId: slotId, error: '' }))}
                        onPrefetchSession={handlePrefetchSession}
                        onReschedule={handleReschedule}
                        onDelete={handleDelete}
                        onOpenReschedule={openReschedule}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        <DismissibleBanner
          message={error}
          tone="error"
          onClose={() => setError('')}
        />
      </div>
    </div>
  );
}
