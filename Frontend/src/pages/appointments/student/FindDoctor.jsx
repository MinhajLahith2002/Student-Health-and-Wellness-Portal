import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Filter, Search, Shield, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { getProviders } from '../../../lib/providers';

export default function FindDoctor() {
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const data = await getProviders({ role: 'doctor' });
        if (!active) return;
        setProviders(Array.isArray(data?.providers) ? data.providers : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load doctors');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

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
    <div className="min-h-screen bg-[#FCFCFC] pb-20">
      <div className="bg-white border-b border-[#F0F0F3] pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-[#18181B] tracking-tight">Find a Doctor</h1>
          <p className="text-[#71717A] mt-2 text-lg">Search doctors, compare specialties, and move directly into booking.</p>

          <div className="mt-10 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
              <input
                type="text"
                placeholder="Search by name or specialty..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#F4F4F8] border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
              />
            </div>
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
              <select
                value={selectedSpecialty}
                onChange={(event) => setSelectedSpecialty(event.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#F4F4F8] border-none rounded-2xl text-sm font-bold text-[#18181B] outline-none focus:ring-2 focus:ring-blue-600/20 appearance-none"
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
              className="bg-white rounded-[32px] border border-[#F0F0F3] shadow-sm hover:shadow-xl transition-all overflow-hidden"
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
                      <div className="w-20 h-20 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center text-2xl font-bold">
                        {doctor.name?.[0] || 'D'}
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-[#18181B]">{doctor.name}</h3>
                    <p className="text-[#71717A] font-medium">{doctor.specialty || 'General Physician'}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-[#18181B]">Verified</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="text-sm text-[#71717A]">
                    {doctor.experience ? `${doctor.experience} years experience` : 'Campus medical provider'}
                  </div>
                  <p className="text-sm text-[#18181B] leading-relaxed min-h-16">
                    {doctor.bio || 'Professional support for common student health needs and follow-up care.'}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-[#2563EB] font-semibold">
                    <Calendar className="w-4 h-4" />
                    Bookable with live slot lookup
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    to={`/student/appointments/doctors/${doctor._id}`}
                    className="flex-1 py-4 bg-[#F4F4F8] text-[#18181B] rounded-2xl font-bold text-sm text-center hover:bg-[#EBEBEF] transition-all"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/student/appointments/book/${doctor._id}`}
                    className="flex-1 py-4 bg-[#2563EB] text-white rounded-2xl font-bold text-sm text-center hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-100"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {loading && <p className="mt-10 text-[#71717A]">Loading doctors...</p>}
        {error && <p className="mt-10 text-red-600">{error}</p>}
        {!loading && !error && filteredDoctors.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-[#F4F4F8] rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-[#71717A]" />
            </div>
            <h3 className="text-2xl font-bold text-[#18181B]">No doctors found</h3>
            <p className="text-[#71717A] mt-2">Try another search or remove a filter to see more doctors.</p>
          </div>
        )}
      </div>
    </div>
  );
}
