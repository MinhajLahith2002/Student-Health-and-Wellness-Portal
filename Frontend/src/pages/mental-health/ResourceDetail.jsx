import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Bookmark, BookmarkCheck, BookOpenText, Clock3, Headphones, Newspaper, Sparkles, Tags, UserRound, Video } from 'lucide-react';
import {
  getCachedResourceById,
  getCachedResourceRecommendations,
  getResourceById,
  getResourceRecommendations,
  getSavedResources,
  prefetchResourceRecommendations,
  prefetchResourceById,
  primeResourceDetailCache,
  toggleSavedResource
} from '../../lib/mentalHealth';
import DismissibleBanner from '../../components/DismissibleBanner';
import { getResourceLengthLabel, getResourceTypePresentation } from '../../lib/resourcePresentation';

function createFallbackVideoUrl(title = '') {
  const query = encodeURIComponent(`${title} student wellness video`.trim());
  return `https://www.youtube.com/results?search_query=${query}`;
}

function ResourceMetaItem({ icon: Icon, label, value, accentClass = 'bg-sky-100 text-sky-700' }) {
  return (
    <div className="flex items-start gap-3 rounded-[1.25rem] border border-white/80 bg-white/75 p-4">
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${accentClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">{label}</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-primary-text">{value || 'Not specified'}</p>
      </div>
    </div>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="rounded-[1.5rem] border border-white/80 bg-white/75 p-5 shadow-[0_14px_34px_rgba(15,41,66,0.05)]">
      <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-4 h-8 w-4/5 animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-100" />
      <div className="mt-2 h-4 w-11/12 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-8 flex items-center justify-between gap-3">
        <div className="h-10 w-32 animate-pulse rounded-full bg-cyan-100" />
        <div className="h-10 w-24 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function RecommendationCard({
  resource,
  currentPath,
  isSaved,
  onToggleSavedResource,
  onPrefetch
}) {
  const presentation = getResourceTypePresentation(resource.type);
  const RecommendationIcon = presentation.icon;

  return (
    <article className="flex h-full flex-col rounded-[1.55rem] border border-white/80 bg-white/88 p-5 shadow-[0_14px_34px_rgba(15,41,66,0.05)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${presentation.badgeClass}`}>
              <RecommendationIcon className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">{resource.type}</p>
          </div>
          <h3 className="mt-4 text-xl font-semibold leading-tight text-primary-text">{resource.title}</h3>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-secondary-text">{resource.description}</p>
      <div className="mt-auto flex flex-nowrap items-center justify-between gap-3 pt-6">
        <Link
          to={`/mental-health/resources/${resource._id}`}
          state={{
            backTo: currentPath,
            backLabel: 'Back to resource',
            resourcePreview: resource
          }}
          onMouseEnter={() => onPrefetch(resource)}
          onFocus={() => onPrefetch(resource)}
          className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-accent-primary transition-colors hover:bg-cyan-100"
        >
          <span>Open resource</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => onToggleSavedResource(resource)}
          className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors ${
            isSaved ? 'bg-amber-100 text-amber-700' : 'bg-secondary-bg text-primary-text'
          }`}
        >
          {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>
    </article>
  );
}

export default function ResourceDetail() {
  const { resourceId } = useParams();
  const location = useLocation();
  const isCounselorDetailView = location.pathname.startsWith('/counselor/resources/');
  const previewResource = location.state?.resourcePreview?._id === resourceId ? location.state.resourcePreview : null;
  const cachedResource = getCachedResourceById(resourceId);
  const cachedRecommendations = getCachedResourceRecommendations(resourceId);
  const [resource, setResource] = useState(previewResource || cachedResource);
  const [recommendations, setRecommendations] = useState({
    sameType: Array.isArray(cachedRecommendations?.sameType) ? cachedRecommendations.sameType : [],
    moodBased: Array.isArray(cachedRecommendations?.moodBased) ? cachedRecommendations.moodBased : [],
    moodContext: {
      latestMood: cachedRecommendations?.moodContext?.latestMood || '',
      frequentMood: cachedRecommendations?.moodContext?.frequentMood || '',
      topFactors: Array.isArray(cachedRecommendations?.moodContext?.topFactors) ? cachedRecommendations.moodContext.topFactors : [],
      isFallback: Boolean(cachedRecommendations?.moodContext?.isFallback ?? true)
    }
  });
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(() => !cachedRecommendations && !isCounselorDetailView);
  const [savedResources, setSavedResources] = useState(() => getSavedResources());
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setResource(previewResource || cachedResource || null);
    setError('');
  }, [cachedResource, previewResource, resourceId]);

  useEffect(() => {
    setRecommendations({
      sameType: Array.isArray(cachedRecommendations?.sameType) ? cachedRecommendations.sameType : [],
      moodBased: Array.isArray(cachedRecommendations?.moodBased) ? cachedRecommendations.moodBased : [],
      moodContext: {
        latestMood: cachedRecommendations?.moodContext?.latestMood || '',
        frequentMood: cachedRecommendations?.moodContext?.frequentMood || '',
        topFactors: Array.isArray(cachedRecommendations?.moodContext?.topFactors) ? cachedRecommendations.moodContext.topFactors : [],
        isFallback: Boolean(cachedRecommendations?.moodContext?.isFallback ?? true)
      }
    });
    setIsRecommendationsLoading(!cachedRecommendations && !isCounselorDetailView);
  }, [cachedRecommendations, isCounselorDetailView, resourceId]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getResourceById(resourceId);
        if (!active) return;
        setResource(data);
        setError('');
      } catch (err) {
        if (!active) return;
        if (!previewResource) {
          setError(err.message || 'Failed to load resource');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [previewResource, resourceId]);

  useEffect(() => {
    if (isCounselorDetailView) return undefined;

    let active = true;
    if (!cachedRecommendations) {
      setIsRecommendationsLoading(true);
    }

    (async () => {
      try {
        const data = await getResourceRecommendations(resourceId);
        if (!active) return;
        setRecommendations({
          sameType: Array.isArray(data?.sameType) ? data.sameType : [],
          moodBased: Array.isArray(data?.moodBased) ? data.moodBased : [],
          moodContext: {
            latestMood: data?.moodContext?.latestMood || '',
            frequentMood: data?.moodContext?.frequentMood || '',
            topFactors: Array.isArray(data?.moodContext?.topFactors) ? data.moodContext.topFactors : [],
            isFallback: Boolean(data?.moodContext?.isFallback)
          }
        });
      } catch {
        if (!active) return;
        setRecommendations({
          sameType: [],
          moodBased: [],
          moodContext: {
            latestMood: '',
            frequentMood: '',
            topFactors: [],
            isFallback: true
          }
        });
      } finally {
        if (active) {
          setIsRecommendationsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [cachedRecommendations, isCounselorDetailView, resourceId]);

  const backLink = useMemo(() => {
    const stateBackTo = location.state?.backTo;
    if (typeof stateBackTo === 'string' && stateBackTo.startsWith('/')) {
      return {
        to: stateBackTo,
        label: location.state?.backLabel || (isCounselorDetailView ? 'Back to counselor resources' : 'Back to library')
      };
    }

    if (isCounselorDetailView) {
      return {
        to: '/counselor/resources',
        label: 'Back to counselor resources'
      };
    }

    return {
      to: '/mental-health/resources',
      label: 'Back to library'
    };
  }, [isCounselorDetailView, location.state]);

  if (error) return <div className="pt-36 px-6 text-red-600">{error}</div>;
  if (!resource) return <div className="pt-36 px-6">Loading resource...</div>;

  const isSaved = savedResources.some((entry) => entry._id === resource._id);
  const resolvedVideoUrl = resource.type === 'Video' ? (resource.videoUrl || createFallbackVideoUrl(resource.title)) : '';
  const hasRecommendationContent = isRecommendationsLoading || recommendations.sameType.length > 0 || recommendations.moodBased.length > 0;
  const moodRecommendationLabel = recommendations.moodContext.isFallback
    ? 'Helpful picks to get you started'
    : 'Based on your recent check-ins';
  const highlightedTags = Array.isArray(resource.tags) ? resource.tags.slice(0, 4) : [];
  const resourceLengthLabel = getResourceLengthLabel(resource);
  const currentResourcePresentation = getResourceTypePresentation(resource.type);
  const CurrentResourceIcon = currentResourcePresentation.icon;

  function handlePrefetchResource(nextResource) {
    primeResourceDetailCache(nextResource);
    prefetchResourceById(nextResource._id).catch(() => {});
    prefetchResourceRecommendations(nextResource._id).catch(() => {});
  }

  function handleToggleSavedResource(targetResource = resource) {
    const nextSavedResources = toggleSavedResource(targetResource);
    const nextIsSaved = nextSavedResources.some((entry) => entry._id === targetResource._id);

    setSavedResources(nextSavedResources);
    setSaveMessage(
      nextIsSaved
        ? 'Resource saved to your library. You can find it again from the Saved filter in the self-help library.'
        : 'Resource removed from your saved library.'
    );
  }

  if (isCounselorDetailView) {
    return (
      <div className="pharmacy-shell -mx-8 -mt-4 min-h-[calc(100vh-6rem)] px-8 pb-16 pt-4">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="pharmacy-panel p-8">
            <DismissibleBanner
              message={saveMessage}
              tone="success"
              onClose={() => setSaveMessage('')}
              className="mb-6"
            />

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <span className={`pharmacy-pill inline-flex items-center gap-2 ${currentResourcePresentation.badgeClass}`}>
                    <CurrentResourceIcon className="h-4 w-4" />
                    {resource.type} • {resource.category}
                  </span>
                  <h1 className="mt-5 text-4xl font-semibold tracking-tight text-primary-text">{resource.title}</h1>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-secondary-text">{resource.description}</p>
                  {highlightedTags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {highlightedTags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-secondary-text">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 lg:items-end">
                  <Link to={backLink.to} className="pharmacy-secondary">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="whitespace-nowrap">{backLink.label}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleToggleSavedResource}
                    aria-pressed={isSaved}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                      isSaved
                        ? 'border border-amber-200 bg-amber-100 text-amber-700'
                        : 'border border-slate-200 bg-white text-primary-text hover:bg-slate-50'
                    }`}
                  >
                    {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    {isSaved ? 'Saved to library' : 'Save to library'}
                  </button>
                </div>
              </div>

              {resolvedVideoUrl && (
                <div className="flex flex-wrap gap-3">
                  <a
                    href={resolvedVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="pharmacy-primary"
                  >
                    Open linked video
                  </a>
                </div>
              )}
            </div>
          </section>

          <section className="pharmacy-panel p-8">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="pharmacy-pill bg-white text-slate-700">
                {resourceLengthLabel}
              </span>
              <span className="pharmacy-pill bg-white text-slate-700">
                By {resource.author}
              </span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Resource content</p>
            <article className="prose prose-slate mt-5 max-w-none">
              <p>{resource.content}</p>
            </article>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-36 pb-12 px-6 max-w-6xl mx-auto student-shell">
      <div className="apple-card overflow-hidden border-none bg-white/70 p-6 backdrop-blur-sm md:p-8 lg:p-10">
        <DismissibleBanner
          message={saveMessage}
          tone="success"
          onClose={() => setSaveMessage('')}
          className="mb-6"
        />

        <div className="mb-8 flex items-center justify-end">
          <Link
            to={backLink.to}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary-text shadow-[0_10px_22px_rgba(15,41,66,0.05)] transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLink.label}
          </Link>
        </div>

        <section className="rounded-[2.1rem] border border-cyan-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(233,248,255,0.92))] p-6 shadow-[0_20px_44px_rgba(15,41,66,0.06)] md:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] ${currentResourcePresentation.badgeClass}`}>
                  <CurrentResourceIcon className="h-4 w-4" />
                  {resource.type}
                </span>
                <span className="rounded-full bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-secondary-text">
                  {resource.category}
                </span>
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-primary-text md:text-5xl">
                {resource.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-secondary-text">
                {resource.description}
              </p>

              {highlightedTags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {highlightedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/85 px-3.5 py-2 text-xs font-semibold text-secondary-text"
                    >
                      <Tags className="h-3.5 w-3.5 text-accent-primary" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                {resolvedVideoUrl && (
                  <a
                    href={resolvedVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(12,131,169,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_34px_rgba(12,131,169,0.3)]"
                  >
                    <Video className="h-4 w-4" />
                    Open linked video
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleToggleSavedResource(resource)}
                  aria-pressed={isSaved}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${
                    isSaved
                      ? 'bg-amber-100 text-amber-700'
                      : 'border border-slate-200 bg-white/90 text-primary-text hover:bg-white'
                  }`}
                >
                  {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  {isSaved ? 'Saved to library' : 'Save to library'}
                </button>
              </div>
            </div>

            <aside className="rounded-[1.8rem] border border-white/80 bg-white/76 p-5 shadow-[0_18px_36px_rgba(15,41,66,0.05)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Quick view</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary-text">What this resource gives you</h2>
              <p className="mt-3 text-sm leading-6 text-secondary-text">
                A clearer snapshot before you start reading, so it feels easier to choose the right kind of support for the moment.
              </p>

              <div className="mt-5 space-y-3">
                <ResourceMetaItem
                  icon={BookOpenText}
                  label="Format"
                  value={resource.type}
                  accentClass="bg-cyan-100 text-cyan-700"
                />
                <ResourceMetaItem
                  icon={Sparkles}
                  label="Focus area"
                  value={resource.subCategory || resource.category}
                  accentClass="bg-violet-100 text-violet-700"
                />
                <ResourceMetaItem
                  icon={Clock3}
                  label="Length"
                  value={resourceLengthLabel}
                  accentClass="bg-emerald-100 text-emerald-700"
                />
                <ResourceMetaItem
                  icon={UserRound}
                  label="Added by"
                  value={resource.author}
                  accentClass="bg-amber-100 text-amber-700"
                />
              </div>

              <div className="mt-5 rounded-[1.35rem] bg-slate-50/90 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Why save it</p>
                <p className="mt-2 text-sm leading-6 text-secondary-text">
                  Keep useful resources together so you can come back without searching again when you need quick support.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/80 bg-white/55 p-6 shadow-[0_18px_44px_rgba(15,41,66,0.06)] backdrop-blur-sm md:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Resource content</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-primary-text">Read at a calmer pace</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary-text">
                The content stays in a focused reading panel so the page feels less crowded and easier to follow.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-primary-text shadow-[0_10px_18px_rgba(15,41,66,0.04)]">
                {resourceLengthLabel}
              </span>
              <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-primary-text shadow-[0_10px_18px_rgba(15,41,66,0.04)]">
                {resource.author}
              </span>
            </div>
          </div>

          <article className="prose prose-slate mt-7 max-w-none rounded-[1.6rem] bg-white/72 p-5 md:p-7">
            <p>{resource.content}</p>
          </article>
        </section>

        {hasRecommendationContent && (
          <section className="mt-10 rounded-[2.15rem] border border-cyan-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(235,248,255,0.86))] p-6 shadow-[0_20px_48px_rgba(15,41,66,0.07)] backdrop-blur-sm md:p-8">
            <div className="mb-7 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Recommendation feed</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-primary-text">What to open next</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary-text">
                  This space is now split into two clearer lanes so students can quickly choose between similar formats and mood-aware support.
                </p>
              </div>

              <div className="flex flex-col items-start gap-2.5">
                <span className="rounded-full bg-white/92 px-4 py-2 text-xs font-semibold text-primary-text shadow-[0_10px_20px_rgba(15,41,66,0.05)]">
                  Current format: {resource.type}
                </span>
                {!recommendations.moodContext.isFallback && recommendations.moodContext.latestMood && (
                  <span className="rounded-full bg-cyan-100 px-4 py-2 text-xs font-semibold text-cyan-700">
                    Latest mood: {recommendations.moodContext.latestMood}
                  </span>
                )}
                {!recommendations.moodContext.isFallback && recommendations.moodContext.topFactors.length > 0 && (
                  <span className="rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold text-violet-700">
                    Focus: {recommendations.moodContext.topFactors.join(', ')}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <section className="flex min-h-[32rem] flex-col rounded-[1.85rem] border border-white/85 bg-white/78 p-5 shadow-[0_16px_36px_rgba(15,41,66,0.05)]">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <BookOpenText className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">More in this format</p>
                    <h3 className="mt-2 text-xl font-semibold text-primary-text">Resources that feel familiar to use</h3>
                    <p className="mt-2 text-sm leading-6 text-secondary-text">
                      Similar formats help students stay in the same reading or viewing rhythm without re-adjusting.
                    </p>
                  </div>
                  {!isRecommendationsLoading && recommendations.sameType.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-secondary-text">
                      {recommendations.sameType.length} items
                    </span>
                  )}
                </div>

                {isRecommendationsLoading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <RecommendationSkeleton key={`same-type-skeleton-${index + 1}`} />
                    ))}
                  </div>
                ) : recommendations.sameType.length > 0 ? (
                  <div className="rounded-[1.45rem] bg-white/55 p-2.5">
                    <div className="max-h-[24.5rem] overflow-y-auto rounded-[1.2rem] pr-2">
                      <div className="grid grid-cols-1 gap-4">
                        {recommendations.sameType.map((recommendedResource) => (
                          <RecommendationCard
                            key={recommendedResource._id}
                            resource={recommendedResource}
                            currentPath={location.pathname}
                            isSaved={savedResources.some((entry) => entry._id === recommendedResource._id)}
                            onToggleSavedResource={handleToggleSavedResource}
                            onPrefetch={handlePrefetchResource}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-secondary-text">
                    No more resources in this format yet.
                  </div>
                )}
              </section>

              <section className="flex min-h-[32rem] flex-col rounded-[1.85rem] border border-white/85 bg-white/78 p-5 shadow-[0_16px_36px_rgba(15,41,66,0.05)]">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Picked for your recent mood</p>
                    <h3 className="mt-2 text-xl font-semibold text-primary-text">{moodRecommendationLabel}</h3>
                    <p className="mt-2 text-sm leading-6 text-secondary-text">
                      This lane uses recent check-ins when available, and falls back to solid starter picks when mood history is still empty.
                    </p>
                  </div>
                  {!isRecommendationsLoading && recommendations.moodBased.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-secondary-text">
                      {recommendations.moodBased.length} items
                    </span>
                  )}
                </div>

                {isRecommendationsLoading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <RecommendationSkeleton key={`mood-skeleton-${index + 1}`} />
                    ))}
                  </div>
                ) : recommendations.moodBased.length > 0 ? (
                  <div className="rounded-[1.45rem] bg-white/55 p-2.5">
                    <div className="max-h-[24.5rem] overflow-y-auto rounded-[1.2rem] pr-2">
                      <div className="grid grid-cols-1 gap-4">
                        {recommendations.moodBased.map((recommendedResource) => (
                          <RecommendationCard
                            key={recommendedResource._id}
                            resource={recommendedResource}
                            currentPath={location.pathname}
                            isSaved={savedResources.some((entry) => entry._id === recommendedResource._id)}
                            onToggleSavedResource={handleToggleSavedResource}
                            onPrefetch={handlePrefetchResource}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-secondary-text">
                    More personalized recommendations will appear after more resources and mood check-ins are available.
                  </div>
                )}
              </section>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
