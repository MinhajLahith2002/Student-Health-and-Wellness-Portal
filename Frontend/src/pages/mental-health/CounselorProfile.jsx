import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, Shield } from 'lucide-react';
import { getProviderAvailability, getProviderById } from '../../lib/providers';
import { getPreferredCounselors, togglePreferredCounselor } from '../../lib/mentalHealth';

export default function CounselorProfile() {
  const { counselorId } = useParams();
  const [provider, setProvider] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [preferred, setPreferred] = useState(() => getPreferredCounselors());
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);

    (async () => {
      try {
        const [profile, schedule] = await Promise.all([
          getProviderById(counselorId),
          getProviderAvailability(counselorId, targetDate.toISOString().slice(0, 10))
        ]);
        if (!active) return;
        setProvider(profile);
        setAvailability(Array.isArray(schedule?.availableSlots) ? schedule.availableSlots : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load counselor profile');
      }
    })();

    return () => {
      active = false;
    };
  }, [counselorId]);

  if (error) return <div className="pt-36 px-6 text-red-600">{error}</div>;
  if (!provider) return <div className="pt-36 px-6">Loading counselor profile...</div>;

  const isPreferred = preferred.some((entry) => entry._id === provider._id);

  return (
    <div className="pt-36 pb-12 px-6 max-w-5xl mx-auto min-h-screen bg-primary-bg">
      <div className="apple-card p-10 border-none bg-white/70 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-start justify-between">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-[10px] uppercase tracking-[0.2em] font-bold mb-5">
              <Shield className="w-3 h-3" />
              Confidential care
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-primary-text">{provider.name}</h1>
            <p className="text-lg text-secondary-text mt-3">{provider.specialty || 'Counselor'}</p>
            <p className="text-primary-text/80 leading-relaxed mt-6 max-w-3xl">{provider.bio || 'Support with stress, anxiety, burnout, and healthy emotional coping strategies.'}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setPreferred(togglePreferredCounselor(provider))}
              className={`px-5 py-3 rounded-full text-sm font-bold ${isPreferred ? 'bg-amber-100 text-amber-700' : 'bg-secondary-bg text-primary-text'}`}
            >
              {isPreferred ? 'Preferred Counselor' : 'Save Counselor'}
            </button>
            <Link to={`/mental-health/book/${provider._id}`} className="px-5 py-3 rounded-full bg-accent-purple text-white text-sm font-bold text-center">
              Book Session
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          <div className="rounded-2xl bg-secondary-bg/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-2">Specialty</p>
            <p className="font-semibold text-primary-text">{provider.specialty || 'Counselor'}</p>
          </div>
          <div className="rounded-2xl bg-secondary-bg/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-2">Experience</p>
            <p className="font-semibold text-primary-text">{provider.experience ? `${provider.experience} years` : 'Available'}</p>
          </div>
          <div className="rounded-2xl bg-secondary-bg/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-2">Next open slots</p>
            <p className="font-semibold text-primary-text">{availability.slice(0, 2).join(', ') || 'Check booking page'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
