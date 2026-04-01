import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Search } from 'lucide-react';
import { getResources, getSavedResources, toggleSavedResource } from '../../lib/mentalHealth';

export default function ResourceLibrary() {
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedResources, setSavedResources] = useState(() => getSavedResources());
  const [activeFilter, setActiveFilter] = useState('All');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getResources({ category: 'Mental Health', limit: 24 });
        if (!active) return;
        setResources(Array.isArray(data?.resources) ? data.resources : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load resources');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filteredResources = useMemo(() => resources.filter((resource) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query
      || resource.title.toLowerCase().includes(query)
      || resource.description.toLowerCase().includes(query)
      || resource.type.toLowerCase().includes(query);
    const matchesFilter = activeFilter === 'All'
      || (activeFilter === 'Saved' && savedResources.some((entry) => entry._id === resource._id))
      || resource.type === activeFilter;
    return matchesSearch && matchesFilter;
  }), [activeFilter, resources, savedResources, searchQuery]);

  return (
    <div className="pt-36 pb-12 px-6 max-w-7xl mx-auto min-h-screen bg-primary-bg">
      <header className="mb-12">
        <h1 className="text-5xl font-semibold tracking-tight text-primary-text">Self-help library</h1>
        <p className="text-lg text-secondary-text mt-4 max-w-3xl">
          Explore counselor-approved articles, videos, guides, and exercises for everyday support.
        </p>

        <div className="mt-8 relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm rounded-2xl outline-none"
            placeholder="Search articles, guides, videos, or coping exercises"
          />
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredResources.map((resource) => {
          const isSaved = savedResources.some((entry) => entry._id === resource._id);
          return (
            <article key={resource._id} className="apple-card p-7 border-none bg-white/70 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">{resource.type}</p>
              <h2 className="text-2xl font-semibold text-primary-text mt-4">{resource.title}</h2>
              <p className="text-sm text-secondary-text mt-4 leading-relaxed">{resource.description}</p>
              <div className="flex items-center justify-between gap-4 mt-8">
                <Link to={`/mental-health/resources/${resource._id}`} className="text-sm font-semibold text-accent-primary">
                  Open resource
                </Link>
                <button
                  onClick={() => setSavedResources(toggleSavedResource(resource))}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${isSaved ? 'bg-amber-100 text-amber-700' : 'bg-secondary-bg text-primary-text'}`}
                >
                  <Bookmark className="w-4 h-4" />
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!error && filteredResources.length === 0 && (
        <div className="mt-10 apple-card p-8 border-none bg-white/70 backdrop-blur-sm text-secondary-text">
          No self-help resources match this search yet.
        </div>
      )}

      {error && <p className="text-red-600 mt-8">{error}</p>}
    </div>
  );
}
