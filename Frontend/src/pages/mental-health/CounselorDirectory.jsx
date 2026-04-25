import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CalendarDays, HeartHandshake, Search, Star } from 'lucide-react';
import DismissibleBanner from '../../components/DismissibleBanner';
import {
  getCachedCounselors,
  getCounselors,
  prefetchCounselorProfile,
  prefetchCounselorSlots,
  subscribeCounselingLiveRefresh
} from '../../lib/counseling';
import { cn } from '../../lib/utils';

function formatSlot(slot) {
  if (!slot?.date || !slot?.time) return 'Slots coming soon';
  return `${new Date(slot.date).toLocaleDateString()} at ${slot.time}`;
}


function validateSearchQuery(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /[^A-Za-z0-9\s&/,'().-]/.test(trimmed)
    ? 'Search can include letters, numbers, spaces, and common punctuation only.'
    : '';
}

export default function CounselorDirectory() {
  const cachedDirectory = getCachedCounselors();
  const [providers, setProviders] = useState(() => Array.isArray(cachedDirectory?.providers) ? cachedDirectory.providers : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('All areas');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => !Array.isArray(cachedDirectory?.providers));

  function handlePrefetchCounselor(providerId) {
    prefetchCounselorProfile(providerId).catch(() => {});
    prefetchCounselorSlots(providerId, { date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10) }).catch(() => {});
  }

  useEffect(() => {
    let active = true;

    const loadDirectory = async ({ silent = false } = {}) => {
      try {
        const data = await getCounselors();
        if (!active) return;
        setProviders(Array.isArray(data?.providers) ? data.providers : []);
        if (!silent) {
          setError('');
        }
      } catch (err) {
        if (!active) return;
        if (!silent) {
          setError(err.message || 'Failed to load counselors');
        }
      } finally {
        if (active && !silent) setLoading(false);
      }
    };

    loadDirectory();

    const refreshDirectory = () => {
      loadDirectory({ silent: true });
    };

    const unsubscribeLiveRefresh = subscribeCounselingLiveRefresh(refreshDirectory);

    const handleWindowFocus = () => {
      refreshDirectory();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshDirectory();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      unsubscribeLiveRefresh();
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const specialtyOptions = useMemo(() => (
    ['All areas', ...new Set(
      providers
        .map((provider) => provider.specialty?.trim())
        .filter(Boolean)
    )]
  ), [providers]);

  const filteredProviders = useMemo(() => {
    const query = searchError ? '' : searchQuery.trim().toLowerCase();
    return providers.filter((provider) => (
      (
        !query
        || provider.name?.toLowerCase().includes(query)
        || provider.specialty?.toLowerCase().includes(query)
        || provider.bio?.toLowerCase().includes(query)
      )
      && (availabilityFilter !== 'open' || Number(provider.openSlotCount || 0) > 0)
      && (specialtyFilter === 'All areas' || provider.specialty === specialtyFilter)
    ));
  }, [availabilityFilter, providers, searchError, searchQuery, specialtyFilter]);

  const hasActiveFilters = searchQuery.trim().length > 0 || availabilityFilter !== 'all' || specialtyFilter !== 'All areas';

  return (
    <div className="pharmacy-shell pt-36 pb-16 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="pharmacy-hero">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <span className="pharmacy-pill bg-emerald-50 text-emerald-700">Counselor Directory</span>
              <h1 className="mt-5 text-5xl font-semibold tracking-tight text-primary-text">Book from counselor-created open slots.</h1>
              <p className="mt-4 text-lg text-secondary-text">
                Browse licensed campus counselors, compare specialties and recent feedback, then reserve one of the open slots they have already published.
              </p>
            </div>

            <Link to="/mental-health" className="pharmacy-secondary w-full justify-center lg:w-auto lg:shrink-0">
              <ArrowLeft className="w-4 h-4" />
              Back to mental health
            </Link>
          </div>

          <div className="mt-8 rounded-[2rem] bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,41,66,0.06)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Quick filters</p>
                <p className="mt-2 text-sm text-secondary-text">Use these to narrow by open availability or support area.</p>
              </div>
              <Link to="/mental-health/sessions" className="pharmacy-secondary w-full justify-center lg:w-auto">
                <CalendarDays className="w-4 h-4" />
                My Sessions
              </Link>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)] xl:items-end">
              <label className="relative block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSearchQuery(nextValue);
                    setSearchError(validateSearchQuery(nextValue));
                  }}
                  className={cn('pharmacy-search', searchError && 'border-red-300 ring-2 ring-red-200')}
                  placeholder="Search counselor, specialty, or support area"
                />
                {searchError && <p className="mt-2 text-sm text-red-600">{searchError}</p>}
              </label>

              <div className="flex flex-col gap-4 rounded-[1.5rem] bg-secondary-bg/70 p-4 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: 'All counselors' },
                    { id: 'open', label: 'Open slots only' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAvailabilityFilter(option.id)}
                      className={cn(
                        'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                        availabilityFilter === option.id
                          ? 'bg-accent-primary text-white shadow-[0_12px_24px_rgba(15,41,66,0.1)]'
                          : 'bg-secondary-bg text-secondary-text'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="flex min-w-[15rem] flex-1 flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Support area</span>
                    <select
                      value={specialtyFilter}
                      onChange={(event) => setSpecialtyFilter(event.target.value)}
                      className="rounded-2xl bg-white px-4 py-3 text-sm text-primary-text outline-none"
                    >
                      {specialtyOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchError('');
                        setAvailabilityFilter('all');
                        setSpecialtyFilter('All areas');
                      }}
                      className="rounded-2xl px-4 py-3 text-sm font-semibold text-accent-primary transition-colors hover:bg-white"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pharmacy-panel overflow-hidden p-0">
          <div className="flex items-center justify-between gap-4 border-b border-white/70 px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Counselor results</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-primary-text">Browse available support in one place</h2>
            </div>
            <span className="pharmacy-pill bg-slate-100 text-slate-600">
              {loading ? 'Loading' : `${filteredProviders.length} result${filteredProviders.length === 1 ? '' : 's'}`}
            </span>
          </div>

          <div className="max-h-[58rem] overflow-y-auto px-6 py-6">
            {loading ? (
              <section className="text-secondary-text">Loading counselor directory...</section>
            ) : filteredProviders.length > 0 ? (
              <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredProviders.map((provider) => (
                  <article key={provider._id} className="pharmacy-card flex h-full flex-col p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold">
                        {provider.name?.[0] || 'C'}
                      </div>
                      <span className={cn(
                        'pharmacy-pill',
                        provider.openSlotCount > 0 ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500'
                      )}>
                        {provider.openSlotCount} Open Slot{provider.openSlotCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    <h2 className="mt-6 text-2xl font-semibold text-primary-text">{provider.name}</h2>
                    <p className="mt-2 text-secondary-text">{provider.specialty || 'Counselor'}</p>
                    <p className="mt-4 text-sm leading-6 text-secondary-text min-h-24">
                      {provider.bio || 'Confidential student support for stress, anxiety, and healthy coping routines.'}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="pharmacy-soft-card p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Rating</p>
                        <div className="mt-2 flex items-center gap-2 text-primary-text">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                          <span className="font-semibold">{provider.averageRating}</span>
                          <span className="text-sm text-secondary-text">({provider.reviewCount})</span>
                        </div>
                      </div>
                      <div className="pharmacy-soft-card p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Next slot</p>
                        <p className="mt-2 text-sm font-semibold text-primary-text">{formatSlot(provider.nextOpenSlot)}</p>
                      </div>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                      <Link
                        to={`/mental-health/counselors/${provider._id}`}
                        onMouseEnter={() => handlePrefetchCounselor(provider._id)}
                        onFocus={() => handlePrefetchCounselor(provider._id)}
                        className="pharmacy-secondary w-full px-3 text-center"
                      >
                        View Profile
                      </Link>
                      <Link
                        to={`/mental-health/book/${provider._id}`}
                        onMouseEnter={() => handlePrefetchCounselor(provider._id)}
                        onFocus={() => handlePrefetchCounselor(provider._id)}
                        className="pharmacy-primary w-full px-3 text-center"
                      >
                        <HeartHandshake className="w-4 h-4" />
                        Book Slot
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            ) : (
              <section className="rounded-[2rem] bg-white/80 px-8 py-10 text-center">
                <h2 className="text-2xl font-semibold text-primary-text">No counselors match that search.</h2>
                <p className="mt-3 text-secondary-text">Try a different name, specialty, or support keyword.</p>
              </section>
            )}
          </div>
        </section>

        <DismissibleBanner
          message={error}
          tone="error"
          onClose={() => setError('')}
          autoHideMs={0}
        />

      </div>
    </div>
  );
}
