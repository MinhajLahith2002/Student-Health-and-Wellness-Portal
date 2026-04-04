import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, History, MessageSquareText, XCircle } from 'lucide-react';
import { getCounselingSessions, rescheduleCounselingSession, updateCounselingSessionStatus } from '../../lib/counseling';
import { useAuth } from '../../hooks/useAuth';

const TIME_OPTIONS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
];

function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

function getTimeBucket(time) {
  if (!time) return 'Unknown';
  const [clock, meridiem] = time.split(' ');
  const [hourText] = clock.split(':');
  let hour = Number(hourText);

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function toSessionDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;

  const [year, month, day] = dateValue.split('-').map(Number);
  const [clock, meridiem] = timeValue.split(' ');
  const [hourText, minuteText] = clock.split(':');
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function isPastSelection(dateValue, timeValue) {
  const selected = toSessionDateTime(dateValue, timeValue);
  if (!selected) return false;
  return selected.getTime() < Date.now();
}

function SessionCard({
  session,
  userRole,
  actionId,
  rescheduleDraft,
  setRescheduleDraft,
  handleReschedule,
  handleCancel,
  isRescheduleOpen,
  openReschedule,
  closeReschedule
}) {
  const sessionPath = userRole === 'counselor' ? `/counselor/sessions/${session._id}` : `/mental-health/sessions/${session._id}`;
  const canManageSession = userRole === 'counselor'
    ? ['Confirmed', 'Ready', 'In Progress'].includes(session.status)
    : ['Confirmed', 'Ready'].includes(session.status);
  const hasPastRescheduleSelection = rescheduleDraft.id === session._id && isPastSelection(rescheduleDraft.date, rescheduleDraft.time);

  return (
    <div className="apple-card p-7 border-none bg-white/70 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to={sessionPath} className="text-2xl font-semibold text-primary-text">
            {userRole === 'counselor' ? session.studentName : session.counselorName}
          </Link>
          <p className="text-sm text-secondary-text mt-2">{new Date(session.date).toLocaleDateString()} â€¢ {session.time} â€¢ {session.type}</p>
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">{session.status}</span>
      </div>

      <p className="text-sm text-primary-text/80 mt-4">{session.reason}</p>

      {canManageSession && isRescheduleOpen && (
        <div className="mt-6 rounded-2xl bg-secondary-bg/70 p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Reschedule session</p>
            <button
              type="button"
              onClick={closeReschedule}
              className="text-xs font-bold text-secondary-text"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="date"
              value={rescheduleDraft.id === session._id ? rescheduleDraft.date : getTomorrow()}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setRescheduleDraft((current) => ({
                ...current,
                id: session._id,
                date: event.target.value
              }))}
              className={`px-4 py-3 rounded-2xl bg-white outline-none ${
                hasPastRescheduleSelection ? 'ring-2 ring-red-300' : ''
              }`}
            />
            <select
              value={rescheduleDraft.id === session._id ? rescheduleDraft.time : '10:00 AM'}
              onChange={(event) => setRescheduleDraft((current) => ({
                ...current,
                id: session._id,
                time: event.target.value
              }))}
              className={`px-4 py-3 rounded-2xl bg-white outline-none ${hasPastRescheduleSelection ? 'ring-2 ring-red-300' : ''}`}
            >
              {TIME_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <select
              value={rescheduleDraft.id === session._id ? rescheduleDraft.type : session.type}
              onChange={(event) => setRescheduleDraft((current) => ({
                ...current,
                id: session._id,
                type: event.target.value
              }))}
              className="px-4 py-3 rounded-2xl bg-white outline-none"
            >
              {['Video Call', 'Chat', 'In-Person'].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          {hasPastRescheduleSelection && (
            <p className="mt-3 text-sm text-red-600">Please choose a future date and time for rescheduling.</p>
          )}
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="button"
              onClick={() => handleReschedule(session._id)}
              disabled={actionId === session._id}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent-primary text-white font-bold disabled:opacity-50"
            >
              <CalendarDays className="w-4 h-4" />
              Reschedule
            </button>
            <button
              type="button"
              onClick={() => handleCancel(session._id)}
              disabled={actionId === session._id}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Cancel Session
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-6">
        <Link to={sessionPath} className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-secondary-bg text-primary-text font-bold">
          <MessageSquareText className="w-4 h-4" />
          Open Session
        </Link>
        {canManageSession && (
          <button
            type="button"
            onClick={isRescheduleOpen ? closeReschedule : () => openReschedule(session)}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl font-bold ${
              isRescheduleOpen ? 'bg-accent-primary text-white' : 'bg-secondary-bg text-primary-text'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            {isRescheduleOpen ? 'Reschedule Open' : userRole === 'counselor' ? 'Manage Schedule' : 'Reschedule Session'}
          </button>
        )}
        {canManageSession && (
          <button
            type="button"
            onClick={() => handleCancel(session._id)}
            disabled={actionId === session._id}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Cancel Session
          </button>
        )}
        {session.status === 'Completed' && userRole !== 'counselor' && (
          <Link to={`/mental-health/sessions/${session._id}/feedback`} className="inline-flex px-4 py-3 rounded-2xl bg-accent-primary text-white font-bold">
            Leave Feedback
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MySessions() {
  const { user } = useAuth();
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState(location.state?.statusMessage || '');
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [actionId, setActionId] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [dateFilterError, setDateFilterError] = useState('');
  const [timeFilter, setTimeFilter] = useState('All');
  const [rescheduleOpenId, setRescheduleOpenId] = useState('');
  const [rescheduleDraft, setRescheduleDraft] = useState({
    id: '',
    date: getTomorrow(),
    time: '10:00 AM',
    type: 'Video Call'
  });

  async function loadSessions() {
    try {
      const data = await getCounselingSessions();
      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
    } catch (err) {
      setError(err.message || 'Failed to load sessions');
    }
  }

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getCounselingSessions();
        if (!active) return;
        setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load sessions');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const title = user?.role === 'counselor' ? 'Session Management' : 'My Sessions';
  const subtitle = user?.role === 'counselor'
    ? 'Review upcoming counseling sessions, confidential notes, and follow-up actions.'
    : 'Every booked counseling session is stored here, including your upcoming sessions and counseling history.';

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesStatus = activeFilter === 'All' || session.status === activeFilter;
      const matchesDate = !dateFilter || (session.date && new Date(session.date).toISOString().slice(0, 10) === dateFilter);
      const matchesTime = timeFilter === 'All' || getTimeBucket(session.time) === timeFilter;
      return matchesStatus && matchesDate && matchesTime;
    });
  }, [activeFilter, dateFilter, sessions, timeFilter]);

  const upcomingSessions = useMemo(
    () => filteredSessions.filter((session) => ['Confirmed', 'Ready', 'In Progress'].includes(session.status)),
    [filteredSessions]
  );

  const sessionHistory = useMemo(
    () => filteredSessions.filter((session) => ['Completed', 'Cancelled'].includes(session.status)),
    [filteredSessions]
  );

  async function handleCancel(sessionId) {
    try {
      setActionId(sessionId);
      setError('');
      setStatusMessage('');
      await updateCounselingSessionStatus(sessionId, {
        status: 'Cancelled',
        cancellationReason: user?.role === 'counselor' ? 'Cancelled by counselor' : 'Cancelled by student'
      });
      setStatusMessage('Session cancelled successfully.');
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to cancel session');
    } finally {
      setActionId('');
    }
  }

  async function handleReschedule(sessionId) {
    if (!rescheduleDraft.date || !rescheduleDraft.time) {
      setError('Choose a valid date and time before rescheduling.');
      return;
    }

    if (isPastSelection(rescheduleDraft.date, rescheduleDraft.time)) {
      setError('Please choose a future date and time before rescheduling.');
      return;
    }

    try {
      setActionId(sessionId);
      setError('');
      setStatusMessage('');
      await rescheduleCounselingSession(sessionId, {
        date: rescheduleDraft.date,
        time: rescheduleDraft.time,
        type: rescheduleDraft.type
      });
      setRescheduleDraft((current) => ({ ...current, id: '' }));
      setRescheduleOpenId('');
      setStatusMessage('Session rescheduled successfully.');
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to reschedule session');
    } finally {
      setActionId('');
    }
  }

  function openReschedule(session) {
    setRescheduleOpenId(session._id);
    setRescheduleDraft({
      id: session._id,
      date: session.date ? new Date(session.date).toISOString().slice(0, 10) : getTomorrow(),
      time: session.time || '10:00 AM',
      type: session.type || 'Video Call'
    });
  }

  function closeReschedule() {
    setRescheduleOpenId('');
    setRescheduleDraft({
      id: '',
      date: getTomorrow(),
      time: '10:00 AM',
      type: 'Video Call'
    });
  }

  function clearFilters() {
    setActiveFilter('All');
    setDateFilter('');
    setDateFilterError('');
    setTimeFilter('All');
  }

  return (
    <div className={`${user?.role === 'counselor' ? 'pt-8' : 'pt-36'} pb-12 px-6 max-w-6xl mx-auto student-shell`}>
      <header className="mb-12">
        <h1 className="text-5xl font-semibold tracking-tight text-primary-text">{title}</h1>
        <p className="text-lg text-secondary-text mt-4 max-w-3xl">{subtitle}</p>
        <div className="flex flex-wrap gap-3 mt-8">
          {['All', 'Confirmed', 'Ready', 'In Progress', 'Completed', 'Cancelled'].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${activeFilter === filter ? 'bg-accent-primary text-white' : 'bg-white/70 text-secondary-text'}`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-[220px,220px,auto] gap-3 max-w-3xl">
          <input
            type="date"
            min={getTodayValue()}
            value={dateFilter}
            onChange={(event) => {
              const nextValue = event.target.value;

              if (nextValue && nextValue < getTodayValue()) {
                setDateFilterError('Please choose today or a future date.');
                return;
              }

              setDateFilter(nextValue);
              setDateFilterError('');
            }}
            className={`px-4 py-3 rounded-2xl bg-white/70 backdrop-blur-sm outline-none ${
              dateFilterError ? 'ring-2 ring-red-300' : ''
            }`}
          />
          <select
            value={timeFilter}
            onChange={(event) => setTimeFilter(event.target.value)}
            className="px-4 py-3 rounded-2xl bg-white/70 backdrop-blur-sm outline-none"
          >
            <option value="All">All times</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
          </select>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-3 rounded-2xl bg-secondary-bg text-primary-text font-semibold"
          >
            Clear filters
          </button>
        </div>
        {dateFilterError && (
          <p className="mt-3 text-sm text-red-600">{dateFilterError}</p>
        )}
      </header>

      {statusMessage && (
        <div className="apple-card p-5 border-none bg-[#e8f7f5] text-emerald-700 mb-8">
          {statusMessage}
        </div>
      )}

      <div className="space-y-10">
        {loading && (
          <div className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm text-secondary-text">
            Loading sessions...
          </div>
        )}

        {!loading && user?.role !== 'counselor' && (
          <>
            <section>
              <div className="flex items-center gap-3 mb-5">
                <CalendarDays className="w-5 h-5 text-accent-primary" />
                <h2 className="text-2xl font-semibold text-primary-text">Upcoming counseling</h2>
              </div>
              <div className="space-y-4">
                {upcomingSessions.length === 0 ? (
                  <div className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm text-secondary-text">
                    No upcoming counseling sessions for this filter yet.
                  </div>
                ) : (
                  upcomingSessions.map((session) => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      userRole={user?.role}
                      actionId={actionId}
                      rescheduleDraft={rescheduleDraft}
                      setRescheduleDraft={setRescheduleDraft}
                      handleReschedule={handleReschedule}
                      handleCancel={handleCancel}
                      isRescheduleOpen={rescheduleOpenId === session._id}
                      openReschedule={openReschedule}
                      closeReschedule={closeReschedule}
                    />
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-5">
                <History className="w-5 h-5 text-accent-primary" />
                <h2 className="text-2xl font-semibold text-primary-text">My counseling history</h2>
              </div>
              <div className="space-y-4">
                {sessionHistory.length === 0 ? (
                  <div className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm text-secondary-text">
                    No completed or cancelled counseling sessions yet.
                  </div>
                ) : (
                  sessionHistory.map((session) => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      userRole={user?.role}
                      actionId={actionId}
                      rescheduleDraft={rescheduleDraft}
                      setRescheduleDraft={setRescheduleDraft}
                      handleReschedule={handleReschedule}
                      handleCancel={handleCancel}
                      isRescheduleOpen={rescheduleOpenId === session._id}
                      openReschedule={openReschedule}
                      closeReschedule={closeReschedule}
                    />
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {!loading && user?.role === 'counselor' && (
          <section className="space-y-4">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                userRole={user?.role}
                actionId={actionId}
                rescheduleDraft={rescheduleDraft}
                setRescheduleDraft={setRescheduleDraft}
                handleReschedule={handleReschedule}
                handleCancel={handleCancel}
                isRescheduleOpen={rescheduleOpenId === session._id}
                openReschedule={openReschedule}
                closeReschedule={closeReschedule}
              />
            ))}

            {!filteredSessions.length && (
              <div className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm text-secondary-text">
                No sessions found for this filter yet.
              </div>
            )}
          </section>
        )}
      </div>

      {error && <p className="text-red-600 mt-8">{error}</p>}
    </div>
  );
}

