import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MessageSquareText, RefreshCcw, Trash2 } from 'lucide-react';
import {
  getCachedCounselingSessions,
  deleteCounselingSession,
  getCounselingSessions,
  getCounselorSlots,
  prefetchCounselingSessionById,
  rescheduleCounselingSession
} from '../../lib/counseling';
import DismissibleBanner from '../../components/DismissibleBanner';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

const SESSION_FETCH_LIMIT = 100;

function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
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

  return (
    <article className="pharmacy-card p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Counseling session</p>
          <Link
            to={`/mental-health/sessions/${session._id}`}
            onMouseEnter={() => onPrefetchSession(session._id)}
            onFocus={() => onPrefetchSession(session._id)}
            className="mt-3 block text-2xl font-semibold text-primary-text"
          >
            {session.counselorName}
          </Link>
          <p className="mt-2 text-sm text-secondary-text">{new Date(session.date).toLocaleDateString()} • {session.time} • {session.typeLabel}</p>
          <p className="mt-4 text-sm leading-6 text-secondary-text">{session.reason}</p>
        </div>

        <span className={cn(
          'pharmacy-pill',
          session.status === 'Completed' ? 'bg-emerald-50 text-emerald-700'
            : session.status === 'Cancelled' ? 'bg-rose-50 text-rose-700'
              : 'bg-sky-50 text-sky-700'
        )}>
          {session.status}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to={`/mental-health/sessions/${session._id}`}
          onMouseEnter={() => onPrefetchSession(session._id)}
          onFocus={() => onPrefetchSession(session._id)}
          className="pharmacy-secondary"
        >
          <MessageSquareText className="w-4 h-4" />
          Open Session
        </Link>
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
            {session.cancellationReason ? ` Reason: ${session.cancellationReason}` : ''}
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
                min={new Date().toISOString().slice(0, 10)}
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
                    onClick={() => onPickSlot(slot.availabilityEntryId)}
                    className={cn(
                      'rounded-[1.25rem] border px-4 py-3 text-left',
                      rescheduleState.selectedSlotId === slot.availabilityEntryId
                        ? 'border-accent-primary bg-white shadow-[0_16px_32px_rgba(20,116,139,0.10)]'
                        : 'border-white/80 bg-secondary-bg/70'
                    )}
                  >
                    <p className="font-semibold text-primary-text">{slot.time}</p>
                    <p className="mt-1 text-sm text-secondary-text">{slot.typeLabel} • {slot.duration} min</p>
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
  const [sessions, setSessions] = useState(() => Array.isArray(cachedSessions?.sessions) ? cachedSessions.sessions : []);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState(location.state?.statusMessage || '');
  const [loading, setLoading] = useState(() => !Array.isArray(cachedSessions?.sessions));
  const [actionId, setActionId] = useState('');
  const [rescheduleState, setRescheduleState] = useState({
    sessionId: '',
    date: getTomorrow(),
    slots: [],
    selectedSlotId: '',
    loading: false,
    error: ''
  });

  async function loadSessions() {
    try {
      const data = await getCounselingSessions({ limit: SESSION_FETCH_LIMIT });
      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load counseling sessions');
    }
  }

  function handlePrefetchSession(sessionId) {
    prefetchCounselingSessionById(sessionId).catch(() => {});
  }

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getCounselingSessions({ limit: SESSION_FETCH_LIMIT });
        if (!active) return;
        setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load counseling sessions');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const upcomingSessions = useMemo(
    () => sessions
      .filter((session) => ['Confirmed', 'Ready', 'In Progress'].includes(session.status))
      .sort((left, right) => (
        new Date(left.date).getTime() - new Date(right.date).getTime()
        || `${left.time}`.localeCompare(`${right.time}`)
      )),
    [sessions]
  );
  const historySessions = useMemo(
    () => sessions
      .filter((session) => ['Completed', 'Cancelled'].includes(session.status))
      .sort((left, right) => (
        new Date(right.date).getTime() - new Date(left.date).getTime()
        || `${right.time}`.localeCompare(`${left.time}`)
      )),
    [sessions]
  );

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
        ? data.slots.filter((slot) => slot.availabilityEntryId !== session.availabilityEntryId)
        : [];

      setRescheduleState((current) => ({
        ...current,
        loading: false,
        slots,
        selectedSlotId: slots[0]?.availabilityEntryId || ''
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
    const nextDate = session.date ? new Date(session.date).toISOString().slice(0, 10) : getTomorrow();
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

    try {
      setActionId(sessionId);
      setError('');
      setStatusMessage('');
      await rescheduleCounselingSession(sessionId, {
        availabilityEntryId: rescheduleState.selectedSlotId
      });
      setRescheduleState({
        sessionId: '',
        date: getTomorrow(),
        slots: [],
        selectedSlotId: '',
        loading: false,
        error: ''
      });
      setStatusMessage('Counseling session updated successfully.');
      await loadSessions();
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
      await deleteCounselingSession(sessionId);
      setStatusMessage('Booking deleted and the slot is available again.');
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to delete the booking');
    } finally {
      setActionId('');
    }
  }

  if (user?.role !== 'student') {
    return null;
  }

  return (
    <div className="pharmacy-shell pt-36 pb-16 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Link to="/mental-health/counselors" className="pharmacy-secondary w-full justify-center sm:w-auto">
            <ArrowLeft className="w-4 h-4" />
            Back to Counselor Directory
          </Link>
        </div>

        <section className="pharmacy-hero">
          <span className="pharmacy-pill bg-emerald-50 text-emerald-700">My Counseling Sessions</span>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-primary-text">Manage booked sessions and counseling history.</h1>
          <p className="mt-4 text-lg text-secondary-text">
            Reschedule by choosing a new open slot from the same counselor, remove bookings before completion, and return after completion for follow-up summaries and feedback.
          </p>
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

              {upcomingSessions.length === 0 ? (
                <div className="pharmacy-panel p-8 text-secondary-text">No upcoming counseling sessions yet.</div>
              ) : (
                upcomingSessions.map((session) => (
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
                ))
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-accent-primary" />
                <h2 className="text-3xl font-semibold text-primary-text">History</h2>
              </div>

              {historySessions.length === 0 ? (
                <div className="pharmacy-panel p-8 text-secondary-text">Completed and cancelled sessions will appear here.</div>
              ) : (
                historySessions.map((session) => (
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
                ))
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
