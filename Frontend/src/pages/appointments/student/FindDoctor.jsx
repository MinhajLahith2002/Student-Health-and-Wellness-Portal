import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Filter, Search, Shield, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { getProviders } from '../../../lib/providers';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { LoadingState } from '../../../components/LoadingState';

export default function FindDoctor() {
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // PHASE 3: Refetch function for error recovery
  const fetchDoctors = useCallback(async () => {
    let active = true;
    try {
      setLoading(true);
      setError('');
      const data = await getProviders({ role: 'doctor' });
      if (!active) return;
      setProviders(Array.isArray(data?.providers) ? data.providers : []);
    } catch (err) {
      if (!active) return;
      setError(err.message || 'Failed to load doctors');
      console.error('FindDoctor fetch error:', err);
    } finally {
      if (active) setLoading(false);
    }
    return () => {
      active = false;
    };
  }, []);

  // PHASE 3: Auto-fetch on mount
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const specialties = useMemo(() => {
    const list = providers.map((provider) => provider.specialty).filter(Boolean);
    return ['All Specialties', ...new Set(list)];
  }, [providers]);

  const filteredDoctors = useMemo(() => providers.filter((doctor) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || doctor.name.toLowerCase().includes(query) || (doctor.specialty || '').toLowerCase().includes(query);
    const matchesSpecialty = selectedSpecialty === 'All Specialties' || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  }), [providers, searchQuery, selectedSpecialty]);

  return (
    <ErrorBoundary>
      <div className="student-shell pb-20">
      <div className="student-hero pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-primary-text tracking-tight">Find a Doctor</h1>
          <p className="text-secondary-text mt-2 text-lg">Search doctors, compare specialties, and move directly into booking.</p>

          <div className="mt-10 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
              <input
                type="text"
                placeholder="Search by name or specialty..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#edf5f8] border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
              />
            </div>
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
              <select
                value={selectedSpecialty}
                onChange={(event) => setSelectedSpecialty(event.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#edf5f8] border-none rounded-2xl text-sm font-bold text-primary-text outline-none focus:ring-2 focus:ring-blue-600/20 appearance-none"
              >
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredDoctors.map((doctor) => (
            <motion.div
              key={doctor._id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -8 }}
              className="student-surface shadow-sm hover:shadow-xl transition-all overflow-hidden"
            >
              <div className="p-8">
                <div className="flex gap-5 mb-6">
                  <div className="relative">
                    {doctor.profileImage ? (
                      <img
                        src={doctor.profileImage}
                        alt={doctor.name}
                        className="w-20 h-20 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-[#e8f4f8] text-accent-primary flex items-center justify-center text-2xl font-bold">
                        {doctor.name?.[0] || 'D'}
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent-green border-4 border-white rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-primary-text">{doctor.name}</h3>
                    <p className="text-secondary-text font-medium">{doctor.specialty || 'General Physician'}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-primary-text">Verified</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="text-sm text-secondary-text">
                    {doctor.experience ? `${doctor.experience} years experience` : 'Campus medical provider'}
                  </div>
                  <p className="text-sm text-primary-text leading-relaxed min-h-16">
                    {doctor.bio || 'Professional support for common student health needs and follow-up care.'}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-accent-primary font-semibold">
                    <Calendar className="w-4 h-4" />
                    Bookable with live slot lookup
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    to={`/student/appointments/doctors/${doctor._id}`}
                    className="flex-1 py-4 bg-[#edf5f8] text-primary-text rounded-2xl font-bold text-sm text-center hover:bg-[#EBEBEF] transition-all"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/student/appointments/book/${doctor._id}`}
                    className="flex-1 py-4 bg-accent-primary text-white rounded-2xl font-bold text-sm text-center hover:bg-[#105f72] transition-all shadow-lg shadow-blue-100"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {loading && <LoadingState message="Loading doctors..." />}

        {error && (
          <div className="mt-10 max-w-md mx-auto rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 font-semibold mb-4">{error}</p>
            <button
              onClick={() => fetchDoctors()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredDoctors.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-[#edf5f8] rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-secondary-text" />
            </div>
            <h3 className="text-2xl font-bold text-primary-text">No doctors found</h3>
            <p className="text-secondary-text mt-2">Try another search or remove a filter to see more doctors.</p>
          </div>
        )}
      </div>
      </div>
    </ErrorBoundary>
  );
}


