import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bookmark, Heart, Sparkles } from 'lucide-react';
import {
  buildMoodSuggestions,
  getCachedMentalHealthResources,
  getCachedMoodStats,
  getMentalHealthResources,
  getMoodStats,
  getSavedResources,
  prefetchResourceRecommendations,
  prefetchResourceById,
  primeResourceDetailCache
} from '../../lib/mentalHealth';
import { getResourceTypePresentation } from '../../lib/resourcePresentation';

function buildSuggestionContext(stats) {
  const logs = Array.isArray(stats?.logs) ? stats.logs : [];
  const moodDistribution = stats?.moodDistribution && typeof stats.moodDistribution === 'object'
    ? stats.moodDistribution
    : {};

  const latestMood = logs[logs.length - 1]?.mood || '';
  const frequentMood = Object.entries(moodDistribution)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] || '';

  const factorCounts = new Map();
  logs.forEach((log) => {
    (Array.isArray(log?.factors) ? log.factors : []).forEach((factor) => {
      if (factor) {
        factorCounts.set(factor, (factorCounts.get(factor) || 0) + 1);
      }
    });
  });

  const topFactors = [...factorCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([factor]) => factor);

  return {
    latestMood,
    frequentMood,
    topFactors,
    isFallback: !latestMood && !frequentMood && topFactors.length === 0
  };
}

function getRecommendationReason(resource, context) {
  const text = [
    resource?.title,
    resource?.description,
    resource?.content,
    resource?.subCategory,
    ...(Array.isArray(resource?.tags) ? resource.tags : [])
  ].join(' ').toLowerCase();

  const matchedFactor = (context.topFactors || []).find((factor) => text.includes(`${factor}`.toLowerCase()));
  if (matchedFactor) {
    return `${matchedFactor}-aware support`;
  }

  if (context.latestMood && text.includes(context.latestMood.toLowerCase())) {
    return `Matches your latest ${context.latestMood.toLowerCase()} check-in`;
  }

  if (context.frequentMood) {
    return `Picked for your recent ${context.frequentMood.toLowerCase()} pattern`;
  }

  return 'Helpful support to get you started';
}

