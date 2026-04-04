import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { buildMoodSuggestions, getMentalHealthResources, getMoodStats, getSavedResources } from '../../lib/mentalHealth';

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [savedResources, setSavedResources] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [stats, resources] = await Promise.all([getMoodStats(), getMentalHealthResources({ limit: 12 })]);
        if (!active) return;
        const resourceList = Array.isArray(resources) ? resources : [];
        setSuggestions(buildMoodSuggestions({ stats, resources: resourceList }));
        setSavedResources(getSavedResources());
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load suggestions');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="pt-36 pb-12 px-6 max-w-6xl mx-auto student-shell">
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest mb-6">
          <Sparkles className="w-3 h-3" />
          Personalized Suggestions
        </div>
        <h1 className="text-5xl font-semibold tracking-tight text-primary-text">Recommended support</h1>
        <p className="text-lg text-secondary-text mt-4 max-w-3xl">
          Suggestions are based on your recent mood history plus the wellness content already published in the platform.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <section className="xl:col-span-2 space-y-4">
          {suggestions.map((resource) => (
            <Link key={resource._id} to={`/mental-health/resources/${resource._id}`} className="apple-card p-6 border-none bg-white/70 backdrop-blur-sm flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary-text">{resource.title}</h2>
                <p className="text-sm text-secondary-text mt-2">{resource.type} â€¢ {resource.category}</p>
                <p className="text-sm text-primary-text/80 mt-3">{resource.description}</p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            </Link>
          ))}
          {!suggestions.length && <p className="text-secondary-text">Suggestions will appear after more mood data is available.</p>}
        </section>

        <aside className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm h-fit">
          <h2 className="text-2xl font-semibold text-primary-text mb-6">Saved resources</h2>
          <div className="space-y-3">
            {savedResources.length === 0 ? (
              <p className="text-sm text-secondary-text">Save articles and videos from the library to revisit them here.</p>
            ) : (
              savedResources.map((resource) => (
                <Link key={resource._id} to={`/mental-health/resources/${resource._id}`} className="block rounded-2xl bg-secondary-bg/70 px-5 py-4">
                  <p className="font-semibold text-primary-text">{resource.title}</p>
                  <p className="text-sm text-secondary-text mt-1">{resource.type}</p>
                </Link>
              ))
            )}
          </div>
        </aside>
      </div>

      {error && <p className="text-red-600 mt-8">{error}</p>}
    </div>
  );
}

