import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Heart, MessageSquareHeart, ShieldCheck, Sparkles, Video } from 'lucide-react';
import { getCounselingSessions } from '../lib/counseling';
import { buildMoodSuggestions, getForumThreads, getMentalHealthResources, getMoodStats, getPreferredCounselors, getSavedResources } from '../lib/mentalHealth';

function getMoodStreak(logs = []) {
  if (!Array.isArray(logs) || logs.length === 0) return 0;

  const uniqueDays = [...new Set(logs.map((entry) => new Date(entry.date).toISOString().slice(0, 10)))].sort().reverse();
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const day of uniqueDays) {
    const expected = cursor.toISOString().slice(0, 10);
    if (day !== expected) {
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        if (day !== cursor.toISOString().slice(0, 10)) break;
      } else {
        break;
      }
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function toSessionDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;

  const baseDate = new Date(dateValue);
  if (Number.isNaN(baseDate.getTime())) return null;

  const [clock = '', meridiem = 'AM'] = `${timeValue}`.split(' ');
  const [hourText = '0', minuteText = '0'] = clock.split(':');
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hour,
    minute,
    0,
    0
  );
}

export default function MentalHealthHub() {
  const [stats, setStats] = useState(null);
  const [resources, setResources] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [savedResources] = useState(() => getSavedResources());
  const [preferredCounselors] = useState(() => getPreferredCounselors());
  const [forumThreads] = useState(() => getForumThreads());
  const [referenceNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [moodStats, resourceList, sessionData] = await Promise.all([
          getMoodStats(),
          getMentalHealthResources({ limit: 6 }),
          getCounselingSessions({ limit: 3 })
        ]);

        if (!active) return;

        const resourcesData = Array.isArray(resourceList) ? resourceList : [];
        setStats(moodStats);
        setResources(resourcesData);
        setSuggestions(buildMoodSuggestions({ stats: moodStats, resources: resourcesData }));
        setSessions(Array.isArray(sessionData?.sessions) ? sessionData.sessions : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load mental health hub');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const moodStreak = getMoodStreak(stats?.logs);
  const upcomingSessions = sessions.filter((session) => {
    const sessionDateTime = toSessionDateTime(session.date, session.time);
    return sessionDateTime && sessionDateTime.getTime() >= referenceNow;
  });
  const nextSession = upcomingSessions[0] || null;

  return (
    <div className="student-shell pt-28 sm:pt-36 pb-12">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
      <header className="student-hero mb-10 sm:mb-16 text-center max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <div className="student-chip bg-purple-100 text-purple-700 mb-8">
          <Heart className="w-3 h-3 fill-current" />
          Mental Health Hub
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold mb-6 sm:mb-8 tracking-tight text-primary-text text-balance">
          Support that meets you where you are
        </h1>
        <p className="text-base sm:text-xl text-secondary-text leading-relaxed text-balance">
          Track your mood, book confidential counseling, explore self-help resources, and find anonymous peer support in one calm flow.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        <Link to="/mental-health/mood" className="student-card p-7">
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3">Mood average</p>
          <p className="text-4xl font-semibold text-primary-text">{stats?.averageMood?.toFixed ? stats.averageMood.toFixed(1) : stats?.averageMood || '0.0'}</p>
          <p className="text-sm text-secondary-text mt-3">Based on your recent logs</p>
        </Link>
        <Link to="/mental-health/sessions" className="student-card p-7">
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3">Upcoming sessions</p>
          <p className="text-4xl font-semibold text-primary-text">{upcomingSessions.length}</p>
          <p className="text-sm text-secondary-text mt-3">Counseling already scheduled</p>
        </Link>
        <Link to="/mental-health/resources" className="student-card p-7">
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3">Resource library</p>
          <p className="text-4xl font-semibold text-primary-text">{resources.length}</p>
          <p className="text-sm text-secondary-text mt-3">Wellness articles, guides, and videos</p>
        </Link>
        <Link to="/mental-health/forum" className="student-card p-7">
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3">Peer support</p>
          <p className="text-4xl font-semibold text-primary-text">24/7</p>
          <p className="text-sm text-secondary-text mt-3">Anonymous space for shared support</p>
        </Link>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-8 mb-12">
        <div className="student-surface p-5 sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3">Wellness Momentum</p>
          <h2 className="text-3xl font-semibold text-primary-text">{moodStreak} day mood streak</h2>
          <p className="text-secondary-text mt-3 text-lg">
            {moodStreak > 0
              ? 'You have been checking in consistently. Keep tracking to improve suggestions and counselor continuity.'
              : 'Log your mood to unlock stronger trends and more personalized support.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 sm:mt-8">
              <div className="student-muted-panel p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-2">Mood Logs</p>
              <p className="text-2xl font-semibold text-primary-text">{stats?.totalLogs || 0}</p>
            </div>
              <div className="student-muted-panel p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-2">Saved Resources</p>
              <p className="text-2xl font-semibold text-primary-text">{savedResources.length}</p>
            </div>
              <div className="student-muted-panel p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-2">Preferred Counselors</p>
              <p className="text-2xl font-semibold text-primary-text">{preferredCounselors.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] p-5 sm:p-8 bg-[linear-gradient(135deg,#0f2942_0%,#134b63_55%,#14748b_100%)] text-white shadow-[0_24px_60px_rgba(15,41,66,0.18)] border border-cyan-200/20">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold mb-3">Next Support Step</p>
          {nextSession ? (
            <>
              <h2 className="text-3xl font-semibold">{nextSession.counselorName}</h2>
              <p className="text-white/80 mt-3">{new Date(nextSession.date).toLocaleDateString()} • {nextSession.time} • {nextSession.type}</p>
              <p className="text-white/80 mt-3">Status: {nextSession.status}</p>
              <Link to={`/mental-health/sessions/${nextSession._id}`} className="inline-flex mt-8 bg-white text-accent-primary px-7 py-3 rounded-full font-bold text-sm">
                Open Session
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-semibold">No counseling session booked</h2>
              <p className="text-white/80 mt-3">Browse counselor profiles to book confidential support when you need it.</p>
              <Link to="/mental-health/counselors" className="inline-flex mt-8 bg-white text-accent-primary px-7 py-3 rounded-full font-bold text-sm">
                Explore Counselors
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="rounded-[2rem] p-6 sm:p-10 bg-[linear-gradient(135deg,#6d28d9_0%,#7c3aed_60%,#9333ea_100%)] text-white shadow-[0_24px_60px_rgba(109,40,217,0.18)] border border-purple-200/20">
              <MessageSquareHeart className="w-12 h-12 mb-8" />
              <h3 className="text-3xl font-semibold mb-4 tracking-tight">Anonymous Forum</h3>
              <p className="text-white/80 mb-8 leading-relaxed">Talk to peers under an alias, ask for gentle support, and respond to others without exposing your identity.</p>
              <p className="text-sm text-white/70 mb-6">{forumThreads.length} active sample and student-created threads</p>
              <Link to="/mental-health/forum" className="inline-flex bg-white text-accent-purple px-8 py-3 rounded-full font-bold text-sm">
                Open Forum
              </Link>
            </div>

            <div className="rounded-[2rem] p-6 sm:p-10 bg-[linear-gradient(135deg,#0f766e_0%,#0f9f8c_60%,#14b8a6_100%)] text-white shadow-[0_24px_60px_rgba(15,118,110,0.18)] border border-emerald-200/20">
              <Video className="w-12 h-12 mb-8" />
              <h3 className="text-3xl font-semibold mb-4 tracking-tight">Counseling Care</h3>
              <p className="text-white/80 mb-8 leading-relaxed">Browse counselor profiles, book sessions, and revisit assigned resources after each conversation.</p>
              <Link to="/mental-health/counselors" className="inline-flex bg-white text-accent-green px-8 py-3 rounded-full font-bold text-sm">
                Explore Counselors
              </Link>
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-primary-text tracking-tight">Suggested next steps</h2>
              <Link to="/mental-health/suggestions" className="text-sm font-semibold text-accent-primary">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <p className="text-secondary-text">Suggestions will improve as you log more mood data.</p>
              ) : (
                suggestions.map((resource) => (
                  <Link key={resource._id} to={`/mental-health/resources/${resource._id}`} className="student-card p-6 flex items-center justify-between group">
                    <div>
                      <h4 className="font-semibold text-primary-text group-hover:text-accent-primary transition-colors">{resource.title}</h4>
                      <p className="text-sm text-secondary-text mt-1">{resource.type} • {resource.category}</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </Link>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-primary-text tracking-tight">Quick wellness actions</h2>
              <span className="text-sm text-secondary-text">Keep your next step obvious</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to="/mental-health/mood" className="student-card p-6">
                <Heart className="w-6 h-6 text-accent-primary mb-4" />
                <p className="font-semibold text-primary-text">Log today’s mood</p>
                <p className="text-sm text-secondary-text mt-2">Capture how you feel and update your wellness trend.</p>
              </Link>
              <Link to="/mental-health/resources" className="student-card p-6">
                <Bookmark className="w-6 h-6 text-amber-500 mb-4" />
                <p className="font-semibold text-primary-text">Open saved resources</p>
                <p className="text-sm text-secondary-text mt-2">Revisit articles, videos, and guides you bookmarked.</p>
              </Link>
              <Link to="/mental-health/suggestions" className="student-card p-6">
                <Sparkles className="w-6 h-6 text-emerald-600 mb-4" />
                <p className="font-semibold text-primary-text">Review suggestions</p>
                <p className="text-sm text-secondary-text mt-2">See mood-aware support content chosen from your trends.</p>
              </Link>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <div className="rounded-[2rem] p-10 bg-[linear-gradient(135deg,#dc2626_0%,#ef4444_100%)] text-white shadow-[0_24px_60px_rgba(220,38,38,0.18)] border border-rose-200/20">
            <h3 className="text-2xl font-semibold mb-5 tracking-tight">Emergency Support</h3>
            <p className="text-white/80 text-sm mb-8 leading-relaxed">
              If you are in immediate distress or need urgent help, call 988 or use your campus emergency line right away.
            </p>
            <a href="tel:988" className="block w-full bg-white text-error py-4 rounded-2xl font-bold text-lg text-center">
              Call 988
            </a>
          </div>

          <div className="student-surface p-8">
            <h3 className="text-xl font-semibold text-primary-text">Upcoming support</h3>
            <div className="mt-6 space-y-4">
              {upcomingSessions.length === 0 ? (
                <p className="text-sm text-secondary-text">No counseling sessions booked yet.</p>
              ) : (
                upcomingSessions.map((session) => (
                  <Link key={session._id} to={`/mental-health/sessions/${session._id}`} className="block rounded-[1.4rem] bg-slate-50/85 border border-slate-100 px-5 py-4">
                    <p className="font-semibold text-primary-text">{session.counselorName}</p>
                    <p className="text-sm text-secondary-text mt-1">{new Date(session.date).toLocaleDateString()} • {session.time}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="student-surface p-8">
            <h3 className="text-xl font-semibold text-primary-text">Support snapshot</h3>
            <div className="mt-6 space-y-3">
              <div className="student-muted-panel px-5 py-4">
                <p className="text-sm font-semibold text-primary-text">{preferredCounselors.length} preferred counselors saved</p>
              </div>
              <div className="student-muted-panel px-5 py-4">
                <p className="text-sm font-semibold text-primary-text">{savedResources.length} resources bookmarked</p>
              </div>
              <div className="student-muted-panel px-5 py-4">
                <p className="text-sm font-semibold text-primary-text">{stats?.totalLogs || 0} mood logs recorded</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {error && <p className="text-red-600 mt-8">{error}</p>}
      </div>
    </div>
  );
}
