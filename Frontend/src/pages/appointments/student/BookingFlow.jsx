import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, Calendar as CalendarIcon, ChevronLeft, Clock, Video } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useSocket } from '../../../hooks/useSocket';
import { LoadingState } from '../../../components/LoadingState';
import ErrorBoundary from '../../../components/ErrorBoundary';
import * as appointmentsAPI from '../../../lib/appointmentsAPI';
import { cn } from '../../../lib/utils';

function getDefaultDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialSelectedDate(searchParams) {
  const requestedDate = searchParams.get('date');
  if (requestedDate) {
    return requestedDate;
  }

  return getDefaultDate();
}

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

function toDateTimeValue(dateValue, timeValue) {
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

  return (hours * 60) + minutes;
}

function buildEntrySlots(entry) {
  if (!entry?.startTime || !entry?.endTime || !entry?.slotDuration) {
    return [];
  }

  const startMinutes = toMinutes(entry.startTime);
  const endMinutes = toMinutes(entry.endTime);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return [];
  }

  const blockedRanges = Array.isArray(entry.breaks)
    ? entry.breaks
        .map((item) => ({
          start: toMinutes(item?.startTime),
          end: toMinutes(item?.endTime)
        }))
        .filter((item) => item.start !== null && item.end !== null && item.end > item.start)
    : [];

  const slots = [];
  for (let minute = startMinutes; minute + entry.slotDuration <= endMinutes; minute += entry.slotDuration) {
    const overlapsBreak = blockedRanges.some((range) => (
      minute < range.end && minute + entry.slotDuration > range.start
    ));

    if (!overlapsBreak) {
      const hours = Math.floor(minute / 60);
      const mins = minute % 60;
      slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
    }
  }

  return slots;
}

