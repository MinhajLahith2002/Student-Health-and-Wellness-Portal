import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, Lock, NotebookPen, Pencil, Plus, Search, Trash2, Video } from 'lucide-react';
import DismissibleBanner from '../../components/DismissibleBanner';
import {
  createCounselorSlot,
  deleteCounselorSlot,
  deleteCounselingSession,
  getCachedCounselorWorkspace,
  getCancellationActorLabel,
  getCounselorWorkspace,
  subscribeCounselorDashboardRefresh,
  subscribeCounselingLiveRefresh,
  updateCounselorSlot
} from '../../lib/counseling';
import { cn } from '../../lib/utils';

function getDefaultDate() {
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

const DEFAULT_SLOT_TIMES = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM'
];

const ALLOWED_SLOT_MODES = ['video', 'chat', 'in_person'];
const ALLOWED_FILTER_MODES = ['all', ...ALLOWED_SLOT_MODES];
const ALLOWED_OUTCOME_FILTERS = ['all', 'no-show'];
const ACTIVE_SESSION_STATUSES = ['Pending', 'Confirmed', 'Ready', 'In Progress'];
const OUTCOME_SESSION_STATUSES = ['Completed', 'Cancelled', 'No Show'];

function normalizeSlotDate(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const plainIsoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (plainIsoMatch) return plainIsoMatch[1];

    const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function formatSlotDate(value) {
  const normalized = normalizeSlotDate(value);
  if (!normalized) return '';

  const [year, month, day] = normalized.split('-').map(Number);
  const safeDate = new Date(year, month - 1, day);
  return safeDate.toLocaleDateString();
}

function normalizeSlotTime(value) {
  return `${value || ''}`.trim().replace(/\s+/g, ' ').toUpperCase();
}

function toTimeInputValue(value) {
  const match = `${value || ''}`.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '10:00';

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  } else if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function fromTimeInputValue(value) {
  const match = `${value || ''}`.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) return '10:00 AM';

  const hours24 = Number(match[1]);
  const minutes = match[2];
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${minutes} ${suffix}`;
}

function toMinutes(value) {
  const match = `${value || ''}`.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const suffix = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  if (hours === 12) hours = 0;
  if (suffix === 'PM') hours += 12;

  return (hours * 60) + minutes;
}

function isFutureDateTime(date, time) {
  if (!date || !time) return true;

  const timeValue = toTimeInputValue(time);
  if (!timeValue) return false;

  const stamp = new Date(`${date}T${timeValue}:00`);
  return Number.isFinite(stamp.getTime()) && stamp.getTime() > Date.now();
}

function slotExists(openSlots, date, startTime, excludeId = '') {
  const normalizedDate = normalizeSlotDate(date);
  const normalizedTime = normalizeSlotTime(startTime);

  return openSlots.some((slot) => (
    slot.availabilityEntryId !== excludeId
    && normalizeSlotDate(slot.date) === normalizedDate
    && normalizeSlotTime(slot.startTime || slot.time) === normalizedTime
  ));
}

function getSuggestedSlotForm(openSlots = []) {
  const today = new Date();

  for (let dayOffset = 1; dayOffset <= 30; dayOffset += 1) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + dayOffset);
    const date = getDateInputValue(nextDate);
    const nextTime = DEFAULT_SLOT_TIMES.find((time) => !slotExists(openSlots, date, time));

    if (nextTime) {
      return {
        date,
        startTime: nextTime,
        duration: 50,
        mode: 'video',
        notes: ''
      };
    }
  }

  return {
    date: getDefaultDate(),
    startTime: '10:00 AM',
    duration: 50,
    mode: 'video',
    notes: ''
  };
}

function sortSlots(slots = []) {
  return [...slots].sort((left, right) => {
    const leftStamp = new Date(`${normalizeSlotDate(left.date)}T${toTimeInputValue(left.startTime || left.time)}:00`).getTime();
    const rightStamp = new Date(`${normalizeSlotDate(right.date)}T${toTimeInputValue(right.startTime || right.time)}:00`).getTime();
    return leftStamp - rightStamp;
  });
}

function getSessionDateTimeStamp(session) {
  const normalizedDate = normalizeSlotDate(session?.date);
  const timeValue = toTimeInputValue(session?.time);
  if (!normalizedDate || !timeValue) return 0;
  return new Date(`${normalizedDate}T${timeValue}:00`).getTime();
}

function getSessionEndTimeStamp(session) {
  const startStamp = getSessionDateTimeStamp(session);
  if (!startStamp) return 0;

  const durationMinutes = Math.max(15, Number(session?.duration) || 50);
  return startStamp + (durationMinutes * 60 * 1000);
}

function getValidTimeStamp(value) {
  if (!value) return 0;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getSessionOutcomeTimeStamp(session) {
  return getValidTimeStamp(session?.outcomeAt)
    || (session?.status === 'Cancelled' ? getValidTimeStamp(session?.cancelledAt) : 0)
    || getValidTimeStamp(session?.updatedAt)
    || getValidTimeStamp(session?.createdAt)
    || getSessionDateTimeStamp(session);
}

function isLiveSessionLocked(session) {
  const startDate = session?.startsAt ? new Date(session.startsAt) : null;
  const hasStarted = Boolean(startDate && !Number.isNaN(startDate.getTime()) && startDate.getTime() <= Date.now());

  return ['video', 'chat'].includes(session?.mode)
    && ['Confirmed', 'Ready'].includes(session?.status)
    && !hasStarted;
}

function formatSessionStart(session) {
  const startDate = session?.startsAt ? new Date(session.startsAt) : null;
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

function getSessionStatusTone(status) {
  if (status === 'Completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'Cancelled') return 'bg-rose-50 text-rose-700';
  if (status === 'No Show') return 'bg-amber-50 text-amber-700';
  return 'bg-sky-50 text-sky-700';
}

function validateSlotField(field, form, openSlots, editingSlotId) {
  const noteLength = `${form.notes || ''}`.trim().length;

  switch (field) {
    case 'date':
      if (!form.date) return 'Date is required.';
      if (!isFutureDateTime(form.date, form.startTime)) return 'Choose a future date and time.';
      return '';
    case 'startTime':
      if (!form.startTime) return 'Start time is required.';
      if (toMinutes(form.startTime) === null) return 'Choose a valid start time.';
      if (!isFutureDateTime(form.date, form.startTime)) return 'Choose a future date and time.';
      if (slotExists(openSlots, form.date, form.startTime, editingSlotId)) {
        return 'That counselor slot already exists. Choose a different time.';
      }
      return '';
    case 'duration':
      if (!form.duration) return 'Duration is required.';
      if (Number(form.duration) < 15 || Number(form.duration) > 120) {
        return 'Duration must be between 15 and 120 minutes.';
      }
      return '';
    case 'mode':
      if (!ALLOWED_SLOT_MODES.includes(form.mode)) {
        return 'Choose a valid session mode.';
      }
      return '';
    case 'notes':
      if (noteLength > 500) return 'Slot note cannot exceed 500 characters.';
      return '';
    default:
      return '';
  }
}

function validateSlotForm(form, openSlots, editingSlotId) {
  return {
    date: validateSlotField('date', form, openSlots, editingSlotId),
    startTime: validateSlotField('startTime', form, openSlots, editingSlotId),
    duration: validateSlotField('duration', form, openSlots, editingSlotId),
    mode: validateSlotField('mode', form, openSlots, editingSlotId),
    notes: validateSlotField('notes', form, openSlots, editingSlotId)
  };
}

function validateFilterField(field, filters) {
  switch (field) {
    case 'query':
      if ((filters.query || '').trim().length > 80) {
        return 'Search must be 80 characters or fewer.';
      }
      if (!/^[\p{L}\p{N}\s:,'./-]*$/u.test(filters.query || '')) {
        return 'Search can only include letters, numbers, spaces, and basic punctuation.';
      }
      return '';
    case 'date':
      if (!filters.date) return '';
      if (!normalizeSlotDate(filters.date)) return 'Choose a valid date.';
      if (normalizeSlotDate(filters.date) < normalizeSlotDate(new Date())) {
        return 'Past dates are not allowed here.';
      }
      return '';
    case 'mode':
      return ALLOWED_FILTER_MODES.includes(filters.mode) ? '' : 'Choose a valid mode.';
    default:
      return '';
  }
}

const initialSlotForm = getSuggestedSlotForm();

export default function CounselorSessionsWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialWorkspaceCacheRef = useRef(getCachedCounselorWorkspace());
  const [workspace, setWorkspace] = useState(initialWorkspaceCacheRef.current);
  const [loading, setLoading] = useState(
    !(
      initialWorkspaceCacheRef.current.openSlots.length
      || initialWorkspaceCacheRef.current.bookedSessions.length
      || initialWorkspaceCacheRef.current.recentOutcomes.length
    )
  );
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [slotForm, setSlotForm] = useState(initialSlotForm);
  const [slotErrors, setSlotErrors] = useState({});
  const [editingSlotId, setEditingSlotId] = useState('');
  const [actionId, setActionId] = useState('');
  const [slotFilters, setSlotFilters] = useState({
    date: '',
    mode: 'all',
    query: ''
  });
  const [slotFilterErrors, setSlotFilterErrors] = useState({
    date: '',
    mode: '',
    query: ''
  });

  async function loadWorkspace(options = {}) {
    const { suppressError = false } = options;

    try {
      const data = await getCounselorWorkspace();
      setWorkspace(data);
      if (!suppressError) {
        setError('');
      }
      return data;
    } catch (err) {
      if (!suppressError) {
        setError(err.message || 'Failed to load counselor workspace');
      }
      return null;
    }
  }

  useEffect(() => {
    let active = true;

    const refreshWorkspace = async (options = {}) => {
      try {
        const data = await getCounselorWorkspace();
        if (!active) return;
        setWorkspace(data);
        if (!options.suppressError) {
          setError('');
        }
      } catch (err) {
        if (!active || options.suppressError) return;
        setError(err.message || 'Failed to load counselor workspace');
      } finally {
        if (active && !options.suppressLoading) {
          setLoading(false);
        }
      }
    };

    const hasCachedWorkspace = initialWorkspaceCacheRef.current.openSlots.length > 0
      || initialWorkspaceCacheRef.current.bookedSessions.length > 0
      || initialWorkspaceCacheRef.current.recentOutcomes.length > 0;

    window.setTimeout(() => {
      if (active) {
        refreshWorkspace({ suppressLoading: hasCachedWorkspace });
      }
    }, 0);

    const intervalId = window.setInterval(() => {
      refreshWorkspace({ suppressError: true, suppressLoading: true });
    }, 15000);

    const unsubscribeDashboardRefresh = subscribeCounselorDashboardRefresh(() => {
      refreshWorkspace({ suppressError: true, suppressLoading: true });
    });

    const unsubscribeLiveRefresh = subscribeCounselingLiveRefresh(() => {
      refreshWorkspace({ suppressError: true, suppressLoading: true });
    });

    const handleWindowFocus = () => {
      refreshWorkspace({ suppressError: true, suppressLoading: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshWorkspace({ suppressError: true, suppressLoading: true });
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      unsubscribeDashboardRefresh();
      unsubscribeLiveRefresh();
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const activeBookedSlotIds = useMemo(
    () => new Set(
      workspace.bookedSessions
        .filter((session) => ACTIVE_SESSION_STATUSES.includes(session.status) && getSessionEndTimeStamp(session) > Date.now())
        .map((session) => session.availabilityEntryId)
        .filter(Boolean)
    ),
    [workspace.bookedSessions]
  );
  const futureOpenSlots = useMemo(
    () => sortSlots(
      workspace.openSlots.filter((slot) => (
        isFutureDateTime(normalizeSlotDate(slot.date), slot.startTime || slot.time)
        && !activeBookedSlotIds.has(slot.availabilityEntryId)
      ))
    ),
    [activeBookedSlotIds, workspace.openSlots]
  );
  const upcomingSessions = useMemo(
    () => workspace.bookedSessions
      .filter((session) => ACTIVE_SESSION_STATUSES.includes(session.status) && getSessionEndTimeStamp(session) > Date.now())
      .sort((left, right) => getSessionDateTimeStamp(left) - getSessionDateTimeStamp(right)),
    [workspace.bookedSessions]
  );
  const recentOutcomeSessions = useMemo(
    () => (workspace.recentOutcomes?.length ? workspace.recentOutcomes : workspace.bookedSessions)
      .filter((session) => OUTCOME_SESSION_STATUSES.includes(session.status))
      .sort((left, right) => {
        const outcomeDifference = getSessionOutcomeTimeStamp(right) - getSessionOutcomeTimeStamp(left);
        return outcomeDifference || getSessionDateTimeStamp(right) - getSessionDateTimeStamp(left);
      })
      .slice(0, 8),
    [workspace.bookedSessions, workspace.recentOutcomes]
  );
  const outcomeFilter = ALLOWED_OUTCOME_FILTERS.includes(searchParams.get('outcome'))
    ? searchParams.get('outcome')
    : 'all';
  const filteredRecentOutcomeSessions = useMemo(
    () => recentOutcomeSessions.filter((session) => (
      outcomeFilter === 'no-show' ? session.status === 'No Show' : true
    )),
    [outcomeFilter, recentOutcomeSessions]
  );

  const filteredOpenSlots = useMemo(() => {
    const normalizedQuery = slotFilters.query.trim().toLowerCase();

    return futureOpenSlots.filter((slot) => {
      const matchesDate = !slotFilters.date || normalizeSlotDate(slot.date) === slotFilters.date;
      const matchesMode = slotFilters.mode === 'all' || slot.mode === slotFilters.mode;
      const matchesQuery = !normalizedQuery
        || `${slot.time} ${slot.typeLabel} ${slot.notes || ''}`.toLowerCase().includes(normalizedQuery);

      return matchesDate && matchesMode && matchesQuery;
    });
  }, [futureOpenSlots, slotFilters]);

  async function handleSubmitSlot(event) {
    event.preventDefault();
    const nextErrors = validateSlotForm(slotForm, futureOpenSlots, editingSlotId);
    setSlotErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setError('Please fix the slot form before saving.');
      return;
    }

    try {
      setActionId(editingSlotId || 'new');
      setError('');
      setStatusMessage('');

      if (editingSlotId) {
        const updatedSlot = await updateCounselorSlot(editingSlotId, slotForm);
        setWorkspace((current) => ({
          ...current,
          openSlots: sortSlots(
            current.openSlots.map((slot) => (
              slot.availabilityEntryId === editingSlotId ? updatedSlot : slot
            ))
          )
        }));
        setStatusMessage('Counselor slot updated successfully.');
      } else {
        const createdSlot = await createCounselorSlot(slotForm);
        setWorkspace((current) => ({
          ...current,
          openSlots: sortSlots([...current.openSlots, createdSlot])
        }));
        setStatusMessage('Counselor slot created successfully.');
      }

      const refreshedWorkspace = await loadWorkspace();
      setEditingSlotId('');
      setSlotErrors({});
      setSlotForm(getSuggestedSlotForm(refreshedWorkspace?.openSlots || futureOpenSlots));
    } catch (err) {
      const message = err.message || 'Failed to save counselor slot';
      if (/already exists/i.test(message)) {
        setSlotErrors((current) => ({
          ...current,
          startTime: 'That counselor slot already exists. Choose a different time.'
        }));
      }
      setError(message);
    } finally {
      setActionId('');
    }
  }

  function updateSlotField(field, value) {
    const nextForm = { ...slotForm, [field]: value };
    setSlotForm(nextForm);
    setSlotErrors((current) => ({
      ...current,
      [field]: validateSlotField(field, nextForm, futureOpenSlots, editingSlotId),
      ...(field === 'date' || field === 'startTime'
        ? {
            date: validateSlotField('date', nextForm, futureOpenSlots, editingSlotId),
            startTime: validateSlotField('startTime', nextForm, futureOpenSlots, editingSlotId)
          }
        : {})
    }));
    setError('');
  }

  function startEditing(slot) {
    setEditingSlotId(slot.availabilityEntryId);
    setSlotForm({
      date: getDateInputValue(new Date(slot.date)),
      startTime: slot.startTime,
      duration: slot.duration,
      mode: slot.mode,
      notes: slot.notes || ''
    });
    setSlotErrors({});
    setError('');
    setStatusMessage('');
  }

  async function handleDeleteSlot(slotId) {
    try {
      setActionId(slotId);
      setError('');
      setStatusMessage('');
      await deleteCounselorSlot(slotId);
      setStatusMessage('Open slot removed successfully.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message || 'Failed to remove counselor slot');
    } finally {
      setActionId('');
    }
  }

  async function handleCancelSession(sessionId) {
    try {
      setActionId(sessionId);
      setError('');
      setStatusMessage('');
      await deleteCounselingSession(sessionId, { cancellationReason: 'Cancelled by counselor' });
      setStatusMessage('Booked session cancelled and slot reopened.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message || 'Failed to cancel booked session');
    } finally {
      setActionId('');
    }
  }

  function updateSlotFilter(field, value) {
    setSlotFilters((current) => {
      const nextFilters = { ...current, [field]: value };
      setSlotFilterErrors((currentErrors) => ({
        ...currentErrors,
        [field]: validateFilterField(field, nextFilters)
      }));
      return nextFilters;
    });
  }

  return (
    <div className="pharmacy-shell min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-8 pt-4 space-y-8">
        <section className="pharmacy-hero">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-text shadow-sm backdrop-blur">
                <CalendarDays className="h-3.5 w-3.5 text-accent-primary" />
                Counselor Scheduling
              </span>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17.25rem] xl:items-start">
              <div className="min-w-0 space-y-4">
                <h1 className="max-w-[54rem] text-4xl font-semibold tracking-tight text-primary-text md:text-[3.05rem] md:leading-[1.06]">
                  Publish open slots and keep booked counseling sessions organized.
                </h1>
                <p className="max-w-[50rem] text-lg leading-8 text-secondary-text">
                  Open slots stay editable until a student books them. Once reserved, the same slot moves into your booked session workspace so scheduling and follow-up stay connected.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/counselor/notes"
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:translate-y-[-1px] hover:bg-emerald-500"
                  >
                    <NotebookPen className="h-4.5 w-4.5 text-white" />
                    View notes history
                  </Link>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/78 px-4 py-2 text-sm font-medium text-secondary-text shadow-sm backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Slot updates stay synced
                  </div>
                </div>
              </div>

              <div className="space-y-3 xl:w-[17.25rem]">
                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-2xl border border-white/75 bg-white/78 px-4 py-3 shadow-sm backdrop-blur">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Open slots</p>
                    <p className="mt-1 text-2xl font-semibold text-primary-text">{futureOpenSlots.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/75 bg-white/78 px-4 py-3 shadow-sm backdrop-blur">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Active bookings</p>
                    <p className="mt-1 text-2xl font-semibold text-primary-text">{upcomingSessions.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/75 bg-white/78 px-4 py-3 shadow-sm backdrop-blur">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Recent outcomes</p>
                    <p className="mt-1 text-2xl font-semibold text-primary-text">{recentOutcomeSessions.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <DismissibleBanner
          message={statusMessage}
          tone="success"
          onClose={() => setStatusMessage('')}
        />
        <DismissibleBanner
          message={error}
          tone="error"
          onClose={() => setError('')}
        />

        <section className="grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
          <form onSubmit={handleSubmitSlot} className="pharmacy-panel p-7 space-y-5">
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-accent-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">{editingSlotId ? 'Update slot' : 'Create slot'}</p>
                <h2 className="mt-1 text-2xl font-semibold text-primary-text">Counselor-owned open slot</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Date</label>
                <input
                  type="date"
                  value={slotForm.date}
                  min={getDateInputValue()}
                  onChange={(event) => updateSlotField('date', event.target.value)}
                  className={cn('student-field', slotErrors.date && 'ring-2 ring-red-300')}
                />
                {slotErrors.date && <p className="text-sm text-red-600">{slotErrors.date}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Start time</label>
                <input
                  type="time"
                  value={toTimeInputValue(slotForm.startTime)}
                  step="900"
                  onChange={(event) => updateSlotField('startTime', fromTimeInputValue(event.target.value))}
                  className={cn('student-field', slotErrors.startTime && 'ring-2 ring-red-300')}
                />
                {slotErrors.startTime && <p className="text-sm text-red-600">{slotErrors.startTime}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Duration</label>
                <select
                  value={slotForm.duration}
                  onChange={(event) => updateSlotField('duration', Number(event.target.value))}
                  className={cn('student-field', slotErrors.duration && 'ring-2 ring-red-300')}
                >
                  {[30, 45, 50, 60].map((value) => <option key={value} value={value}>{value} minutes</option>)}
                </select>
                {slotErrors.duration && <p className="text-sm text-red-600">{slotErrors.duration}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Mode</label>
                <select
                  value={slotForm.mode}
                  onChange={(event) => updateSlotField('mode', event.target.value)}
                  className={cn('student-field', slotErrors.mode && 'ring-2 ring-red-300')}
                >
                  <option value="video">Video Call</option>
                  <option value="chat">Chat</option>
                  <option value="in_person">In-Person</option>
                </select>
                {slotErrors.mode && <p className="text-sm text-red-600">{slotErrors.mode}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Slot note</label>
              <textarea
                rows={4}
                value={slotForm.notes}
                onChange={(event) => updateSlotField('notes', event.target.value)}
                className={cn('student-field min-h-28 resize-none', slotErrors.notes && 'ring-2 ring-red-300')}
                placeholder="Optional note about this slot."
              />
              {slotErrors.notes && <p className="text-sm text-red-600">{slotErrors.notes}</p>}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={actionId === 'new' || (Boolean(editingSlotId) && actionId === editingSlotId)}
                className="pharmacy-primary disabled:opacity-50"
              >
                {editingSlotId ? 'Update Slot' : 'Create Slot'}
              </button>
              {editingSlotId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSlotId('');
                    setSlotErrors({});
                    setSlotForm(getSuggestedSlotForm(futureOpenSlots));
                  }}
                  className="pharmacy-secondary"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="space-y-6">
            <section className="pharmacy-panel p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Open slot inventory</p>
                  <h2 className="mt-2 text-2xl font-semibold text-primary-text">{filteredOpenSlots.length} future slots ready for booking</h2>
                  <p className="mt-2 text-sm text-secondary-text">Showing {filteredOpenSlots.length} of {futureOpenSlots.length} open slots.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 rounded-[1.5rem] bg-secondary-bg/70 p-4 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1.25fr)_minmax(12rem,0.95fr)_minmax(11rem,0.8fr)] xl:items-end">
                <div className="flex min-h-[7.75rem] flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Search</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-text" />
                    <input
                      type="text"
                      value={slotFilters.query}
                      onChange={(event) => updateSlotFilter('query', event.target.value)}
                      className={cn('student-field pl-11', slotFilterErrors.query && 'ring-2 ring-red-300')}
                      placeholder="Time, mode, or note"
                    />
                  </div>
                  <p className={cn('min-h-[2.5rem] text-sm leading-5', slotFilterErrors.query ? 'text-red-600' : 'invisible')}>
                    {slotFilterErrors.query || 'Placeholder'}
                  </p>
                </div>
                <div className="flex min-h-[7.75rem] flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Filter by date</label>
                  <input
                    type="date"
                    value={slotFilters.date}
                    onChange={(event) => updateSlotFilter('date', event.target.value)}
                    className={cn('student-field', slotFilterErrors.date && 'ring-2 ring-red-300')}
                  />
                  <p className={cn('min-h-[2.5rem] text-sm leading-5', slotFilterErrors.date ? 'text-red-600' : 'invisible')}>
                    {slotFilterErrors.date || 'Placeholder'}
                  </p>
                </div>
                <div className="flex min-h-[7.75rem] flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Mode</label>
                  <select
                    value={slotFilters.mode}
                    onChange={(event) => updateSlotFilter('mode', event.target.value)}
                    className={cn('student-field', slotFilterErrors.mode && 'ring-2 ring-red-300')}
                  >
                    <option value="all">All modes</option>
                    <option value="video">Video Call</option>
                    <option value="chat">Chat</option>
                    <option value="in_person">In-Person</option>
                  </select>
                  <p className={cn('min-h-[2.5rem] text-sm leading-5', slotFilterErrors.mode ? 'text-red-600' : 'invisible')}>
                    {slotFilterErrors.mode || 'Placeholder'}
                  </p>
                </div>
              </div>

              {loading ? (
                <p className="mt-6 text-secondary-text">Loading slot inventory...</p>
              ) : (
                <div className="mt-6 h-[30rem] space-y-4 overflow-y-auto pr-2">
                  {!!filteredOpenSlots.length && (
                    <div className="overflow-hidden rounded-[1.5rem] bg-secondary-bg/80">
                      {filteredOpenSlots.map((slot, index) => (
                        <div
                          key={slot.availabilityEntryId}
                          className={cn(
                            'px-5 py-4',
                            index !== filteredOpenSlots.length - 1 && 'border-b border-white/70'
                          )}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="font-semibold text-primary-text">{formatSlotDate(slot.date)} • {slot.time}</p>
                              <p className="mt-1 text-sm text-secondary-text">{slot.typeLabel} • {slot.duration} min</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <button type="button" onClick={() => startEditing(slot)} className="pharmacy-secondary">
                                <Pencil className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSlot(slot.availabilityEntryId)}
                                disabled={actionId === slot.availabilityEntryId}
                                className="inline-flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3.5 font-bold text-rose-700 disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!futureOpenSlots.length && (
                    <p className="text-sm text-secondary-text">Create a slot to start publishing counselor availability.</p>
                  )}
                  {futureOpenSlots.length > 0 && !filteredOpenSlots.length && (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-5 py-6 text-sm text-secondary-text">
                      No open slots match the current filters.
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="pharmacy-panel p-7">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-accent-primary" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Booked sessions</p>
                  <h2 className="mt-2 text-2xl font-semibold text-primary-text">{upcomingSessions.length} active booking{upcomingSessions.length === 1 ? '' : 's'}</h2>
                </div>
              </div>

              <div className="mt-6">
                {upcomingSessions.length > 0 ? (
                  <div className="max-h-[440px] overflow-y-auto rounded-[1.75rem] bg-secondary-bg/70">
                    {upcomingSessions.map((session, index) => (
                      <div
                        key={session._id}
                        className={cn(
                          'px-5 py-4',
                          index !== upcomingSessions.length - 1 && 'border-b border-white/70'
                        )}
                      >
                        {(() => {
                          const liveSessionLocked = isLiveSessionLocked(session);
                          const sessionStartLabel = formatSessionStart(session);

                          return (
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <Link to={`/counselor/sessions/${session._id}`} className="font-semibold text-primary-text">{session.studentName}</Link>
                            <p className="mt-1 text-sm text-secondary-text">{formatSlotDate(session.date)} • {session.time} • {session.typeLabel}</p>
                            {liveSessionLocked && (
                              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                <Lock className="h-3.5 w-3.5" />
                                Opens at {sessionStartLabel}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {liveSessionLocked ? (
                              <button
                                type="button"
                                disabled
                                title={`This session opens at ${sessionStartLabel}`}
                                className="pharmacy-secondary cursor-not-allowed opacity-60"
                              >
                                <Lock className="w-4 h-4" />
                                Open Session
                              </button>
                            ) : (
                              <Link to={`/counselor/sessions/${session._id}`} className="pharmacy-secondary">Open Session</Link>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCancelSession(session._id)}
                              disabled={actionId === session._id}
                              className="inline-flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3.5 font-bold text-rose-700 disabled:opacity-50"
                            >
                              Cancel Booking
                            </button>
                          </div>
                        </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-text">Booked sessions will move here once students reserve your open slots.</p>
                )}
              </div>
            </section>

            <section id="recent-outcomes" className="pharmacy-panel p-7">
              <div className="flex items-center gap-3">
                <NotebookPen className="w-5 h-5 text-accent-primary" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Recent outcomes</p>
                  <h2 className="mt-2 text-2xl font-semibold text-primary-text">Completed, cancelled, and no-show history</h2>
                </div>
              </div>

              <div className="mt-6">
                {recentOutcomeSessions.length > 0 && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-[#d7e4ea] bg-white/80 px-4 py-3">
                    <p className="text-sm text-secondary-text">
                      {outcomeFilter === 'no-show'
                        ? `Showing ${filteredRecentOutcomeSessions.length} no-show session${filteredRecentOutcomeSessions.length === 1 ? '' : 's'}`
                        : `Showing ${recentOutcomeSessions.length} recent outcome${recentOutcomeSessions.length === 1 ? '' : 's'}`}
                    </p>
                    {outcomeFilter === 'no-show' ? (
                      <button
                        type="button"
                        onClick={() => setSearchParams({}, { replace: true })}
                        className="pharmacy-secondary"
                      >
                        Clear filter
                      </button>
                    ) : null}
                  </div>
                )}

                {recentOutcomeSessions.length > 0 ? (
                  <div className="max-h-[420px] overflow-y-auto rounded-[1.75rem] bg-secondary-bg/70">
                    {filteredRecentOutcomeSessions.length > 0 ? filteredRecentOutcomeSessions.map((session, index) => (
                      <div
                        key={session._id}
                        className={cn(
                          'px-5 py-4',
                          index !== filteredRecentOutcomeSessions.length - 1 && 'border-b border-white/70'
                        )}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <Link to={`/counselor/sessions/${session._id}`} className="font-semibold text-primary-text">{session.studentName}</Link>
                            <p className="mt-1 text-sm text-secondary-text">{formatSlotDate(session.date)} • {session.time} • {session.typeLabel}</p>
                            {session.status === 'Cancelled' && (
                              <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                                {getCancellationActorLabel(session)}
                              </p>
                            )}
                            {session.status === 'Cancelled' && session.cancellationReason && (
                              <p className="mt-1 text-sm text-secondary-text">Reason: {session.cancellationReason}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={cn('pharmacy-pill', getSessionStatusTone(session.status))}>{session.status}</span>
                            <Link to={`/counselor/sessions/${session._id}`} className="pharmacy-secondary">Review Session</Link>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="px-5 py-6 text-sm text-secondary-text">
                        No recent outcome sessions match the current filter.
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-text">Completed, cancelled, and no-show sessions will appear here for quick follow-through.</p>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
