import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { getResourceById, getSavedResources, toggleSavedResource } from '../../lib/mentalHealth';

export default function ResourceDetail() {
  const { resourceId } = useParams();
  const [resource, setResource] = useState(null);
  const [savedResources, setSavedResources] = useState(() => getSavedResources());
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getResourceById(resourceId);
        if (!active) return;
        setResource(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load resource');
      }
    })();

    return () => {
      active = false;
    };
  }, [resourceId]);

  if (error) return <div className="pt-36 px-6 text-red-600">{error}</div>;
  if (!resource) return <div className="pt-36 px-6">Loading resource...</div>;

  const isSaved = savedResources.some((entry) => entry._id === resource._id);

  return (
    <div className="pt-36 pb-12 px-6 max-w-4xl mx-auto student-shell">
      <div className="apple-card p-10 border-none bg-white/70 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">{resource.type} â€¢ {resource.category}</p>
            <h1 className="text-5xl font-semibold tracking-tight text-primary-text mt-4">{resource.title}</h1>
            <p className="text-lg text-secondary-text mt-4">{resource.description}</p>
          </div>
          <button
            onClick={() => setSavedResources(toggleSavedResource(resource))}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold ${isSaved ? 'bg-amber-100 text-amber-700' : 'bg-secondary-bg text-primary-text'}`}
          >
            <Bookmark className="w-4 h-4" />
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>

        {resource.videoUrl && (
          <a href={resource.videoUrl} target="_blank" rel="noreferrer" className="inline-flex mb-8 px-5 py-3 bg-accent-primary text-white rounded-full font-bold text-sm">
            Open linked video
          </a>
        )}

        <article className="prose prose-slate max-w-none">
          <p>{resource.content}</p>
        </article>

        <Link to="/mental-health/resources" className="inline-flex mt-10 text-sm font-semibold text-accent-primary">
          Back to library
        </Link>
      </div>
    </div>
  );
}

