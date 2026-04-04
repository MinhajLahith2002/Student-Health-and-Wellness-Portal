import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { History } from 'lucide-react';
import { getProviderAvailability, getProviderById } from '../../lib/providers';
import { bookCounselingSession } from '../../lib/counseling';
import { cn } from '../../lib/utils';

function getDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookSession() {
  const { counselorId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [selectedTime, setSelectedTime] = useState('');
  const [type, setType] = useState('Video Call');
  const [urgency, setUrgency] = useState('Medium');
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isPastDate = Boolean(selectedDate) && selectedDate < getTodayValue();

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [profile, schedule] = await Promise.all([
          getProviderById(counselorId),
          getProviderAvailability(counselorId, selectedDate)
        ]);
        if (!active) return;
        setProvider(profile);
        setSlots(Array.isArray(schedule?.availableSlots) ? schedule.availableSlots : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load counselor booking');
      }
    })();

    return () => {
      active = false;
    };
  }, [counselorId, selectedDate]);

  const canSubmit = useMemo(() => provider && selectedDate && selectedTime && reason.trim(), [provider, selectedDate, selectedTime, reason]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedDate) {
      setError('Please choose a counseling date.');
      return;
    }

    if (selectedDate < getTodayValue()) {
      setError('Please choose today or a future date for counseling.');
      return;
    }

    if (!selectedTime) {
      setError('Please choose an available time slot.');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Please share a little more detail so the counselor can prepare for the session.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const session = await bookCounselingSession({
        counselorId,
        date: selectedDate,
        time: selectedTime,
        type,
        urgency,
        reason: reason.trim()
      });
      navigate('/mental-health/sessions', {
        state: {
          statusMessage: `Counseling session booked with ${session.counselorName} for ${new Date(session.date).toLocaleDateString()} at ${session.time}.`
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to book session');
    } finally {
      setSubmitting(false);
    }
  }

  if (!provider) return <div className="pt-36 px-6">Loading session booking...</div>;

  return (
    <div className="pt-36 pb-12 px-6 max-w-4xl mx-auto student-shell">
      <div className="apple-card p-10 border-none bg-white/70 backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-primary-text">Book Counseling Session</h1>
            <p className="text-secondary-text mt-3">Schedule a confidential session with {provider.name}.</p>
          </div>
          <Link
            to="/mental-health/sessions"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-secondary-bg text-primary-text font-bold"
          >
            <History className="w-4 h-4" />
            My History
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSelectedTime('');
                setError('');
              }}
              min={getTodayValue()}
              className={`w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none ${isPastDate ? 'ring-2 ring-red-300' : ''}`}
            />
            <select value={urgency} onChange={(event) => setUrgency(event.target.value)} className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none">
              {['Low', 'Medium', 'High', 'Crisis'].map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          {isPastDate && (
            <p className="text-sm text-red-600 -mt-4">Past dates are not allowed. Please choose today or a future date.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Video Call', 'Chat', 'In-Person'].map((option) => (
              <button key={option} type="button" onClick={() => setType(option)} className={cn('px-4 py-4 rounded-2xl font-semibold', type === option ? 'bg-accent-primary text-white' : 'bg-secondary-bg text-primary-text')}>
                {option}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {slots.map((slot) => (
              <button key={slot} type="button" onClick={() => setSelectedTime(slot)} className={cn('px-4 py-3 rounded-full text-sm font-bold', selectedTime === slot ? 'bg-accent-primary text-white' : 'bg-secondary-bg text-primary-text')}>
                {slot}
              </button>
            ))}
          </div>
          {!slots.length && (
            <p className="text-sm text-secondary-text">No live slots are currently open for this date. Try another day.</p>
          )}

          <textarea rows={5} value={reason} onChange={(event) => setReason(event.target.value)} className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none resize-none" placeholder="What would you like support with during this session?" />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-4">
            <Link to={`/mental-health/counselors/${provider._id}`} className="flex-1 py-4 bg-secondary-bg rounded-2xl font-bold text-center text-primary-text">
              Back
            </Link>
            <button type="submit" disabled={!canSubmit || submitting} className="flex-[2] py-4 bg-accent-primary text-white rounded-2xl font-bold disabled:opacity-50">
              {submitting ? 'Booking...' : 'Confirm Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

