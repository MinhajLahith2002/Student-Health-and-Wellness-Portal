import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { getCounselingSessionById, submitCounselingFeedback } from '../../lib/counseling';

export default function SessionFeedback() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getCounselingSessionById(sessionId);
        if (!active) return;
        setSession(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load session feedback details');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (session?.status !== 'Completed') {
      setError('Session feedback is available only after the counseling session is completed.');
      return;
    }

    if (comment.trim().length < 5) {
      setError('Please add a short comment before submitting feedback.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await submitCounselingFeedback(sessionId, {
        rating,
        comment: comment.trim(),
        isAnonymous: false
      });
      navigate('/mental-health/sessions', {
        state: {
          statusMessage: 'Feedback submitted successfully. Thank you for sharing your counseling experience.'
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to submit session feedback');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="pharmacy-shell pt-36 px-6"><div className="max-w-2xl mx-auto pharmacy-panel p-8 text-secondary-text">Loading feedback form...</div></div>;
  }

  if (!session) {
    return <div className="pharmacy-shell pt-36 px-6"><div className="max-w-2xl mx-auto pharmacy-panel p-8 text-red-600">{error || 'Session not found'}</div></div>;
  }

  const feedbackLocked = session.status !== 'Completed' || session.feedbackSubmitted;

  return (
    <div className="pharmacy-shell pt-36 pb-16 px-6">
      <div className="max-w-2xl mx-auto pharmacy-panel p-8">
        <span className="pharmacy-pill bg-emerald-50 text-emerald-700">Session Feedback</span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-primary-text">How did this counseling session feel?</h1>
        <p className="mt-4 text-secondary-text">Feedback unlocks after a session is completed and can only be submitted once per counseling booking.</p>

        {feedbackLocked && (
          <div className="mt-6 rounded-[1.5rem] border border-amber-100 bg-amber-50/90 px-4 py-4 text-sm text-amber-700">
            {session.feedbackSubmitted
              ? 'Feedback has already been submitted for this counseling session.'
              : `This counseling session is still marked as ${session.status}. Feedback unlocks after completion.`}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" onClick={() => setRating(value)} className="p-1">
                <Star className={`w-8 h-8 ${value <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
              </button>
            ))}
          </div>

          <textarea
            rows={6}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="student-field min-h-36 resize-none"
            placeholder="What helped most, and what would make the experience smoother next time?"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={submitting || feedbackLocked} className="pharmacy-primary disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
