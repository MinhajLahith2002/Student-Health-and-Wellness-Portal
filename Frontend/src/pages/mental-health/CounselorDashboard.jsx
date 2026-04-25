import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  Library,
  NotebookPen,
  NotepadText,
  Settings2,
  Video
} from 'lucide-react';
import {
  getCachedCounselorDashboard,
  getCachedCounselorSessionTrends,
  COUNSELOR_TREND_GROUP_DEFAULT,
  COUNSELOR_TREND_RANGE_DEFAULT,
  getCounselorDashboard,
  getCounselorSessionTrends,
  subscribeCounselorDashboardRefresh
} from '../../lib/counseling';
import DismissibleBanner from '../../components/DismissibleBanner';
import CounselorSessionTrendChart from '../../components/mental-health/CounselorSessionTrendChart';
import { cn } from '../../lib/utils';

function getDefaultGroupByForRange(range) {
  if (range === '14d') return 'day';
  if (range === '12m') return 'month';
  return 'week';
}

function getDefaultRangeForGroupBy(groupBy) {
  if (groupBy === 'day') return '14d';
  if (groupBy === 'month') return '12m';
  return '8w';
}

export default function CounselorDashboard() {
  const initialTrendCache = getCachedCounselorSessionTrends(
    COUNSELOR_TREND_RANGE_DEFAULT,
    COUNSELOR_TREND_GROUP_DEFAULT
  );
  const [dashboard, setDashboard] = useState(() => getCachedCounselorDashboard());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => !getCachedCounselorDashboard());
  const [trendRange, setTrendRange] = useState(COUNSELOR_TREND_RANGE_DEFAULT);
  const [trendGroupBy, setTrendGroupBy] = useState(COUNSELOR_TREND_GROUP_DEFAULT);
  const [trendData, setTrendData] = useState(() => initialTrendCache?.points || []);
  const [trendSummary, setTrendSummary] = useState(() => initialTrendCache?.summary || {
    completedTotal: 0,
    pendingTotal: 0,
    pendingAttentionThreshold: 0
  });
  const [trendGeneratedAt, setTrendGeneratedAt] = useState(() => initialTrendCache?.generatedAt || '');
  const [trendLoading, setTrendLoading] = useState(() => !initialTrendCache?.points?.length);
  const [trendRefreshing, setTrendRefreshing] = useState(false);
  const [trendError, setTrendError] = useState('');
  const dashboardRef = useRef(dashboard);
  const trendDataRef = useRef(trendData);
  const trendRequestIdRef = useRef(0);

  useEffect(() => {
    dashboardRef.current = dashboard;
  }, [dashboard]);

  useEffect(() => {
    trendDataRef.current = trendData;
  }, [trendData]);

  useEffect(() => {
    let active = true;
    let refreshTimer = null;

    const loadDashboard = async (showLoading = false) => {
      if (showLoading && active) {
        setLoading(true);
      }

      try {
        const data = await getCounselorDashboard();
        if (!active) return;
        setDashboard(data);
        setError('');
      } catch (err) {
        if (!active) return;
        if (!dashboardRef.current) {
          setError(err.message || 'Failed to load counselor dashboard');
        }
      } finally {
        if (active && showLoading) {
          setLoading(false);
        }
      }
    };

    const loadAll = () => {
      loadDashboard();
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        loadAll();
      }
    };

    const unsubscribeDashboardRefresh = subscribeCounselorDashboardRefresh(() => {
      loadAll();
    });

    loadDashboard(!getCachedCounselorDashboard());
    refreshTimer = window.setInterval(loadAll, 10000);
    window.addEventListener('focus', loadAll);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);

    return () => {
      active = false;
      if (refreshTimer) {
        window.clearInterval(refreshTimer);
      }
      window.removeEventListener('focus', loadAll);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
      unsubscribeDashboardRefresh();
    };
  }, []);

  useEffect(() => {
    let active = true;
    let refreshTimer = null;
    const cachedTrendForSelection = getCachedCounselorSessionTrends(trendRange, trendGroupBy);

    if (cachedTrendForSelection) {
      setTrendData(cachedTrendForSelection.points || []);
      setTrendSummary(cachedTrendForSelection.summary || {
        completedTotal: 0,
        pendingTotal: 0,
        pendingAttentionThreshold: 0
      });
      setTrendGeneratedAt(cachedTrendForSelection.generatedAt || '');
      setTrendError('');
      setTrendLoading(false);
    }

    const loadTrends = async ({
      showLoading = false,
      showRefreshing = false,
      nextRange = trendRange,
      nextGroupBy = trendGroupBy
    } = {}) => {
      const requestId = trendRequestIdRef.current + 1;
      trendRequestIdRef.current = requestId;

      if (showLoading && active) {
        setTrendLoading(true);
      } else if (showRefreshing && active && trendDataRef.current.length) {
        setTrendRefreshing(true);
      }

      try {
        const data = await getCounselorSessionTrends({
          range: nextRange,
          groupBy: nextGroupBy
        });
        if (!active || requestId !== trendRequestIdRef.current) return;
        setTrendData(data.points || []);
        setTrendSummary(data.summary || {
          completedTotal: 0,
          pendingTotal: 0,
          pendingAttentionThreshold: 0
        });
        setTrendGeneratedAt(data.generatedAt || '');
        setTrendError('');
      } catch (err) {
        if (!active || requestId !== trendRequestIdRef.current) return;
        if (!trendDataRef.current.length) {
          setTrendError(err.message || 'Failed to load counselor session trends');
        }
      } finally {
        const isLatestRequest = active && requestId === trendRequestIdRef.current;
        if (isLatestRequest) {
          if (showLoading) {
            setTrendLoading(false);
          }
          if (showRefreshing) {
            setTrendRefreshing(false);
          }
        }
      }
    };

    const refreshTrends = () => {
      loadTrends({ showRefreshing: true });
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        refreshTrends();
      }
    };

    const unsubscribeDashboardRefresh = subscribeCounselorDashboardRefresh(() => {
      refreshTrends();
    });

    loadTrends({
      showLoading: !trendDataRef.current.length,
      showRefreshing: Boolean(trendDataRef.current.length)
    });
    refreshTimer = window.setInterval(refreshTrends, 10000);
    window.addEventListener('focus', refreshTrends);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);

    return () => {
      active = false;
      if (refreshTimer) {
        window.clearInterval(refreshTimer);
      }
      window.removeEventListener('focus', refreshTrends);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
      unsubscribeDashboardRefresh();
    };
  }, [trendGroupBy, trendRange]);

  function handleTrendRangeChange(nextRange) {
    setTrendRange(nextRange);
    setTrendGroupBy(getDefaultGroupByForRange(nextRange));
  }

  function handleTrendGroupByChange(nextGroupBy) {
    setTrendGroupBy(nextGroupBy);
    setTrendRange(getDefaultRangeForGroupBy(nextGroupBy));
  }

  const shouldShowDashboardError = Boolean(error) && !dashboard;
  const shouldShowTrendError = Boolean(trendError) && !trendData.length;

  const stats = dashboard?.stats || {};
  const upcomingSessions = dashboard?.upcomingSessions || [];

  return (
    <div className="pharmacy-shell min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-8 pt-4 space-y-8">
        <section className="pharmacy-hero">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
            <div className="max-w-4xl">
              <span className="pharmacy-pill inline-flex items-center gap-2 bg-emerald-50 text-emerald-700">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Counselor Workspace
              </span>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-tight leading-[1.02] text-primary-text">Manage open slots, booked sessions, notes, and follow-up care.</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-secondary-text">
                This workspace follows the same pharmacy-style surface system while focusing on counselor-owned slot inventory, session completion, and student-visible follow-up.
              </p>
            </div>

            <div className="justify-self-end rounded-[2rem] border border-[#d9e8ee] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)] xl:mt-[3.75rem] xl:w-[340px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Quick Access</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Link to="/counselor/sessions" className="pharmacy-primary inline-flex items-center justify-center gap-3">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                    <CalendarCheck2 className="h-4 w-4" />
                  </span>
                  <span>Open Sessions</span>
                </Link>
                <Link to="/counselor/notes" className="pharmacy-secondary inline-flex items-center justify-center gap-3">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span>Recent Notes</span>
                </Link>
                <Link to="/counselor/profile" className="pharmacy-secondary inline-flex items-center justify-center gap-3 sm:col-span-2 xl:col-span-1">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                    <Settings2 className="h-4 w-4" />
                  </span>
                  <span>Profile Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {loading && !dashboard ? (
          <section className="pharmacy-panel p-8 text-secondary-text">Loading counselor dashboard...</section>
        ) : (
          <>
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-6">
              {[
                {
                  label: 'Upcoming Sessions',
                  value: upcomingSessions.length,
                  icon: CalendarClock,
                  accentClassName: 'bg-emerald-50 text-emerald-700'
                },
                {
                  label: 'Active Students',
                  value: stats.activeStudents || 0,
                  icon: HeartHandshake,
                  accentClassName: 'bg-emerald-50 text-emerald-700'
                },
                {
                  label: 'Pending Notes',
                  value: stats.pendingNotes || 0,
                  icon: FileText,
                  accentClassName: 'bg-emerald-50 text-emerald-700'
                },
                {
                  label: 'No Shows',
                  value: stats.noShows || 0,
                  icon: AlertTriangle,
                  accentClassName: 'bg-amber-50 text-amber-700',
                  to: '/counselor/sessions?outcome=no-show#recent-outcomes'
                },
                {
                  label: 'Assigned Resources',
                  value: stats.assignedResources || 0,
                  icon: NotebookPen,
                  accentClassName: 'bg-emerald-50 text-emerald-700'
                },
                {
                  label: 'Open Slots',
                  value: stats.openSlots || 0,
                  icon: CalendarDays,
                  accentClassName: 'bg-emerald-50 text-emerald-700'
                }
              ].map((item) => {
                const cardClasses = cn(
                  'pharmacy-card p-6',
                  item.to && 'transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300'
                );

                const content = (
                  <>
                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', item.accentClassName)}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">{item.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-primary-text">{item.value}</p>
                  </>
                );

                return item.to ? (
                  <Link key={item.label} to={item.to} className={cardClasses}>
                    {content}
                  </Link>
                ) : (
                  <div key={item.label} className={cardClasses}>
                    {content}
                  </div>
                );
              })}
            </section>

            <CounselorSessionTrendChart
              data={trendData}
              loading={trendLoading}
              refreshing={trendRefreshing}
              error={shouldShowTrendError ? trendError : ''}
              range={trendRange}
              groupBy={trendGroupBy}
              generatedAt={trendGeneratedAt}
              pendingThreshold={trendSummary.pendingAttentionThreshold}
              onRangeChange={handleTrendRangeChange}
              onGroupByChange={handleTrendGroupByChange}
              onRetry={() => {
                const requestId = trendRequestIdRef.current + 1;
                trendRequestIdRef.current = requestId;
                setTrendLoading(true);
                getCounselorSessionTrends({
                  range: trendRange,
                  groupBy: trendGroupBy
                })
                  .then((data) => {
                    if (requestId !== trendRequestIdRef.current) return;
                    setTrendData(data.points || []);
                    setTrendSummary(data.summary || {
                      completedTotal: 0,
                      pendingTotal: 0,
                      pendingAttentionThreshold: 0
                    });
                    setTrendGeneratedAt(data.generatedAt || '');
                    setTrendError('');
                  })
                  .catch((err) => {
                    if (requestId !== trendRequestIdRef.current) return;
                    if (!trendDataRef.current.length) {
                      setTrendError(err.message || 'Failed to load counselor session trends');
                    }
                  })
                  .finally(() => {
                    if (requestId !== trendRequestIdRef.current) return;
                    setTrendLoading(false);
                  });
              }}
            />

            <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
              <div className="pharmacy-panel p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Upcoming booked sessions</p>
                    <h2 className="mt-2 text-3xl font-semibold text-primary-text">Stay ahead of today’s counseling flow.</h2>
                  </div>
                  <Link to="/counselor/sessions" className="pharmacy-secondary inline-flex items-center gap-2 px-5">
                    Manage all
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-6">
                  {upcomingSessions.length > 0 ? (
                    <div className="max-h-[440px] overflow-y-auto rounded-[1.75rem] bg-secondary-bg/70">
                      {upcomingSessions.map((session, index) => (
                        <Link
                          key={session._id}
                          to={`/counselor/sessions/${session._id}`}
                          className={cn(
                            'block px-5 py-4',
                            index !== upcomingSessions.length - 1 && 'border-b border-white/70'
                          )}
                        >
                          <p className="font-semibold text-primary-text">{session.studentName}</p>
                          <p className="mt-1 text-sm text-secondary-text">{new Date(session.date).toLocaleDateString()} • {session.time} • {session.type}</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-secondary-text">No counseling sessions are booked yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="pharmacy-panel p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Follow-up queue</p>
                  <p className="mt-3 text-sm leading-6 text-secondary-text">
                    {stats.pendingFollowUps || 0} session{stats.pendingFollowUps === 1 ? '' : 's'} currently carry a follow-up recommendation that should stay visible in the student view.
                  </p>
                </div>

                <div className="pharmacy-panel p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Quick links</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-3">
                    <Link to="/counselor/resources" className="pharmacy-secondary inline-flex min-h-[4.5rem] items-center justify-start gap-3 px-6">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                        <Library className="h-4 w-4" />
                      </span>
                      <span className="text-left">Browse Resources</span>
                    </Link>
                    <Link to="/counselor/notifications" className="pharmacy-secondary inline-flex min-h-[4.5rem] items-center justify-start gap-3 px-6">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                        <Bell className="h-4 w-4" />
                      </span>
                      <span className="text-left">Open Notifications</span>
                    </Link>
                    <Link to="/counselor/notes" className="pharmacy-secondary inline-flex min-h-[4.5rem] items-center justify-start gap-3 px-6">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                        <NotepadText className="h-4 w-4" />
                      </span>
                      <span className="text-left">Review Notes History</span>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {shouldShowDashboardError && (
          <DismissibleBanner
            message={error}
            tone="error"
            onClose={() => setError('')}
            autoHideMs={0}
          />
        )}
      </div>
    </div>
  );
}