export default function Suggestions() {
  const cachedStats = getCachedMoodStats();
  const cachedResources = getCachedMentalHealthResources({ limit: 12 });
  const initialSuggestions = buildMoodSuggestions({
    stats: cachedStats,
    resources: Array.isArray(cachedResources) ? cachedResources : []
  });
  const initialContext = buildSuggestionContext(cachedStats);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [savedResources, setSavedResources] = useState(() => getSavedResources());
  const [context, setContext] = useState(initialContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => initialSuggestions.length === 0);

  function handlePrefetchResource(resource) {
    primeResourceDetailCache(resource);
    prefetchResourceById(resource._id).catch(() => {});
    prefetchResourceRecommendations(resource._id).catch(() => {});
  }

  useEffect(() => {
    let active = true;

    const loadSuggestions = async (options = {}) => {
      try {
        if (options.forceRefresh) {
          setLoading(true);
        }

        const [stats, resources] = await Promise.all([
          getMoodStats(options),
          getMentalHealthResources({ limit: 12 }, options)
        ]);
        if (!active) return;

        const resourceList = Array.isArray(resources) ? resources : [];
        setSuggestions(buildMoodSuggestions({ stats, resources: resourceList }));
        setSavedResources(getSavedResources());
        setContext(buildSuggestionContext(stats));
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load suggestions');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSuggestions();

    const handleFocus = () => {
      loadSuggestions();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSuggestions();
      }
    };

    const syncSavedResources = (nextResources) => {
      if (!active) return;
      setSavedResources(Array.isArray(nextResources) ? nextResources : getSavedResources());
    };

    const handleSavedResourcesUpdated = (event) => {
      syncSavedResources(event?.detail);
    };

    const handleStorage = () => {
      syncSavedResources();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('campushealth:saved-resources-updated', handleSavedResourcesUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      active = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('campushealth:saved-resources-updated', handleSavedResourcesUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return (
    <div className="student-shell pt-32 md:pt-36 pb-12">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        <header className="student-hero px-5 sm:px-8 md:px-10 py-8 sm:py-10 md:py-12">
          <div className="flex flex-col gap-6">
            <div className="max-w-3xl">
              <div className="flex flex-col items-start gap-4">
                <Link
                  to="/mental-health"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-primary-text shadow-[0_12px_24px_rgba(15,41,66,0.06)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to mental health
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">
                  <Sparkles className="h-3 w-3" />
                  Personalized suggestions
                </div>
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-primary-text sm:text-5xl">
                Recommended support
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-secondary-text">
                {context.isFallback
                  ? 'Helpful support picks are ready while your mood history is still growing.'
                  : 'These recommendations are shaped by your latest mood, your recent pattern, and the wellness topics showing up in your check-ins.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/70 bg-white/85 px-4 py-4 shadow-[0_14px_28px_rgba(15,41,66,0.06)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Latest mood</p>
                <p className="mt-3 text-lg font-semibold text-primary-text">{context.latestMood || 'Getting started'}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/70 bg-white/85 px-4 py-4 shadow-[0_14px_28px_rgba(15,41,66,0.06)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Frequent mood</p>
                <p className="mt-3 text-lg font-semibold text-primary-text">{context.frequentMood || 'Building pattern'}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/70 bg-white/85 px-4 py-4 shadow-[0_14px_28px_rgba(15,41,66,0.06)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Top factor</p>
                <p className="mt-3 text-lg font-semibold text-primary-text">{context.topFactors[0] || 'General wellness'}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1.8fr)_minmax(20rem,0.95fr)] gap-8">
          <section className="student-surface p-6 md:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Recommendation feed</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary-text">What to open next</h2>
                <p className="mt-3 text-sm leading-6 text-secondary-text">
                  {context.isFallback
                    ? 'Start with a balanced mix of wellness formats while we learn your rhythm.'
                    : 'This list is ranked around the mood signals and support themes appearing in your recent check-ins.'}
                </p>
              </div>
              <div className="inline-flex items-center rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-primary-text">
                {loading ? 'Loading...' : `${suggestions.length} ready`}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-6">
                  <p className="text-base font-semibold text-primary-text">Loading personalized suggestions...</p>
                  <p className="mt-2 text-sm leading-6 text-secondary-text">
                    We&apos;re matching your recent mood signals with the best next-step resources now.
                  </p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-6">
                  <p className="text-base font-semibold text-primary-text">Suggestions will appear soon.</p>
                  <p className="mt-2 text-sm leading-6 text-secondary-text">
                    Add more mood check-ins or browse the library to help us surface better next-step support.
                  </p>
                </div>
              ) : (
                suggestions.map((resource) => {
                  const presentation = getResourceTypePresentation(resource.type);
                  const TypeIcon = presentation.icon;
                  const reason = getRecommendationReason(resource, context);

                  return (
                    <Link
                      key={resource._id}
                      to={`/mental-health/resources/${resource._id}`}
                      state={{
                        backTo: '/mental-health/suggestions',
                        backLabel: 'Back to suggestions',
                        resourcePreview: resource
                      }}
                      onMouseEnter={() => handlePrefetchResource(resource)}
                      onFocus={() => handlePrefetchResource(resource)}
                      className="student-card group flex gap-4 p-5 md:p-6"
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
                        <h3 className="mt-3 text-[1.45rem] leading-tight font-semibold text-primary-text transition-colors group-hover:text-accent-primary">
                          {resource.title}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-secondary-text">{resource.description}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <span className="inline-flex rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-primary-text">
                            {reason}
                          </span>
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent-primary">
                            Open resource
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="student-surface p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Recommendation flow</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary-text">Why these picks show up</h2>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-amber-50 text-amber-600">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-[1.45rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_100%)] px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Signal 1</p>
                  <p className="mt-2 text-sm font-semibold text-primary-text">Latest mood: {context.latestMood || 'Not enough check-ins yet'}</p>
                </div>
                <div className="rounded-[1.45rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_100%)] px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Signal 2</p>
                  <p className="mt-2 text-sm font-semibold text-primary-text">Frequent pattern: {context.frequentMood || 'Still learning your pattern'}</p>
                </div>
                <div className="rounded-[1.45rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_100%)] px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Signal 3</p>
                  <p className="mt-2 text-sm font-semibold text-primary-text">
                    Factors: {context.topFactors.length ? context.topFactors.join(', ') : 'General wellness support'}
                  </p>
                </div>
              </div>
            </div>

            <div className="student-surface p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Saved resources</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary-text">Your revisit list</h2>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-sky-50 text-sky-700">
                  <Bookmark className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {savedResources.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/75 px-5 py-5">
                    <p className="text-base font-semibold text-primary-text">No saved resources yet.</p>
                    <p className="mt-2 text-sm leading-6 text-secondary-text">
                      Save articles, videos, and guides from the library to keep a personal support shelf here.
                    </p>
                    <Link to="/mental-health/resources" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-primary">
                      Open library
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  savedResources.slice(0, 4).map((resource) => {
                    const presentation = getResourceTypePresentation(resource.type);
                    const TypeIcon = presentation.icon;

                    return (
                      <Link
                        key={resource._id}
                        to={`/mental-health/resources/${resource._id}`}
                        state={{
                          backTo: '/mental-health/suggestions',
                          backLabel: 'Back to suggestions',
                          resourcePreview: resource
                        }}
                        onMouseEnter={() => handlePrefetchResource(resource)}
                        onFocus={() => handlePrefetchResource(resource)}
                        className="block rounded-[1.45rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_100%)] px-5 py-4 shadow-[0_12px_24px_rgba(15,41,66,0.04)]"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] border ${presentation.badgeClass}`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-primary-text">{resource.title}</p>
                            <p className="mt-1 text-sm text-secondary-text">{resource.type}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>

        {error && <p className="mt-8 text-red-600">{error}</p>}
      </div>
    </div>
  );
}
