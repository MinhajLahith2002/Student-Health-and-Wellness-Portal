import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, Star } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import { getAppointmentById } from '../../../lib/appointments';

export default function AppointmentFeedback() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getAppointmentById(appointmentId);
        if (!active) return;
        setAppointment(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load appointment feedback details');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [appointmentId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (appointment?.status !== 'Completed') {
      setError('Feedback is available after the appointment is completed.');
      return;
    }

    if (comment.trim().length < 5) {
      setError('Please add at least a short comment before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({
          module: 'Doctor',
          item: `appointment:${appointmentId}`,
          rating,
          comment: comment.trim(),
          isAnonymous: false
        })
      });
      navigate('/student/appointments');
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="student-shell pt-36 px-6 pb-20">Loading feedback form...</div>;
  }

  if (!appointment || error && !appointment) {
    return <div className="student-shell pt-36 px-6 pb-20 text-red-600">{error || 'Appointment not found'}</div>;
  }

  const feedbackLocked = appointment.status !== 'Completed';

  return (
    <div className="student-shell pt-36 px-6 pb-20">
      <div className="max-w-2xl mx-auto student-surface p-10">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
          <MessageSquare className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-primary-text">Share doctor feedback</h1>
        <p className="text-secondary-text mt-3">Your feedback helps improve visit quality and continuity of care.</p>
        {feedbackLocked && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mt-6">
            This appointment is still marked as {appointment.status}. Feedback unlocks after the visit is completed.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text mb-4 block">Rating</label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="p-2"
                >
                  <Star className={`w-8 h-8 ${value <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text mb-4 block">Comment</label>
            <textarea
              rows={6}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="w-full px-6 py-4 bg-secondary-bg border-none rounded-2xl outline-none resize-none text-primary-text"
              placeholder="What went well, and what could be improved?"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || feedbackLocked}
            className="w-full py-4 bg-accent-primary text-white rounded-2xl font-bold disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}

