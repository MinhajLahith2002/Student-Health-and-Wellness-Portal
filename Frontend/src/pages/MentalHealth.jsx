import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bookmark, CalendarDays, Heart, MessageSquareHeart, ShieldCheck, Sparkles, Users, Video } from 'lucide-react';
import {
  getCachedCounselingSessions,
  getCounselingSessions,
  prefetchCounselingSessionById,
  prefetchCounselorDirectory
} from '../lib/counseling';
import {
  buildMoodSuggestions,
  getCachedForumBootstrap,
  getCachedMentalHealthResources,
  getCachedMoodStats,
  getForumBootstrap,
  getMentalHealthResources,
  getMoodStats,
  getPreferredCounselors,
  getResources,
  getSavedResources,
  prefetchForumBootstrap,
  prefetchResources,
  prefetchResourceById,
  prefetchResourceRecommendations,
  primeResourceDetailCache
} from '../lib/mentalHealth';
import { getResourceTypePresentation } from '../lib/resourcePresentation';

const DASHBOARD_UPCOMING_SESSION_LIMIT = 5;
const ACTIVE_COUNSELING_SESSION_STATUSES = ['Confirmed', 'Ready', 'In Progress'];


function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function getValidDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getMoodStreak(logs = []) {
  if (!Array.isArray(logs) || logs.length === 0) return 0;

  const uniqueDays = [
    ...new Set(
      logs
        .map((entry) => getValidDate(entry?.date))
        .filter(Boolean)
        .map((date) => date.toISOString().slice(0, 10))
    )
  ].sort().reverse();

  if (uniqueDays.length === 0) return 0;

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
  if (!dateValue) return null;

  const baseDate = getValidDate(dateValue);
  if (!baseDate) return null;

  if (!timeValue) {
    const dateOnly = new Date(baseDate);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly;
  }

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

function normalizeDateOnly(dateValue) {
  const date = getValidDate(dateValue) || new Date(0);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isUpcomingCounselingSession(session) {
  if (!ACTIVE_COUNSELING_SESSION_STATUSES.includes(session?.status)) {
    return false;
  }

  if (session.status === 'In Progress') {
    return normalizeDateOnly(session.date).getTime() >= normalizeDateOnly(new Date()).getTime();
  }

  const sessionDateTime = toSessionDateTime(session.date, session.time);
  if (!sessionDateTime) {
    return false;
  }

  return sessionDateTime.getTime() >= Date.now();
}

export default function MentalHealthHub() {
  const cachedStats = getCachedMoodStats();
  const cachedResources = getCachedMentalHealthResources({ limit: 12 });
  const cachedSessionSummary = getCachedCounselingSessions({
    limit: DASHBOARD_UPCOMING_SESSION_LIMIT,
    scope: 'upcoming'
  });
  const cachedForumBootstrap = getCachedForumBootstrap();
  const initialResources = asArray(cachedResources);
  const initialSessions = asArray(cachedSessionSummary?.sessions);
  const [stats, setStats] = useState(cachedStats);
  const [resourceTotal, setResourceTotal] = useState(0);
  const [suggestions, setSuggestions] = useState(() => buildMoodSuggestions({
    stats: cachedStats,
    resources: initialResources
  }));
  const [sessions, setSessions] = useState(initialSessions);
  const [forumThreads, setForumThreads] = useState(() => asArray(cachedForumBootstrap?.threads));
  const [error, setError] = useState('');
  const [savedResources] = useState(() => getSavedResources());
  const [preferredCounselors] = useState(() => getPreferredCounselors());

  useEffect(() => {
    let active = true;

    (async () => {
      const [moodStatsResult, resourceListResult] = await Promise.allSettled([
        getMoodStats(),
        getMentalHealthResources({ limit: 12 })
      ]);

      if (!active) return;

      const nextStats = moodStatsResult.status === 'fulfilled' ? moodStatsResult.value : cachedStats;
      const nextResources = resourceListResult.status === 'fulfilled' && Array.isArray(resourceListResult.value)
        ? asArray(resourceListResult.value)
        : initialResources;

      if (moodStatsResult.status === 'fulfilled') {
        setStats(nextStats);
      }

      setSuggestions(buildMoodSuggestions({
        stats: nextStats,
        resources: nextResources
      }));

      if (moodStatsResult.status === 'rejected' && resourceListResult.status === 'rejected') {
        setError(moodStatsResult.reason?.message || resourceListResult.reason?.message || 'Failed to load mental health hub');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const [resourceSummaryResult, sessionDataResult] = await Promise.allSettled([
        getResources({ category: 'Mental Health', limit: 1 }),
        getCounselingSessions({
          limit: DASHBOARD_UPCOMING_SESSION_LIMIT,
          scope: 'upcoming'
        })
      ]);

      if (!active) return;

      if (resourceSummaryResult.status === 'fulfilled') {
        setResourceTotal(Number(resourceSummaryResult.value?.total || initialResources.length || 0));
      } else if (!resourceTotal) {
        setResourceTotal(initialResources.length || 0);
      }

      if (sessionDataResult.status === 'fulfilled') {
        setSessions(asArray(sessionDataResult.value?.sessions));
      }

      if (resourceSummaryResult.status === 'rejected' && sessionDataResult.status === 'rejected') {
        setError(resourceSummaryResult.reason?.message || sessionDataResult.reason?.message || 'Failed to load mental health hub');
      }
    })();

    return () => {
      active = false;
    };
  }, [initialResources.length]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const forumData = await getForumBootstrap();
        if (!active) return;
        setForumThreads(asArray(forumData?.threads));
      } catch {
        if (!active) return;
        setForumThreads([]);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const moodStreak = getMoodStreak(stats?.logs);
  const upcomingSessions = useMemo(
    () => sessions
      .filter((session) => session?._id && isUpcomingCounselingSession(session))
      .sort((left, right) => (
        (toSessionDateTime(left.date, left.time)?.getTime() ?? new Date(left.date).getTime())
        - (toSessionDateTime(right.date, right.time)?.getTime() ?? new Date(right.date).getTime())
      )),
    [sessions]
  );
  const visibleSuggestions = useMemo(
    () => asArray(suggestions).filter((resource) => resource?._id),
    [suggestions]
  );
  const nextSession = upcomingSessions[0] || null;
  const snapshotItems = [
    {
      label: 'Preferred counselors',
      value: preferredCounselors.length,
      detail: preferredCounselors.length === 1 ? 'counselor saved' : 'counselors saved',
      icon: Users,
      accentClass: 'bg-sky-50 text-sky-700'
    },
    {
      label: 'Saved resources',
      value: savedResources.length,
      detail: savedResources.length === 1 ? 'resource bookmarked' : 'resources bookmarked',
      icon: Bookmark,
      accentClass: 'bg-amber-50 text-amber-600'
    },
    {
      label: 'Mood check-ins',
      value: stats?.totalLogs || 0,
      detail: stats?.totalLogs === 1 ? 'entry recorded' : 'entries recorded',
      icon: Heart,
      accentClass: 'bg-rose-50 text-rose-600'
    }
  ];

  function handlePrefetchSuggestedResource(resource) {
    primeResourceDetailCache(resource);
    prefetchResourceById(resource._id).catch(() => {});
    prefetchResourceRecommendations(resource._id).catch(() => {});
  }

  function handlePrefetchCounselorDirectory() {
    prefetchCounselorDirectory().catch(() => {});
  }

  function handlePrefetchResourceLibrary() {
    prefetchResources({ category: 'Mental Health', limit: 24 }).catch(() => {});
  }

  function handlePrefetchForum() {
    prefetchForumBootstrap().catch(() => {});
  }

  function handlePrefetchSession(sessionId) {
    prefetchCounselingSessionById(sessionId).catch(() => {});
  }

  return (
    <div className="student-shell mental-health-scroll-stable pt-32 md:pt-36 pb-12">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
      <header className="student-hero mb-12 md:mb-16 text-center max-w-[54rem] mx-auto px-5 sm:px-8 md:px-10 py-8 sm:py-10 md:py-12">
        <div className="student-chip bg-purple-100 text-purple-700 mb-6 md:mb-8">
          <Heart className="w-3 h-3 fill-current" />
          Mental Health Hub
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-[4.25rem] font-semibold mb-5 md:mb-7 tracking-tight leading-[1.04] text-primary-text text-balance max-w-4xl mx-auto">
          Support that meets you where you are
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-secondary-text leading-relaxed text-balance max-w-3xl mx-auto">
          Track your mood, book confidential counseling, explore self-help resources, and find anonymous peer support in one calm flow.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12 items-stretch">
        <Link to="/mental-health/mood" className="student-card group relative h-full min-h-[11.5rem] overflow-hidden p-7 flex flex-col">
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.12)_0%,rgba(244,63,94,0)_70%)]" />
          <div className="relative flex items-start justify-between gap-4 mb-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Mood average</p>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] border border-white/70 bg-white/80 text-rose-500 shadow-[0_12px_24px_rgba(15,41,66,0.08)]">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <div className="relative mt-auto flex min-h-[8.4rem] flex-col">
            <p className="text-[3.3rem] leading-none font-semibold text-primary-text">{stats?.averageMood?.toFixed ? stats.averageMood.toFixed(1) : stats?.averageMood || '0.0'}</p>
            <p className="mt-4 min-h-[3.5rem] text-sm leading-7 text-secondary-text">Based on your recent logs</p>
            <div className="mt-auto h-1.5 w-14 rounded-full bg-rose-200/90" />
          </div>
        </Link>
        <Link to="/mental-health/sessions" className="student-card group relative h-full min-h-[11.5rem] overflow-hidden p-7 flex flex-col">
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.12)_0%,rgba(14,165,233,0)_70%)]" />
          <div className="relative flex items-start justify-between gap-4 mb-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Upcoming sessions</p>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] border border-white/70 bg-white/80 text-sky-600 shadow-[0_12px_24px_rgba(15,41,66,0.08)]">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="relative mt-auto flex min-h-[8.4rem] flex-col">
            <p className="text-[3.3rem] leading-none font-semibold text-primary-text">{upcomingSessions.length}</p>
            <p className="mt-4 min-h-[3.5rem] text-sm leading-7 text-secondary-text">Counseling already scheduled</p>
            <div className="mt-auto h-1.5 w-14 rounded-full bg-sky-200/90" />
          </div>
        </Link>
        <Link
          to="/mental-health/resources"
          onMouseEnter={handlePrefetchResourceLibrary}
          onFocus={handlePrefetchResourceLibrary}
          className="student-card group relative h-full min-h-[11.5rem] overflow-hidden p-7 flex flex-col"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.12)_0%,rgba(245,158,11,0)_70%)]" />
          <div className="relative flex items-start justify-between gap-4 mb-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Resource library</p>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] border border-white/70 bg-white/80 text-amber-500 shadow-[0_12px_24px_rgba(15,41,66,0.08)]">
              <Bookmark className="w-5 h-5" />
            </div>
          </div>
          <div className="relative mt-auto flex min-h-[8.4rem] flex-col">
            <p className="text-[3.3rem] leading-none font-semibold text-primary-text">{resourceTotal}</p>
            <p className="mt-4 min-h-[3.5rem] text-sm leading-7 text-secondary-text">Wellness articles, guides, and videos</p>
            <div className="mt-auto h-1.5 w-14 rounded-full bg-amber-200/90" />
          </div>
        </Link>
        <Link
          to="/mental-health/forum"
          onMouseEnter={handlePrefetchForum}
          onFocus={handlePrefetchForum}
          className="student-card group relative h-full min-h-[11.5rem] overflow-hidden p-7 flex flex-col"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.12)_0%,rgba(124,58,237,0)_70%)]" />
          <div className="relative flex items-start justify-between gap-4 mb-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Peer support</p>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] border border-white/70 bg-white/80 text-violet-600 shadow-[0_12px_24px_rgba(15,41,66,0.08)]">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
          </div>
          <div className="relative mt-auto flex min-h-[8.4rem] flex-col">
            <p className="text-[3.3rem] leading-none font-semibold text-primary-text">24/7</p>
            <p className="mt-4 min-h-[3.5rem] text-sm leading-7 text-secondary-text">Anonymous space for shared support</p>
            <div className="mt-auto h-1.5 w-14 rounded-full bg-violet-200/90" />
          </div>
        </Link>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-8 mb-12">
        <div className="student-surface h-full p-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3">Wellness Momentum</p>
          <h2 className="text-3xl font-semibold text-primary-text">{moodStreak} day mood streak</h2>
          <p className="text-secondary-text mt-3 text-lg">
            {moodStreak > 0
              ? 'You have been checking in consistently. Keep tracking to improve suggestions and counselor continuity.'
              : 'Log your mood to unlock stronger trends and more personalized support.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
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

        <div className="rounded-[2rem] h-full p-8 flex flex-col bg-[linear-gradient(135deg,#0f2942_0%,#134b63_55%,#14748b_100%)] text-white shadow-[0_24px_60px_rgba(15,41,66,0.18)] border border-cyan-200/20">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold mb-3">Next Support Step</p>
          {nextSession ? (
            <>
              <h2 className="text-3xl font-semibold !text-white">{nextSession.counselorName}</h2>
              <p className="text-white/80 mt-3">{new Date(nextSession.date).toLocaleDateString()} • {nextSession.time} • {nextSession.typeLabel}</p>
              <p className="text-white/80 mt-3">Status: {nextSession.status}</p>
              <div className="mt-auto pt-6">
                <Link
                  to={`/mental-health/sessions/${nextSession._id}`}
                  onMouseEnter={() => handlePrefetchSession(nextSession._id)}
                  onFocus={() => handlePrefetchSession(nextSession._id)}
                  className="inline-flex self-start items-center justify-center bg-white text-accent-primary px-7 py-3 rounded-full font-bold text-sm"
                >
                  Open Session
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-semibold !text-white">No counseling session booked</h2>
              <p className="text-white/80 mt-3">Browse counselor profiles to book confidential support when you need it.</p>
              <div className="mt-auto pt-6">
                <Link
                  to="/mental-health/counselors"
                  onMouseEnter={handlePrefetchCounselorDirectory}
                  onFocus={handlePrefetchCounselorDirectory}
                  className="inline-flex self-start items-center justify-center bg-white text-accent-primary px-7 py-3 rounded-full font-bold text-sm"
                >
                  Explore Counselors
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="relative overflow-hidden rounded-[2rem] h-full min-h-[25.5rem] p-6 md:p-7 flex flex-col bg-[linear-gradient(135deg,#5b21b6_0%,#7c3aed_55%,#9333ea_100%)] text-white shadow-[0_24px_60px_rgba(109,40,217,0.18)] border border-purple-200/20">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_72%)]" />
              <div className="relative flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-white/14 backdrop-blur-sm">
                    <MessageSquareHeart className="w-6 h-6" />
                  </div>
                  <span className="rounded-full bg-white/12 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
                    Peer space
                  </span>
                </div>
                <div className="mt-5 flex flex-1 flex-col">
                  <div className="min-h-[8.75rem]">
                    <h3 className="text-[1.85rem] leading-tight font-semibold tracking-tight !text-white">Anonymous Forum</h3>
                    <p className="mt-3 text-white/80 text-[0.97rem] leading-8 max-w-md">
                      Talk to peers under an alias, ask for gentle support, and respond to others without exposing your identity.
                    </p>
                  </div>
                  <div className="mt-6 min-h-[6.5rem] rounded-[1.35rem] border border-white/12 bg-white/10 px-4 py-3.5 backdrop-blur-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">Live activity</p>
                    <p className="mt-2 text-sm text-white/85">{forumThreads.length} active sample and student-created threads</p>
                  </div>
                  <div className="mt-6">
                    <Link
                      to="/mental-health/forum"
                      onMouseEnter={handlePrefetchForum}
                      onFocus={handlePrefetchForum}
                      className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-bold text-accent-purple shadow-[0_16px_34px_rgba(15,41,66,0.18)]"
                    >
                      Open Forum
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] h-full min-h-[25.5rem] p-6 md:p-7 flex flex-col bg-[linear-gradient(135deg,#0f766e_0%,#109e92_58%,#22c1b4_100%)] text-white shadow-[0_24px_60px_rgba(15,118,110,0.18)] border border-emerald-200/20">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_72%)]" />
              <div className="relative flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-white/14 backdrop-blur-sm">
                    <Video className="w-6 h-6" />
                  </div>
                  <span className="rounded-full bg-white/12 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
                    Counseling
                  </span>
                </div>
                <div className="mt-5 flex flex-1 flex-col">
                  <div className="min-h-[8.75rem]">
                    <h3 className="text-[1.85rem] leading-tight font-semibold tracking-tight !text-white">Counseling Care</h3>
                    <p className="mt-3 text-white/80 text-[0.97rem] leading-8 max-w-md">
                      Browse counselor profiles, book sessions, and revisit assigned resources after each conversation.
                    </p>
                  </div>
                  <div className="mt-6 min-h-[6.5rem] rounded-[1.35rem] border border-white/12 bg-white/10 px-4 py-3.5 backdrop-blur-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">Current support</p>
                    <p className="mt-2 text-sm text-white/85">
                      {upcomingSessions.length > 0
                        ? `${upcomingSessions.length} upcoming counseling session${upcomingSessions.length === 1 ? '' : 's'}`
                        : 'No upcoming sessions yet. Booking stays one step away.'}
                    </p>
                  </div>
                  <div className="mt-6">
                    <Link
                      to="/mental-health/counselors"
                      onMouseEnter={handlePrefetchCounselorDirectory}
                      onFocus={handlePrefetchCounselorDirectory}
                      className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-bold text-accent-green shadow-[0_16px_34px_rgba(15,41,66,0.18)]"
                    >
                      Explore Counselors
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Suggestion feed</p>
                <h2 className="mt-2 text-2xl font-semibold text-primary-text tracking-tight">Suggested next steps</h2>
              </div>
              <Link to="/mental-health/suggestions" className="text-sm font-semibold text-accent-primary">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {visibleSuggestions.length === 0 ? (
                <p className="text-secondary-text">Suggestions will improve as you log more mood data.</p>
              ) : (
                visibleSuggestions.map((resource) => {
                  const presentation = getResourceTypePresentation(resource.type);
                  const TypeIcon = presentation.icon;

                  return (
                    <Link
                      key={resource._id}
                      to={`/mental-health/resources/${resource._id}`}
                      state={{
                        backTo: '/mental-health',
                        backLabel: 'Back to mental health',
                        resourcePreview: resource
                      }}
                      onMouseEnter={() => handlePrefetchSuggestedResource(resource)}
                      onFocus={() => handlePrefetchSuggestedResource(resource)}
                      className="student-card group flex items-center gap-4 p-5 md:p-6"
                    >
                      <div className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] border ${presentation.badgeClass}`}>
                        <TypeIcon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${presentation.badgeClass}`}>
                            {resource.type}
                          </span>
                          <span className="text-xs font-medium text-secondary-text">{resource.category}</span>
                        </div>
                        <h4 className="mt-3 text-[1.35rem] leading-tight font-semibold text-primary-text transition-colors group-hover:text-accent-primary">
                          {resource.title}
                        </h4>
                      </div>
                      <div className="hidden shrink-0 items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-primary-text md:inline-flex">
                        Open next
                        <ArrowRight className="h-4 w-4 text-accent-primary transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500 md:hidden">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Action lane</p>
                <h2 className="mt-2 text-2xl font-semibold text-primary-text tracking-tight">Quick wellness actions</h2>
              </div>
              <span className="text-sm text-secondary-text">Keep your next step obvious</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to="/mental-health/mood" className="student-card group relative overflow-hidden p-6 md:p-7 flex min-h-[15rem] flex-col">
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.12)_0%,rgba(236,72,153,0)_72%)]" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-rose-50 text-rose-600 shadow-[0_12px_24px_rgba(15,41,66,0.06)]">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-rose-700">
                    Check-in
                  </span>
                </div>
                <div className="relative mt-5 flex-1">
                  <p className="font-semibold text-[1.35rem] leading-tight text-primary-text">Log today’s mood</p>
                  <p className="text-sm leading-7 text-secondary-text mt-3">Capture how you feel and update your wellness trend before the day gets noisy.</p>
                </div>
                <div className="relative mt-6 inline-flex items-center gap-2 self-start rounded-full bg-slate-50 px-4 py-2.5 text-sm font-semibold text-primary-text transition-colors group-hover:bg-rose-50">
                  Start check-in
                  <ArrowRight className="h-4 w-4 text-rose-600 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
              <Link
                to="/mental-health/resources"
                onMouseEnter={handlePrefetchResourceLibrary}
                onFocus={handlePrefetchResourceLibrary}
                className="student-card group relative overflow-hidden p-6 md:p-7 flex min-h-[15rem] flex-col"
              >
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.12)_0%,rgba(245,158,11,0)_72%)]" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-amber-50 text-amber-500 shadow-[0_12px_24px_rgba(15,41,66,0.06)]">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">
                    Library
                  </span>
                </div>
                <div className="relative mt-5 flex-1">
                  <p className="font-semibold text-[1.35rem] leading-tight text-primary-text">Open saved resources</p>
                  <p className="text-sm leading-7 text-secondary-text mt-3">Revisit articles, videos, and guides you bookmarked when you need a fast reset.</p>
                </div>
                <div className="relative mt-6 inline-flex items-center gap-2 self-start rounded-full bg-slate-50 px-4 py-2.5 text-sm font-semibold text-primary-text transition-colors group-hover:bg-amber-50">
                  Open library
                  <ArrowRight className="h-4 w-4 text-amber-500 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
              <Link to="/mental-health/suggestions" className="student-card group relative overflow-hidden p-6 md:p-7 flex min-h-[15rem] flex-col">
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.12)_0%,rgba(16,185,129,0)_72%)]" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-emerald-50 text-emerald-600 shadow-[0_12px_24px_rgba(15,41,66,0.06)]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                    Guided picks
                  </span>
                </div>
                <div className="relative mt-5 flex-1">
                  <p className="font-semibold text-[1.35rem] leading-tight text-primary-text">Review suggestions</p>
                  <p className="text-sm leading-7 text-secondary-text mt-3">See mood-aware support content chosen from your trends and recent check-ins.</p>
                </div>
                <div className="relative mt-6 inline-flex items-center gap-2 self-start rounded-full bg-slate-50 px-4 py-2.5 text-sm font-semibold text-primary-text transition-colors group-hover:bg-emerald-50">
                  See picks
                  <ArrowRight className="h-4 w-4 text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </div>
          </section>
        </div>

        <aside className="space-y-8 lg:self-start">
          <div className="relative overflow-hidden rounded-[2rem] min-h-[25.1rem] p-6 md:p-7 bg-[linear-gradient(145deg,#dc2626_0%,#ef4444_58%,#fb7185_100%)] text-white shadow-[0_24px_60px_rgba(220,38,38,0.18)] border border-rose-200/20">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_72%)]" />
            <div className="relative flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-white/16 p-3 backdrop-blur-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="rounded-full bg-white/12 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
                  Urgent help
                </span>
              </div>
              <div className="mt-5 flex flex-1 flex-col">
                <div className="min-h-[8.35rem]">
                  <h3 className="text-[1.85rem] leading-tight font-semibold tracking-tight !text-white">Emergency Support</h3>
                  <p className="mt-3 text-white/85 text-[0.97rem] leading-[1.9] max-w-md">
                    If you are in immediate distress or need urgent help, call 988 or use your campus emergency line right away.
                  </p>
                </div>
                <div className="mt-6 min-h-[6.5rem] rounded-[1.35rem] border border-white/15 bg-white/10 px-4 py-3.5 backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">Always available</p>
                  <p className="mt-2 text-sm text-white/85">24/7 crisis support is available right now.</p>
                </div>
                <div className="mt-6">
                  <a href="tel:988" className="inline-flex w-full items-center justify-center rounded-2xl bg-white py-3.5 text-lg font-bold text-error shadow-[0_16px_30px_rgba(15,41,66,0.14)]">
                    Call 988
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="student-surface flex h-[36rem] flex-col overflow-hidden p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Upcoming support</p>
                <h3 className="mt-3 text-2xl font-semibold text-primary-text tracking-tight">Your next support plan</h3>
                <p className="mt-3 text-sm leading-6 text-secondary-text">
                  Keep your counseling path visible so the next step feels easy to take.
                </p>
              </div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-sky-50 text-sky-700">
                <Video className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1 sm:pr-2">
              {upcomingSessions.length === 0 ? (
                <div className="rounded-[1.6rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.82)_0%,rgba(248,250,252,0.96)_100%)] px-5 py-5 shadow-[0_16px_32px_rgba(15,41,66,0.06)]">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-white text-sky-700 shadow-[0_12px_24px_rgba(15,41,66,0.08)]">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700">
                          Ready when you are
                        </span>
                      </div>
                      <p className="mt-3 text-base font-semibold text-primary-text">No counseling sessions booked yet.</p>
                      <p className="mt-2 text-sm leading-6 text-secondary-text">
                        Browse profiles, compare support styles, and reserve a time that fits your week.
                      </p>
                      <Link
                        to="/mental-health/counselors"
                        onMouseEnter={handlePrefetchCounselorDirectory}
                        onFocus={handlePrefetchCounselorDirectory}
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-accent-primary shadow-[0_14px_28px_rgba(15,41,66,0.08)]"
                      >
                        Explore counselors
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <Link
                      key={session._id}
                      to={`/mental-health/sessions/${session._id}`}
                      onMouseEnter={() => handlePrefetchSession(session._id)}
                      onFocus={() => handlePrefetchSession(session._id)}
                      className="block rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_100%)] px-5 py-5 shadow-[0_14px_28px_rgba(15,41,66,0.05)] transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-sky-50 text-sky-700">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700">
                              Booked support
                            </span>
                          </div>
                          <p className="mt-3 font-semibold text-primary-text">{session.counselorName}</p>
                          <p className="mt-1 text-sm text-secondary-text">
                            {new Date(session.date).toLocaleDateString()} • {session.time}
                          </p>
                          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent-primary">
                            Open session plan
                            <ArrowRight className="h-4 w-4" />
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="student-surface p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Support snapshot</p>
                <h3 className="mt-3 text-2xl font-semibold text-primary-text tracking-tight">Your progress at a glance</h3>
                <p className="mt-3 text-sm leading-6 text-secondary-text">
                  A quick look at the support habits and resources you have already built.
                </p>
              </div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-violet-50 text-violet-700">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {snapshotItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_100%)] px-5 py-5 shadow-[0_14px_28px_rgba(15,41,66,0.05)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] ${item.accentClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">{item.label}</p>
                        <div className="mt-2 flex items-end gap-2">
                          <span className="text-[1.8rem] font-semibold leading-none tracking-tight text-primary-text">{item.value}</span>
                          <span className="pb-0.5 text-sm text-secondary-text">{item.detail}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {error && <p className="text-red-600 mt-8">{error}</p>}
      </div>
    </div>
  );
}
