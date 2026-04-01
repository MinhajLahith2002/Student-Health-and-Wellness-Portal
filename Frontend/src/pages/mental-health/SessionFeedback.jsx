import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { getCounselingSessionById } from '../../lib/counseling';

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
      setError('Session feedback is available after the counseling session is completed.');
      return;
    }

    if (comment.trim().length < 5) {
      setError('Please add a short comment before submitting feedback.');
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({
          module: 'Counselor',
          item: `counseling:${sessionId}`,
          rating,
          comment: comment.trim(),
          isAnonymous: false
        })
      });
      navigate('/mental-health/sessions');
    } catch (err) {
      setError(err.message || 'Failed to submit session feedback');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="pt-36 pb-12 px-6 max-w-2xl mx-auto min-h-screen bg-primary-bg">Loading feedback form...</div>;
  if (!session) return <div className="pt-36 pb-12 px-6 max-w-2xl mx-auto min-h-screen bg-primary-bg text-red-600">{error || 'Session not found'}</div>;

  const feedbackLocked = session.status !== 'Completed';

  return (
    <div className="pt-36 pb-12 px-6 max-w-2xl mx-auto min-h-screen bg-primary-bg">
      <div className="apple-card p-10 border-none bg-white/70 backdrop-blur-sm">
        <h1 className="text-4xl font-semibold tracking-tight text-primary-text">Session Feedback</h1>
        <p className="text-secondary-text mt-4">Share how the counseling session felt and what could improve.</p>
        {feedbackLocked && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mt-6">
            This counseling session is still marked as {session.status}. Feedback unlocks after the session is completed.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" onClick={() => setRating(value)} className="p-1">
                <Star className={`w-8 h-8 ${value <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
              </button>
            ))}
          </div>
          <textarea rows={6} value={comment} onChange={(event) => setComment(event.target.value)} className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none resize-none" placeholder="What helped most, and what should be smoother next time?" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting || feedbackLocked} className="w-full py-4 bg-accent-purple text-white rounded-2xl font-bold disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
