import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MessageSquareText, Shield, Star } from 'lucide-react';
import { getCachedCounselorProfile, getCounselorProfile } from '../../lib/counseling';
import { getPreferredCounselors, togglePreferredCounselor } from '../../lib/mentalHealth';

function formatSlot(slot) {
  if (!slot?.date || !slot?.time) return 'No open slots';
  return `${new Date(slot.date).toLocaleDateString()} at ${slot.time}`;
}

export default function CounselorProfile() {
  const { counselorId } = useParams();
  const cachedProfile = getCachedCounselorProfile(counselorId);
  const [provider, setProvider] = useState(cachedProfile);
  const [slots, setSlots] = useState(() => Array.isArray(cachedProfile?.openSlots) ? cachedProfile.openSlots : []);
  const [preferred, setPreferred] = useState(() => getPreferredCounselors());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => !cachedProfile);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const profile = await getCounselorProfile(counselorId);

        if (!active) return;
        setProvider(profile);
        setSlots(Array.isArray(profile?.openSlots) ? profile.openSlots : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load counselor profile');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [counselorId]);

  const feedbackList = useMemo(() => (
    Array.isArray(provider?.feedback?.recentFeedback) ? provider.feedback.recentFeedback : []
  ), [provider]);

  if (loading) {
    return <div className="pharmacy-shell pt-36 px-6"><div className="max-w-5xl mx-auto pharmacy-panel p-8 text-secondary-text">Loading counselor profile...</div></div>;
  }

  if (error || !provider) {
    return <div className="pharmacy-shell pt-36 px-6"><div className="max-w-5xl mx-auto pharmacy-panel p-8 text-red-600">{error || 'Counselor not found'}</div></div>;
  }

  const isPreferred = preferred.some((entry) => entry._id === provider._id);

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
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <span className="pharmacy-pill bg-sky-50 text-sky-700">
                <Shield className="w-3.5 h-3.5" />
                Confidential counseling care
              </span>
              <h1 className="mt-5 text-5xl font-semibold tracking-tight text-primary-text">{provider.name}</h1>
              <p className="mt-3 text-lg text-secondary-text">{provider.specialty || 'Counselor'}</p>
              <p className="mt-5 text-base leading-7 text-secondary-text">
                {provider.bio || 'Support with stress, anxiety, burnout, transitions, and sustainable coping strategies for student life.'}
              </p>
            </div>

            <div className="w-full max-w-sm space-y-4">
              <div className="pharmacy-panel p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Counselor summary</p>
                <div className="mt-4 grid gap-3">
                  <div className="flex items-center justify-between rounded-2xl bg-secondary-bg/80 px-4 py-3">
                    <span className="text-sm text-secondary-text">Experience</span>
                    <span className="font-semibold text-primary-text">{provider.experience || 0} years</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-secondary-bg/80 px-4 py-3">
                    <span className="text-sm text-secondary-text">Open slots</span>
                    <span className="font-semibold text-primary-text">{provider.openSlotCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-secondary-bg/80 px-4 py-3">
                    <span className="text-sm text-secondary-text">Rating</span>
                    <span className="font-semibold text-primary-text">{provider.averageRating} / 5</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPreferred(togglePreferredCounselor(provider))}
                  className={isPreferred ? 'pharmacy-primary' : 'pharmacy-secondary'}
                >
                  {isPreferred ? 'Saved Counselor' : 'Save Counselor'}
                </button>
                <Link to={`/mental-health/book/${provider._id}`} className="pharmacy-primary">
                  <CalendarDays className="w-4 h-4" />
                  Book Open Slot
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="pharmacy-panel p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Upcoming open slots</p>
                <h2 className="mt-2 text-3xl font-semibold text-primary-text">Reserve one of the counselor’s published times.</h2>
              </div>
              <Link to={`/mental-health/book/${provider._id}`} className="pharmacy-secondary">
                Open booking
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {slots.slice(0, 6).map((slot) => (
                <div key={slot.availabilityEntryId} className="pharmacy-soft-card p-5">
                  <p className="text-sm font-semibold text-primary-text">{formatSlot(slot)}</p>
                  <p className="mt-2 text-sm text-secondary-text">{slot.typeLabel} • {slot.duration} min</p>
                </div>
              ))}
            </div>

            {!slots.length && (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#c9dde6] bg-white/70 px-5 py-6 text-secondary-text">
                No future open slots yet. Check back after the counselor publishes more availability.
              </div>
            )}
          </div>

          <div className="space-y-6">
            <section className="pharmacy-panel p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Education and credentials</p>
              <div className="mt-4 space-y-3">
                {(provider.education?.length ? provider.education : ['Campus counselor profile in progress']).map((entry) => (
                  <div key={entry} className="rounded-2xl bg-secondary-bg/80 px-4 py-3 text-sm text-primary-text">{entry}</div>
                ))}
              </div>
            </section>

            <section className="pharmacy-panel p-7">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Recent student feedback</p>
                  <p className="mt-1 text-sm text-secondary-text">{provider.feedback.reviewCount} review{provider.feedback.reviewCount === 1 ? '' : 's'} submitted after completed sessions</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {feedbackList.map((feedback) => (
                  <div key={`${feedback.item}-${feedback.createdAt}`} className="rounded-2xl bg-secondary-bg/80 px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-primary-text">{feedback.userName}</span>
                      <span className="text-sm text-amber-600">{feedback.rating}/5</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-secondary-text">{feedback.comment}</p>
                  </div>
                ))}
                {!feedbackList.length && (
                  <p className="text-sm text-secondary-text">Feedback will appear here once students complete sessions and submit a review.</p>
                )}
              </div>
            </section>
          </div>
        </section>

        <section className="pharmacy-panel p-6">
          <div className="flex items-center gap-3">
            <MessageSquareText className="w-5 h-5 text-accent-primary" />
            <p className="text-sm text-secondary-text">
              Student-visible follow-up summaries and recommended resources appear in the session page after the counselor completes a session.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
