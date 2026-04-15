import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react';
import {
  bookCounselingSession,
  describeCounselingBookingConflict,
  findCounselingBookingConflict,
  getCachedCounselingSessions,
  getCachedCounselorProfile,
  getCachedCounselorSlots,
  getCounselingSessions,
  getCounselorProfile,
  getCounselorSlots,
  subscribeCounselingLiveRefresh
} from '../../lib/counseling';
import DismissibleBanner from '../../components/DismissibleBanner';
import { cn } from '../../lib/utils';

function getDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return getDateInputValue(date);
}

function getTodayValue() {
  return getDateInputValue();
}

function getDateInputValue(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

const STUDENT_BOOKING_SESSION_QUERY = {
  scope: 'upcoming',
  limit: 100
};

const SLOT_AUTO_REFRESH_INTERVAL_MS = 15000;

export default function BookSession() {
  const { counselorId } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const cachedProfile = getCachedCounselorProfile(counselorId);
  const cachedSlots = getCachedCounselorSlots(counselorId, { date: getDefaultDate() });
  const cachedSessions = getCachedCounselingSessions(STUDENT_BOOKING_SESSION_QUERY);
  const [provider, setProvider] = useState(cachedProfile);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState(() => Array.isArray(cachedSlots?.slots) ? cachedSlots.slots : []);
  const [studentSessions, setStudentSessions] = useState(() => (
    Array.isArray(cachedSessions?.sessions) ? cachedSessions.sessions : []
  ));
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ slot: '', reason: '' });
  const [loading, setLoading] = useState(() => !cachedProfile);
  const [submitting, setSubmitting] = useState(false);
  const [slotRefreshKey, setSlotRefreshKey] = useState(0);
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const profile = await getCounselorProfile(counselorId);
        if (!active) return;
        setProvider(profile);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load counselor booking details');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [counselorId]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getCounselingSessions(STUDENT_BOOKING_SESSION_QUERY);
        if (!active) return;
        setStudentSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      } catch {
        // Keep booking available even if the background session refresh fails.
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionRefreshKey]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getCounselorSlots(counselorId, { date: selectedDate });
        if (!active) return;
        const nextSlots = Array.isArray(data?.slots) ? data.slots : [];
        setSlots(nextSlots);
        setSelectedSlotId((current) => (
          nextSlots.some((slot) => slot.availabilityEntryId === current) ? current : ''
        ));
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load open slots');
      }
    })();

    return () => {
      active = false;
    };
  }, [counselorId, selectedDate, slotRefreshKey]);

  useEffect(() => {
    function refreshBookingAvailability() {
      if (document.visibilityState !== 'visible') return;
      setSlotRefreshKey((current) => current + 1);
      setSessionRefreshKey((current) => current + 1);
    }

    const intervalId = window.setInterval(refreshBookingAvailability, SLOT_AUTO_REFRESH_INTERVAL_MS);
    const unsubscribeLiveRefresh = subscribeCounselingLiveRefresh((payload) => {
      if (payload?.counselorId && payload.counselorId !== counselorId && payload.providerId !== counselorId) {
        return;
      }

      refreshBookingAvailability();
    });
    document.addEventListener('visibilitychange', refreshBookingAvailability);

    return () => {
      window.clearInterval(intervalId);
      unsubscribeLiveRefresh();
      document.removeEventListener('visibilitychange', refreshBookingAvailability);
    };
  }, [counselorId]);

  const slotOptions = useMemo(
    () => slots.map((slot) => ({
      ...slot,
      conflictSession: findCounselingBookingConflict(studentSessions, {
        date: slot.date,
        time: slot.time
      })
    })),
    [slots, studentSessions]
  );

  const selectedSlot = useMemo(
    () => slotOptions.find((slot) => slot.availabilityEntryId === selectedSlotId) || null,
    [slotOptions, selectedSlotId]
  );
  const selectedSlotConflict = selectedSlot?.conflictSession || null;

  const canSubmit = Boolean(
    selectedSlotId
    && reason.trim().length >= 10
    && !selectedSlotConflict
    && !submitting
  );

  async function handleSubmit(event) {
    event.preventDefault();

    const bookingConflict = selectedSlot
      ? findCounselingBookingConflict(studentSessions, {
        date: selectedSlot.date,
        time: selectedSlot.time
      })
      : null;

    const nextFieldErrors = {
      slot: !selectedSlotId
        ? 'Choose one of the counselor’s open slots.'
        : bookingConflict
          ? describeCounselingBookingConflict(bookingConflict)
          : '',
      reason: reason.trim().length >= 10 ? '' : 'Share at least 10 characters so the counselor can prepare.'
    };

    setFieldErrors(nextFieldErrors);
    if (nextFieldErrors.slot || nextFieldErrors.reason) {
      setError('Please fix the highlighted booking fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const session = await bookCounselingSession({
        availabilityEntryId: selectedSlotId,
        urgency,
        reason: reason.trim()
      });

      navigate('/mental-health/sessions', {
        state: {
          statusMessage: `Counseling booked with ${session.counselorName} for ${new Date(session.date).toLocaleDateString()} at ${session.time}.`
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to book session');
      setSlotRefreshKey((current) => current + 1);
      setSessionRefreshKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="pharmacy-shell pt-36 px-6"><div className="max-w-5xl mx-auto pharmacy-panel p-8 text-secondary-text">Loading counseling booking…</div></div>;
  }

  if (!provider) {
    return <div className="pharmacy-shell pt-36 px-6"><div className="max-w-5xl mx-auto pharmacy-panel p-8 text-red-600">{error || 'Counselor not found'}</div></div>;
  }

  return (
    <div className="pharmacy-shell pt-36 pb-16 px-6">
      <div className="max-w-6xl mx-auto grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="pharmacy-panel p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <span className="pharmacy-pill bg-emerald-50 text-emerald-700">Book Counseling</span>

            <Link to="/mental-health/counselors" className="pharmacy-secondary w-full justify-center sm:w-auto sm:shrink-0">
              <ArrowLeft className="w-4 h-4" />
              Back to Counselor Directory
            </Link>
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-primary-text">Reserve one open slot with {provider.name}.</h1>
          <p className="mt-4 text-secondary-text">
            You’re booking from counselor-created availability only. If a slot disappears, it means it was booked or removed before confirmation.
          </p>
          <p className="mt-2 text-sm text-secondary-text">
            You can still book chat, video, and in-person counseling, but overlapping sessions at the same date and time are blocked automatically.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Choose date</label>
              <input
                type="date"
                value={selectedDate}
                min={getTodayValue()}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setSelectedSlotId('');
                  setFieldErrors((current) => ({ ...current, slot: '' }));
                  setError('');
                }}
                className="student-field"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Open slots</label>
              <div className="overflow-hidden rounded-[1.75rem] border border-[#c9dde6] bg-white/78 shadow-[0_10px_24px_rgba(10,40,60,0.05)]">
                <div className="max-h-[20rem] overflow-y-auto p-3">
                  {slots.length ? (
                    <div className="space-y-3">
                      {slotOptions.map((slot) => (
                        <button
                          key={slot.availabilityEntryId}
                          type="button"
                          disabled={Boolean(slot.conflictSession)}
                          onClick={() => {
                            setSelectedSlotId(slot.availabilityEntryId);
                            setFieldErrors((current) => ({ ...current, slot: '' }));
                            setError('');
                          }}
                          className={cn(
                            'w-full rounded-[1.35rem] border px-5 py-4 text-left transition-all',
                            slot.conflictSession && 'cursor-not-allowed border-amber-200 bg-amber-50/80 opacity-90',
                            selectedSlotId === slot.availabilityEntryId
                              ? 'border-accent-primary bg-white shadow-[0_16px_36px_rgba(20,116,139,0.12)]'
                              : 'border-white/80 bg-[#fbfdfe] hover:border-[#cde0e8]'
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-primary-text">{slot.time}</span>
                            <span className="pharmacy-pill bg-sky-50 text-sky-700">{slot.typeLabel}</span>
                          </div>
                          <p className="mt-3 text-sm text-secondary-text">{new Date(slot.date).toLocaleDateString()} • {slot.duration} min</p>
                          {slot.conflictSession && (
                            <p className="mt-2 text-sm text-amber-700">
                              {describeCounselingBookingConflict(slot.conflictSession)}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1.35rem] border border-dashed border-[#c9dde6] bg-white/70 px-5 py-6 text-secondary-text">
                      No open slots for this date. Try another day.
                    </div>
                  )}
                </div>
              </div>
              {fieldErrors.slot && <p className="text-sm text-red-600">{fieldErrors.slot}</p>}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Urgency</label>
              <div className="flex flex-wrap gap-3">
                {['Low', 'Medium', 'High', 'Crisis'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setUrgency(option)}
                    className={urgency === option ? 'pharmacy-primary' : 'pharmacy-secondary'}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">What do you want support with?</label>
              <textarea
                rows={6}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (event.target.value.trim().length >= 10) {
                    setFieldErrors((current) => ({ ...current, reason: '' }));
                  }
                }}
                className={cn('student-field min-h-36 resize-none', fieldErrors.reason && 'ring-2 ring-red-300')}
                placeholder="Briefly describe what you’d like to talk through in this session."
              />
              {fieldErrors.reason && <p className="text-sm text-red-600">{fieldErrors.reason}</p>}
            </div>

            <DismissibleBanner
              message={error}
              tone="error"
              onClose={() => setError('')}
              className="px-4 py-4"
            />

            <div className="flex flex-wrap gap-3">
              <Link to={`/mental-health/counselors/${provider._id}`} className="pharmacy-secondary">Back to profile</Link>
              <button type="submit" disabled={!canSubmit} className="pharmacy-primary disabled:opacity-50">
                Confirm Booking
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="pharmacy-panel p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Selected slot summary</p>
            {selectedSlot ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-secondary-bg/80 px-4 py-4">
                  <div className="flex items-center gap-3 text-primary-text">
                    <CalendarDays className="w-4 h-4 text-accent-primary" />
                    <span className="font-semibold">{new Date(selectedSlot.date).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-primary-text">
                    <Clock3 className="w-4 h-4 text-accent-primary" />
                    <span className="font-semibold">{selectedSlot.time} • {selectedSlot.duration} min</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-secondary-bg/80 px-4 py-4">
                  <p className="text-sm text-secondary-text">Session mode</p>
                  <p className="mt-2 font-semibold text-primary-text">{selectedSlot.typeLabel}</p>
                </div>
                {selectedSlotConflict && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">Time conflict</p>
                    <p className="mt-2 text-sm leading-6 text-secondary-text">
                      {describeCounselingBookingConflict(selectedSlotConflict)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-secondary-text">Choose an open slot to preview the booking details here.</p>
            )}
          </section>

          <section className="pharmacy-panel p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">What happens next</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-secondary-text">
              <p>1. Your selected slot becomes your counseling session.</p>
              <p>2. If the session is video-based, both of you will get the same Jitsi room from the session page.</p>
              <p>3. If you cancel before completion, the slot becomes available again for booking.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
