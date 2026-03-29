import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, Heart, History, Search } from 'lucide-react';
import { getProviders } from '../../lib/providers';

export default function CounselorDirectory() {
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getProviders({ role: 'counselor' });
        if (!active) return;
        setProviders(Array.isArray(data?.providers) ? data.providers : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load counselors');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filteredProviders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const next = providers.filter((provider) => (
      !query
      || provider.name.toLowerCase().includes(query)
      || (provider.specialty || '').toLowerCase().includes(query)
    ));

    return [...next].sort((left, right) => {
      if (sortBy === 'name-desc') {
        return right.name.localeCompare(left.name);
      }

      if (sortBy === 'experience-desc') {
        return (right.experience || 0) - (left.experience || 0);
      }

      if (sortBy === 'specialty-asc') {
        return (left.specialty || '').localeCompare(right.specialty || '');
      }

      return left.name.localeCompare(right.name);
    });
  }, [providers, searchQuery, sortBy]);

  return (
    <div className="pt-36 pb-12 px-6 max-w-7xl mx-auto min-h-screen bg-primary-bg">
      <header className="mb-12">
        <h1 className="text-5xl font-semibold tracking-tight text-primary-text">Counselors Directory</h1>
        <p className="text-lg text-secondary-text mt-4 max-w-3xl">Browse counselors, view their specialties, and move straight into booking a confidential session.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/mental-health/sessions"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-accent-purple text-white font-bold shadow-sm"
          >
            <History className="w-4 h-4" />
            View My Counseling History
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr),280px] gap-4 max-w-4xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm rounded-2xl outline-none"
              placeholder="Search counselors or specialties"
            />
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm rounded-2xl outline-none appearance-none text-primary-text"
            >
              <option value="name-asc">Sort: Name A-Z</option>
              <option value="name-desc">Sort: Name Z-A</option>
              <option value="experience-desc">Sort: Most Experience</option>
              <option value="specialty-asc">Sort: Specialty</option>
            </select>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProviders.map((provider) => (
          <article key={provider._id} className="apple-card p-7 border-none bg-white/70 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl font-bold mb-6">
              {provider.name?.[0] || 'C'}
            </div>
            <h2 className="text-2xl font-semibold text-primary-text">{provider.name}</h2>
            <p className="text-secondary-text mt-2">{provider.specialty || 'Counselor'}</p>
            <p className="text-sm text-primary-text/80 mt-5 leading-relaxed min-h-20">{provider.bio || 'Confidential student wellness support and structured follow-up care.'}</p>
            <div className="mt-8 flex items-center justify-between gap-4">
              <Link to={`/mental-health/counselors/${provider._id}`} className="text-sm font-semibold text-accent-primary">View Profile</Link>
              <Link to={`/mental-health/book/${provider._id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-purple text-white text-sm font-bold">
                <Heart className="w-4 h-4" />
                Book
              </Link>
            </div>
          </article>
        ))}
      </div>

      {!error && filteredProviders.length === 0 && (
        <div className="mt-10 apple-card p-10 border-none bg-white/70 backdrop-blur-sm text-center">
          <h2 className="text-2xl font-semibold text-primary-text">No results found</h2>
          <p className="text-secondary-text mt-3">
            Try another counselor name, specialty, or sorting option.
          </p>
        </div>
      )}

      {error && <p className="text-red-600 mt-8">{error}</p>}
    </div>
  );
}
