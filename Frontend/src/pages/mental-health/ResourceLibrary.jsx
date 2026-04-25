import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Bookmark, BookmarkCheck, Search } from 'lucide-react';
import {
  getCachedResources,
  getResources,
  getSavedResources,
  prefetchResourceRecommendations,
  prefetchResourceById,
  primeResourceDetailCache,
  toggleSavedResource
} from '../../lib/mentalHealth';
import { getResourceTypePresentation } from '../../lib/resourcePresentation';

export default function ResourceLibrary() {
  const location = useLocation();
  const isCounselorSavedView = location.pathname.startsWith('/counselor/resources');
  const cachedLibrary = getCachedResources({ category: 'Mental Health', limit: 24 });
  const initialResources = Array.isArray(cachedLibrary?.resources) ? cachedLibrary.resources : [];
  const [resources, setResources] = useState(initialResources);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [savedResources, setSavedResources] = useState(() => getSavedResources());
  const [activeFilter, setActiveFilter] = useState(() => location.state?.initialFilter || 'All');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => initialResources.length === 0);

  const counselorBackLink = useMemo(() => {
    const backTo = location.state?.backTo;
    const backLabel = location.state?.backLabel;

    if (typeof backTo === 'string' && backTo.startsWith('/')) {
      return {
        to: backTo,
        label: typeof backLabel === 'string' ? backLabel : 'Back'
      };
    }

    if (isCounselorSavedView) {
      return {
        to: '/counselor/resources',
        label: 'Back to counselor resources'
      };
    }

    return null;
  }, [isCounselorSavedView, location.state]);

  const detailBackLink = useMemo(() => {
    if (isCounselorSavedView) {
      return {
        to: '/counselor/resources/saved',
        label: 'Back to saved library'
      };
    }

    return {
      to: '/mental-health/resources',
      label: 'Back to library'
    };
  }, [isCounselorSavedView]);

  const detailPathPrefix = isCounselorSavedView ? '/counselor/resources' : '/mental-health/resources';

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getResources({ category: 'Mental Health', limit: 24 });
        if (!active) return;
        setResources(Array.isArray(data?.resources) ? data.resources : []);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load resources');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filteredResources = useMemo(() => resources.filter((resource) => {
    const query = searchQuery.trim().toLowerCase();
    if (searchError) return false;
    const matchesSearch = !query
      || resource.title.toLowerCase().includes(query)
      || resource.description.toLowerCase().includes(query)
      || resource.type.toLowerCase().includes(query);
    const matchesFilter = activeFilter === 'All'
      || (activeFilter === 'Saved' && savedResources.some((entry) => entry._id === resource._id))
      || resource.type === activeFilter;
    return matchesSearch && matchesFilter;
  }), [activeFilter, resources, savedResources, searchQuery]);
  const hasFilteredResources = filteredResources.length > 0;

  function handlePrefetchResource(resource) {
    primeResourceDetailCache(resource);
    prefetchResourceById(resource._id).catch(() => {});
    prefetchResourceRecommendations(resource._id).catch(() => {});
  }

  function handleSearchChange(event) {
    const nextValue = event.target.value;
    const allowedPattern = /^[a-zA-Z0-9\s&',.\-()/]*$/;

    setSearchQuery(nextValue);

    if (!nextValue.trim()) {
      setSearchError('');
      return;
    }

    if (!allowedPattern.test(nextValue)) {
      setSearchError('Use letters, numbers, spaces, and only these symbols: & \' , . - ( ) /.');
      return;
    }

    if (nextValue.trim().length < 2) {
      setSearchError('Enter at least 2 characters to search.');
      return;
    }

    setSearchError('');
  }

  if (isCounselorSavedView) {
    return (
      <div className="pharmacy-shell min-h-screen pb-16">
        <div className="mx-auto max-w-6xl space-y-6 px-8 pt-4">
          <section className="pharmacy-hero">
            <h1 className="text-5xl font-semibold tracking-tight text-primary-text">Saved self-help library</h1>
            <p className="mt-4 max-w-3xl text-lg text-secondary-text">
              Review the mental-health resources you saved, without losing your counselor workflow.
            </p>

            {counselorBackLink && (
              <div className="mt-6 flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/70 p-5 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Saved resources</p>
                  <p className="mt-2 text-sm leading-6 text-secondary-text">
                    You are viewing the student self-help library in the <span className="font-semibold text-primary-text">Saved</span> view, so you can quickly review the resources you bookmarked from counselor resources.
                  </p>
                </div>
                <Link
                  to={counselorBackLink.to}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary-text shadow-[0_10px_22px_rgba(15,41,66,0.05)] transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {counselorBackLink.label}
                </Link>
              </div>
            )}
          </section>

          <section className="pharmacy-panel p-6">
            <div className="mt-0 relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className={`w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm rounded-2xl outline-none border ${
                  searchError ? 'border-rose-300 focus:ring-4 focus:ring-rose-100' : 'border-white/70 focus:ring-4 focus:ring-accent-primary/10'
                }`}
                placeholder="Search articles, guides, videos, or coping exercises like stress-relief"
              />
            </div>
            {searchError ? (
              <p className="mt-2 text-sm text-rose-600">{searchError}</p>
            ) : (
              <p className="mt-2 text-sm text-secondary-text">
                Try keywords like <span className="font-semibold text-primary-text">sleep</span>, <span className="font-semibold text-primary-text">burnout</span>, or <span className="font-semibold text-primary-text">stress-relief</span>.
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              {['All', 'Saved', 'Article', 'Video', 'Guide', 'Infographic'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${activeFilter === filter ? 'bg-accent-primary text-white' : 'bg-white/70 text-secondary-text'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </section>

          {hasFilteredResources && (
            <section className="pharmacy-panel overflow-hidden p-4">
              <div className="max-h-[44rem] overflow-y-auto rounded-[1.6rem] pr-2">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredResources.map((resource) => {
                    const isSaved = savedResources.some((entry) => entry._id === resource._id);
                    const presentation = getResourceTypePresentation(resource.type);
                    const ResourceIcon = presentation.icon;
                    return (
                      <article key={resource._id} className="apple-card h-full p-7 border-none bg-white/70 backdrop-blur-sm flex flex-col">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${presentation.badgeClass}`}>
                            <ResourceIcon className="h-5 w-5" />
                          </span>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">{resource.type}</p>
                        </div>
                        <h2 className="text-2xl font-semibold text-primary-text mt-4">{resource.title}</h2>
                        <p className="text-sm text-secondary-text mt-4 leading-relaxed">{resource.description}</p>
                        <div className="mt-auto pt-8 flex flex-nowrap items-center justify-between gap-3">
                          <Link
                            to={`${detailPathPrefix}/${resource._id}`}
                            state={{
                              backTo: detailBackLink.to,
                              backLabel: detailBackLink.label,
                              resourcePreview: resource
                            }}
                            onMouseEnter={() => handlePrefetchResource(resource)}
                            onFocus={() => handlePrefetchResource(resource)}
                            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-accent-primary transition-colors hover:bg-cyan-100"
                          >
                            <span>Open resource</span>
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setSavedResources(toggleSavedResource(resource))}
                            className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold ${isSaved ? 'bg-amber-100 text-amber-700' : 'bg-secondary-bg text-primary-text'}`}
                          >
                            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                            {isSaved ? 'Saved' : 'Save'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {!error && !loading && !hasFilteredResources && (
            <section className="pharmacy-panel p-8 text-secondary-text">
              No self-help resources match this search yet.
            </section>
          )}

          {loading && (
            <section className="pharmacy-panel p-8 text-secondary-text">
              Loading self-help resources...
            </section>
          )}

          {error && <p className="text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-36 pb-12 px-6 max-w-7xl mx-auto student-shell">
      <header className="mb-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight text-primary-text">
              {isCounselorSavedView ? 'Saved self-help library' : 'Self-help library'}
            </h1>
            <p className="text-lg text-secondary-text mt-4 max-w-3xl">
              {isCounselorSavedView
                ? 'Review the mental-health resources you saved, without losing your counselor workflow.'
                : 'Explore counselor-approved articles, videos, guides, and exercises for everyday support.'}
            </p>
          </div>

          <Link
            to="/mental-health"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary-text shadow-[0_10px_22px_rgba(15,41,66,0.05)] transition hover:-translate-y-0.5 hover:bg-slate-50 lg:w-auto lg:shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to mental health
          </Link>
        </div>

        {counselorBackLink && (
          <div className="mt-6 flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/70 p-5 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Saved resources</p>
              <p className="mt-2 text-sm leading-6 text-secondary-text">
                You are viewing the student self-help library in the <span className="font-semibold text-primary-text">Saved</span> view, so you can quickly review the resources you bookmarked from counselor resources.
              </p>
            </div>
            <Link
              to={counselorBackLink.to}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary-text shadow-[0_10px_22px_rgba(15,41,66,0.05)] transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {counselorBackLink.label}
            </Link>
          </div>
        )}

        <div className="mt-8 relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className={`w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm rounded-2xl outline-none border ${
              searchError ? 'border-rose-300 focus:ring-4 focus:ring-rose-100' : 'border-white/70 focus:ring-4 focus:ring-accent-primary/10'
            }`}
            placeholder="Search articles, guides, videos, or coping exercises like stress-relief"
          />
        </div>
        {searchError ? (
          <p className="mt-2 text-sm text-rose-600">{searchError}</p>
        ) : (
          <p className="mt-2 text-sm text-secondary-text">
            Try keywords like <span className="font-semibold text-primary-text">sleep</span>, <span className="font-semibold text-primary-text">burnout</span>, or <span className="font-semibold text-primary-text">stress-relief</span>.
          </p>
        )}
        <div className="flex flex-wrap gap-3 mt-5">
          {['All', 'Saved', 'Article', 'Video', 'Guide', 'Infographic'].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${activeFilter === filter ? 'bg-accent-primary text-white' : 'bg-white/70 text-secondary-text'}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {hasFilteredResources && (
        <div className="rounded-[2rem] border border-white/80 bg-white/45 p-4 shadow-[0_18px_44px_rgba(15,41,66,0.06)] backdrop-blur-sm">
          <div className="max-h-[44rem] overflow-y-auto rounded-[1.6rem] pr-2">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredResources.map((resource) => {
                const isSaved = savedResources.some((entry) => entry._id === resource._id);
                const presentation = getResourceTypePresentation(resource.type);
                const ResourceIcon = presentation.icon;
                return (
                  <article key={resource._id} className="apple-card h-full p-7 border-none bg-white/70 backdrop-blur-sm flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${presentation.badgeClass}`}>
                        <ResourceIcon className="h-5 w-5" />
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">{resource.type}</p>
                    </div>
                    <h2 className="text-2xl font-semibold text-primary-text mt-4">{resource.title}</h2>
                    <p className="text-sm text-secondary-text mt-4 leading-relaxed">{resource.description}</p>
                    <div className="mt-auto pt-8 flex flex-nowrap items-center justify-between gap-3">
                      <Link
                        to={`${detailPathPrefix}/${resource._id}`}
                        state={{
                          backTo: detailBackLink.to,
                          backLabel: detailBackLink.label,
                          resourcePreview: resource
                        }}
                        onMouseEnter={() => handlePrefetchResource(resource)}
                        onFocus={() => handlePrefetchResource(resource)}
                        className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-accent-primary transition-colors hover:bg-cyan-100"
                      >
                        <span>Open resource</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setSavedResources(toggleSavedResource(resource))}
                        className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold ${isSaved ? 'bg-amber-100 text-amber-700' : 'bg-secondary-bg text-primary-text'}`}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!error && !loading && !hasFilteredResources && (
        <div className="mt-10 apple-card p-8 border-none bg-white/70 backdrop-blur-sm text-secondary-text">
          No self-help resources match this search yet.
        </div>
      )}

      {loading && (
        <div className="mt-10 apple-card p-8 border-none bg-white/70 backdrop-blur-sm text-secondary-text">
          Loading self-help resources...
        </div>
      )}

      {error && <p className="text-red-600 mt-8">{error}</p>}
    </div>
  );
}