export default function BookingFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { listenForAvailabilityUpdates } = useSocket();
  const { doctorId: paramDoctorId } = useParams();
  const [searchParams] = useSearchParams();
  const doctorId = paramDoctorId || searchParams.get('doctor');
  const revisitId = searchParams.get('revisit');

  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => getInitialSelectedDate(searchParams));
  const [selectedTime, setSelectedTime] = useState('');
  const [type, setType] = useState('Video Call');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [availabilityEntries, setAvailabilityEntries] = useState([]);
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [symptomHelper, setSymptomHelper] = useState('');

  useEffect(() => {
    const requestedDate = searchParams.get('date');
    setSelectedDate(requestedDate || getDefaultDate());
    setSelectedTime('');
    setSelectedAvailabilityId('');
  }, [doctorId, searchParams]);

  const redirectToLogin = useCallback((message) => {
    setError(message);
    navigate('/login', {
      replace: true,
      state: {
        from: location,
        authMessage: message
      }
    });
  }, [location, navigate]);

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }

    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError('');
        const [provider, availability] = await Promise.all([
          appointmentsAPI.getProviderById(doctorId),
          appointmentsAPI.getProviderAvailability(doctorId, selectedDate)
        ]);
        if (!active) return;
        setDoctor(provider);
        setSlots(Array.isArray(availability?.availableSlots) ? availability.availableSlots : []);
        setBookedSlots(Array.isArray(availability?.bookedSlots) ? availability.bookedSlots : []);
        setAvailabilityEntries(Array.isArray(availability?.entries) ? availability.entries : []);
      } catch (err) {
        if (!active) return;

        if (err.status === 401) {
          redirectToLogin('Your session expired while opening the booking page. Please sign in again.');
          return;
        }

        if (err.status === 403) {
          setError('Only student accounts can open the doctor booking page.');
          return;
        }

        setError(err.message || 'Failed to load booking details');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [doctorId, selectedDate, redirectToLogin]);

  useEffect(() => {
    if (!doctorId) return undefined;

    const removeAvailabilityListener = listenForAvailabilityUpdates((payload) => {
      if (payload.providerId && `${payload.providerId}` !== `${doctorId}`) {
        return;
      }

      // Trigger a fresh fetch for the current doctor/date view.
      setSelectedTime('');
      setLoading(true);
      setError('');
      appointmentsAPI.getProviderAvailability(doctorId, selectedDate)
        .then((availability) => {
          setSlots(Array.isArray(availability?.availableSlots) ? availability.availableSlots : []);
          setBookedSlots(Array.isArray(availability?.bookedSlots) ? availability.bookedSlots : []);
          setAvailabilityEntries(Array.isArray(availability?.entries) ? availability.entries : []);
        })
        .catch((err) => {
          setError(err.message || 'Failed to refresh live availability');
        })
        .finally(() => {
          setLoading(false);
        });
    });

    return () => {
      removeAvailabilityListener?.();
    };
  }, [doctorId, selectedDate, listenForAvailabilityUpdates]);

  const canSubmit = useMemo(() => doctor && selectedDate && selectedTime && type, [doctor, selectedDate, selectedTime, type]);
  const matchingScheduleEntries = useMemo(() => (
    availabilityEntries.filter((entry) => (
      !Array.isArray(entry.consultationTypes)
      || entry.consultationTypes.length === 0
      || entry.consultationTypes.includes(type)
    ))
  ), [availabilityEntries, type]);
  const matchingEntriesForSelectedSlot = useMemo(() => (
    matchingScheduleEntries.filter((entry) => buildEntrySlots(entry).includes(selectedTime))
  ), [matchingScheduleEntries, selectedTime]);

  useEffect(() => {
    if (!selectedTime) {
      setSelectedAvailabilityId('');
      return;
    }

    if (matchingEntriesForSelectedSlot.length === 1) {
      setSelectedAvailabilityId(matchingEntriesForSelectedSlot[0]._id);
      return;
    }

    setSelectedAvailabilityId((current) => (
      matchingEntriesForSelectedSlot.some((entry) => entry._id === current) ? current : ''
    ));
  }, [matchingEntriesForSelectedSlot, selectedTime]);

  function validateForm() {
    const nextErrors = {};
    const trimmedSymptoms = symptoms.trim();
    const trimmedNotes = notes.trim();

    if (!selectedDate) {
      nextErrors.selectedDate = 'Choose an appointment date.';
    } else if (selectedDate < getTodayValue()) {
      nextErrors.selectedDate = 'Please choose today or a future date.';
    }

    if (!selectedTime) {
      nextErrors.selectedTime = 'Choose one available time slot.';
    } else {
      const selection = toDateTimeValue(selectedDate, selectedTime);
      if (selection && selection.getTime() < Date.now()) {
        nextErrors.selectedTime = 'Please choose a future time slot.';
      }
    }

    if (selectedTime && matchingEntriesForSelectedSlot.length > 1 && !selectedAvailabilityId) {
      nextErrors.selectedAvailabilityId = 'Choose which published schedule block this slot belongs to.';
    }

    if (!trimmedSymptoms) {
      nextErrors.symptoms = 'Symptoms or reason is required.';
    } else if (trimmedSymptoms.length < 8) {
      nextErrors.symptoms = 'Please add a clearer reason with at least 8 characters.';
    } else if (trimmedSymptoms.length > 400) {
      nextErrors.symptoms = 'Symptoms or reason must stay under 400 characters.';
    }

    if (trimmedNotes.length > 500) {
      nextErrors.notes = 'Extra notes must stay under 500 characters.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) {
      redirectToLogin('Please log in as a student before booking an appointment.');
      return;
    }

    if (user.role !== 'student') {
      setError('Only student accounts can book doctor appointments.');
      return;
    }

    if (!canSubmit) {
      setError('Choose a date, slot, and consultation type before booking.');
      return;
    }

    if (!validateForm()) {
      setError('Please fix the highlighted booking fields and try again.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setFieldErrors({});
      const appointment = await appointmentsAPI.bookAppointment({
        doctorId,
        doctorName: doctor?.name,
        doctorSpecialty: doctor?.specialty || 'General Physician',
        doctorImage: doctor?.profileImage || '',
        doctorEmail: doctor?.email || '',
        date: selectedDate,
        time: selectedTime,
        availabilityId: selectedAvailabilityId || undefined,
        type,
        symptoms: symptoms.trim(),
        notes: notes.trim()
      });
      navigate(type === 'Video Call' ? '/student/appointments' : `/student/appointments/${appointment._id}/queue`);
    } catch (err) {
      if (err.status === 401) {
        redirectToLogin('Your session has expired. Please log in again as a student and try booking once more.');
        return;
      }

      if (err.status === 403) {
        setError('Only student accounts are allowed to book appointments.');
        return;
      }

      setError(err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  }

  if (!doctorId) {
    return (
      <div className="student-shell pt-36 px-6">
        <div className="max-w-3xl mx-auto student-surface p-10 text-center">
          <h1 className="text-3xl font-bold text-primary-text">Choose a doctor first</h1>
          <p className="text-secondary-text mt-3">Start from the doctor directory so the booking flow knows which provider to schedule.</p>
          <Link to="/student/appointments/find" className="inline-flex mt-8 px-6 py-3 bg-accent-primary text-white rounded-full font-bold">
            Find Doctor
          </Link>
        </div>
      </div>
    );
  }

  // PHASE 3: Show loading skeleton on initial load
  if (loading && !doctor) {
    return <LoadingState message="Loading doctor information and availability..." />;
  }

  return (
    <ErrorBoundary>
    <div className="student-shell pb-20">
      <div className="student-hero pt-32 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#edf5f8] rounded-full transition-all">
              <ChevronLeft className="w-6 h-6 text-primary-text" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-primary-text">Book Appointment</h1>
              <p className="text-secondary-text mt-1">Pick a visit type, date, and live available slot.</p>
            </div>
          </div>

          {doctor && (
            <div className="bg-[#edf5f8] rounded-[28px] p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#e8f4f8] text-accent-primary flex items-center justify-center text-2xl font-bold">
                {doctor.name?.[0] || 'D'}
              </div>
              <div>
                <p className="text-xl font-bold text-primary-text">{doctor.name}</p>
                <p className="text-secondary-text">{doctor.specialty || 'General Physician'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {revisitId && (
            <div className="rounded-2xl bg-[#e8f7f5] border border-emerald-100 px-5 py-4 text-sm text-emerald-700">
              Revisit scheduling is active for a previous appointment. Choose a fresh date and slot with the same doctor.
            </div>
          )}

          <div className="student-surface p-8">
            <h2 className="text-xl font-bold text-primary-text mb-6">Consultation type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Video Call', 'In-Person'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className={cn(
                    'p-5 rounded-2xl border-2 text-left transition-all',
                    type === option ? 'border-accent-primary bg-accent-primary/10' : 'border-border-gray hover:border-accent-primary/40'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Video className="w-5 h-5 text-accent-primary" />
                    <span className="font-bold text-primary-text">{option}</span>
                  </div>
                  <p className="text-sm text-secondary-text">
                    {option === 'Video Call' ? 'Join from your device when the doctor is ready.' : 'Attend at the Campus Health Center.'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="student-surface p-8">
            <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-8">
              <div>
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mb-3 block">
                  Appointment date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
                  <input
                    type="date"
                    value={selectedDate}
                    min={getTodayValue()}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setSelectedTime('');
                      setFieldErrors((current) => ({ ...current, selectedDate: '', selectedTime: '' }));
                    }}
                    className={cn(
                      'w-full pl-12 pr-4 py-4 bg-[#edf5f8] border-none rounded-2xl text-sm outline-none',
                      fieldErrors.selectedDate && 'ring-2 ring-rose-300'
                    )}
                  />
                </div>
                {fieldErrors.selectedDate && <p className="text-sm text-rose-600 mt-3">{fieldErrors.selectedDate}</p>}
              </div>

              <div>
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mb-3 block">
                  Available slots
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {slots.length > 0 ? slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setSelectedTime(slot);
                        setSelectedAvailabilityId('');
                        setFieldErrors((current) => ({
                          ...current,
                          selectedTime: '',
                          selectedAvailabilityId: ''
                        }));
                      }}
                      className={cn(
                        'py-3 rounded-full text-xs font-bold transition-all border-2',
                        selectedTime === slot ? 'bg-accent-primary text-white border-accent-primary' : 'bg-white text-secondary-text border-border-gray hover:border-accent-primary/40'
                      )}
                    >
                      {slot}
                    </button>
                  )) : (
                    <div className="col-span-full text-sm text-secondary-text bg-[#edf5f8] rounded-2xl px-4 py-6">
                      No free slots were found for this date. Try another day.
                    </div>
                  )}
                </div>
                {bookedSlots.length > 0 && (
                  <p className="text-xs text-secondary-text mt-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {bookedSlots.length} slot(s) already booked for this date
                  </p>
                )}
                {fieldErrors.selectedTime && <p className="text-sm text-rose-600 mt-3">{fieldErrors.selectedTime}</p>}
              </div>
            </div>

            {selectedTime && matchingEntriesForSelectedSlot.length > 1 && (
              <div className="mt-6">
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mb-3 block">
                  Published schedule block for this slot
                </label>
                <div className="grid gap-3">
                  {matchingEntriesForSelectedSlot.map((entry) => {
                    const selected = selectedAvailabilityId === entry._id;

                    return (
                      <button
                        key={entry._id}
                        type="button"
                        onClick={() => {
                          setSelectedAvailabilityId(entry._id);
                          setFieldErrors((current) => ({ ...current, selectedAvailabilityId: '' }));
                        }}
                        className={cn(
                          'rounded-2xl border-2 px-5 py-4 text-left transition-all',
                          selected ? 'border-accent-primary bg-accent-primary/10' : 'border-border-gray bg-white hover:border-accent-primary/40'
                        )}
                      >
                        <p className="font-semibold text-primary-text">{entry.title || 'Published schedule block'}</p>
                        <p className="text-sm text-secondary-text mt-1">
                          {entry.startTime} to {entry.endTime} · {(entry.consultationTypes || []).join(', ') || 'All consultation types'}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-secondary-text mt-2">{entry.notes}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.selectedAvailabilityId && (
                  <p className="text-sm text-rose-600 mt-3">{fieldErrors.selectedAvailabilityId}</p>
                )}
              </div>
            )}

            <div className="mt-8 rounded-3xl bg-[#edf5f8] p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text mb-3">
                Published Doctor Schedule
              </p>
              <p className="text-sm text-secondary-text leading-relaxed">
                Manage Availability creates schedule blocks. This booking page converts only the matching active blocks
                into free slots for your chosen date and consultation type.
              </p>

              <div className="mt-4 space-y-3">
                {matchingScheduleEntries.length > 0 ? matchingScheduleEntries.map((entry) => (
                  <div key={entry._id} className="rounded-2xl bg-white px-5 py-4">
                    <p className="font-semibold text-primary-text">{entry.title || 'Published schedule block'}</p>
                    <p className="text-sm text-secondary-text mt-1">
                      {entry.startTime} to {entry.endTime} · {entry.slotDuration} min · {(entry.consultationTypes || []).join(', ') || 'All consultation types'}
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-secondary-text mt-2">{entry.notes}</p>
                    )}
                  </div>
                )) : (
                  <div className="rounded-2xl bg-white px-5 py-4 text-sm text-secondary-text">
                    No active schedule block on this date supports the selected consultation type.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="student-surface p-8 space-y-6">
            <div className="rounded-3xl bg-[#e8f4f8] p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">AI Symptom Checker Placeholder</p>
              <p className="text-sm text-primary-text leading-relaxed">
                Use a prompt below to prefill a booking reason, then refine it before confirming the appointment.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                {[
                  'Headache and fatigue after exam week',
                  'Cold symptoms and sore throat',
                  'Need follow-up advice after a previous visit',
                  'Skin irritation that needs a check-up'
                ].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSymptomHelper(option);
                      if (!symptoms.trim()) {
                        setSymptoms(option);
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-bold ${symptomHelper === option ? 'bg-accent-primary text-white' : 'bg-white border border-blue-100 text-accent-primary'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mb-3 block">
                Symptoms or reason
              </label>
              <textarea
                rows={4}
                value={symptoms}
                onChange={(event) => {
                  setSymptoms(event.target.value);
                  setFieldErrors((current) => ({ ...current, symptoms: '' }));
                }}
                className={cn(
                  'w-full px-6 py-4 bg-[#edf5f8] border-none rounded-2xl outline-none resize-none',
                  fieldErrors.symptoms && 'ring-2 ring-rose-300'
                )}
                placeholder="Describe your symptoms, health concern, or reason for booking."
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-secondary-text">Required for booking. Keep it clear and specific.</p>
                <p className="text-xs text-secondary-text">{symptoms.trim().length}/400</p>
              </div>
              {fieldErrors.symptoms && <p className="text-sm text-rose-600 mt-2">{fieldErrors.symptoms}</p>}
            </div>
            <div>
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mb-3 block">
                Extra notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  setFieldErrors((current) => ({ ...current, notes: '' }));
                }}
                className={cn(
                  'w-full px-6 py-4 bg-[#edf5f8] border-none rounded-2xl outline-none resize-none',
                  fieldErrors.notes && 'ring-2 ring-rose-300'
                )}
                placeholder="Anything you want the doctor to know before the consultation."
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-secondary-text">Optional. Use this for extra context only.</p>
                <p className="text-xs text-secondary-text">{notes.trim().length}/500</p>
              </div>
              {fieldErrors.notes && <p className="text-sm text-rose-600 mt-2">{fieldErrors.notes}</p>}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-4 text-sm text-rose-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              {error}
            </div>
          )}

          {loading && <p className="text-sm text-secondary-text">Loading live availability...</p>}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-5 bg-[#edf5f8] text-primary-text rounded-[24px] font-bold hover:bg-[#EBEBEF] transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="flex-[2] py-5 bg-accent-primary text-white rounded-[24px] font-bold hover:bg-[#105f72] transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ErrorBoundary>
  );
}
