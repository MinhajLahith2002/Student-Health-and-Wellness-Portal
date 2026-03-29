import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, Calendar as CalendarIcon, ChevronLeft, Clock, Video } from 'lucide-react';
import { getProviderAvailability, getProviderById } from '../../../lib/providers';
import { bookAppointment } from '../../../lib/appointments';
import { useAuth } from '../../../hooks/useAuth';
import { cn } from '../../../lib/utils';

function getDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
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

export default function BookingFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { doctorId: paramDoctorId } = useParams();
  const [searchParams] = useSearchParams();
  const doctorId = paramDoctorId || searchParams.get('doctor');
  const revisitId = searchParams.get('revisit');

  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [selectedTime, setSelectedTime] = useState('');
  const [type, setType] = useState('Video Call');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [symptomHelper, setSymptomHelper] = useState('');

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
          getProviderById(doctorId),
          getProviderAvailability(doctorId, selectedDate)
        ]);
        if (!active) return;
        setDoctor(provider);
        setSlots(Array.isArray(availability?.availableSlots) ? availability.availableSlots : []);
        setBookedSlots(Array.isArray(availability?.bookedSlots) ? availability.bookedSlots : []);
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

  const canSubmit = useMemo(() => doctor && selectedDate && selectedTime && type, [doctor, selectedDate, selectedTime, type]);

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
      const appointment = await bookAppointment({
        doctorId,
        doctorName: doctor?.name,
        doctorSpecialty: doctor?.specialty || 'General Physician',
        doctorImage: doctor?.profileImage || '',
        doctorEmail: doctor?.email || '',
        date: selectedDate,
        time: selectedTime,
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
      <div className="min-h-screen bg-[#FCFCFC] pt-36 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-[32px] border border-[#F0F0F3] p-10 text-center">
          <h1 className="text-3xl font-bold text-[#18181B]">Choose a doctor first</h1>
          <p className="text-[#71717A] mt-3">Start from the doctor directory so the booking flow knows which provider to schedule.</p>
          <Link to="/student/appointments/find" className="inline-flex mt-8 px-6 py-3 bg-[#2563EB] text-white rounded-full font-bold">
            Find Doctor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFC] pb-20">
      <div className="bg-white border-b border-[#F0F0F3] pt-32 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F4F4F8] rounded-full transition-all">
              <ChevronLeft className="w-6 h-6 text-[#18181B]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#18181B]">Book Appointment</h1>
              <p className="text-[#71717A] mt-1">Pick a visit type, date, and live available slot.</p>
            </div>
          </div>

          {doctor && (
            <div className="bg-[#F4F4F8] rounded-[28px] p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center text-2xl font-bold">
                {doctor.name?.[0] || 'D'}
              </div>
              <div>
                <p className="text-xl font-bold text-[#18181B]">{doctor.name}</p>
                <p className="text-[#71717A]">{doctor.specialty || 'General Physician'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {revisitId && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4 text-sm text-emerald-700">
              Revisit scheduling is active for a previous appointment. Choose a fresh date and slot with the same doctor.
            </div>
          )}

          <div className="bg-white p-8 rounded-[32px] border border-[#F0F0F3] shadow-sm">
            <h2 className="text-xl font-bold text-[#18181B] mb-6">Consultation type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Video Call', 'In-Person'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className={cn(
                    'p-5 rounded-2xl border-2 text-left transition-all',
                    type === option ? 'border-[#2563EB] bg-blue-50/40' : 'border-[#F0F0F3] hover:border-blue-200'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Video className="w-5 h-5 text-[#2563EB]" />
                    <span className="font-bold text-[#18181B]">{option}</span>
                  </div>
                  <p className="text-sm text-[#71717A]">
                    {option === 'Video Call' ? 'Join from your device when the doctor is ready.' : 'Attend at the Campus Health Center.'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-[#F0F0F3] shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-8">
              <div>
                <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest mb-3 block">
                  Appointment date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
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
                      'w-full pl-12 pr-4 py-4 bg-[#F4F4F8] border-none rounded-2xl text-sm outline-none',
                      fieldErrors.selectedDate && 'ring-2 ring-rose-300'
                    )}
                  />
                </div>
                {fieldErrors.selectedDate && <p className="text-sm text-rose-600 mt-3">{fieldErrors.selectedDate}</p>}
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest mb-3 block">
                  Available slots
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {slots.length > 0 ? slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setSelectedTime(slot);
                        setFieldErrors((current) => ({ ...current, selectedTime: '' }));
                      }}
                      className={cn(
                        'py-3 rounded-full text-xs font-bold transition-all border-2',
                        selectedTime === slot ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-[#71717A] border-[#F0F0F3] hover:border-blue-200'
                      )}
                    >
                      {slot}
                    </button>
                  )) : (
                    <div className="col-span-full text-sm text-[#71717A] bg-[#F4F4F8] rounded-2xl px-4 py-6">
                      No free slots were found for this date. Try another day.
                    </div>
                  )}
                </div>
                {bookedSlots.length > 0 && (
                  <p className="text-xs text-[#71717A] mt-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {bookedSlots.length} slot(s) already booked for this date
                  </p>
                )}
                {fieldErrors.selectedTime && <p className="text-sm text-rose-600 mt-3">{fieldErrors.selectedTime}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-[#F0F0F3] shadow-sm space-y-6">
            <div className="rounded-3xl bg-blue-50 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">AI Symptom Checker Placeholder</p>
              <p className="text-sm text-[#18181B] leading-relaxed">
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
                    className={`px-4 py-2 rounded-full text-xs font-bold ${symptomHelper === option ? 'bg-[#2563EB] text-white' : 'bg-white border border-blue-100 text-[#2563EB]'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest mb-3 block">
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
                  'w-full px-6 py-4 bg-[#F4F4F8] border-none rounded-2xl outline-none resize-none',
                  fieldErrors.symptoms && 'ring-2 ring-rose-300'
                )}
                placeholder="Describe your symptoms, health concern, or reason for booking."
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-[#71717A]">Required for booking. Keep it clear and specific.</p>
                <p className="text-xs text-[#71717A]">{symptoms.trim().length}/400</p>
              </div>
              {fieldErrors.symptoms && <p className="text-sm text-rose-600 mt-2">{fieldErrors.symptoms}</p>}
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest mb-3 block">
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
                  'w-full px-6 py-4 bg-[#F4F4F8] border-none rounded-2xl outline-none resize-none',
                  fieldErrors.notes && 'ring-2 ring-rose-300'
                )}
                placeholder="Anything you want the doctor to know before the consultation."
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-[#71717A]">Optional. Use this for extra context only.</p>
                <p className="text-xs text-[#71717A]">{notes.trim().length}/500</p>
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

          {loading && <p className="text-sm text-[#71717A]">Loading live availability...</p>}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-5 bg-[#F4F4F8] text-[#18181B] rounded-[24px] font-bold hover:bg-[#EBEBEF] transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="flex-[2] py-5 bg-[#2563EB] text-white rounded-[24px] font-bold hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
