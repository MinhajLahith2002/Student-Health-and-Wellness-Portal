import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  Star, 
  Calendar, 
  ChevronRight, 
  MapPin, 
  Clock,
  User,
  Shield,
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_DOCTORS } from '../../../constants/mockAppointmentData';

const FindDoctor = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');

  const specialties = ['All Specialties', 'General Physician', 'Mental Health Counselor', 'Dermatologist', 'Cardiologist'];

  const filteredDoctors = MOCK_DOCTORS.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All Specialties' || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-[#FCFCFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[#F0F0F3] pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-[#18181B] tracking-tight">Find a Doctor</h1>
            <p className="text-[#71717A] mt-2 text-lg">Search and book appointments with our campus medical experts.</p>
          </motion.div>

          {/* Search & Filter Bar */}
          <div className="mt-10 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
              <input 
                type="text"
                placeholder="Search by name, specialty, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#F4F4F8] border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
              />
            </div>
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
              <select 
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#F4F4F8] border-none rounded-2xl text-sm font-bold text-[#18181B] outline-none focus:ring-2 focus:ring-blue-600/20 appearance-none"
              >
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDoctors.map((doctor) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -8, scale: 1.01 }}
              className="bg-white rounded-[32px] border border-[#F0F0F3] shadow-sm hover:shadow-xl transition-all overflow-hidden group"
            >
              <div className="p-8">
                <div className="flex gap-6 mb-6">
                  <div className="relative">
                    <img 
                      src={doctor.image} 
                      alt={doctor.name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#18181B] group-hover:text-[#2563EB] transition-colors">{doctor.name}</h3>
                    <p className="text-[#71717A] font-medium">{doctor.specialty}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-[#18181B]">{doctor.rating}</span>
                      <span className="text-xs text-[#71717A]">({doctor.reviewsCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm text-[#71717A]">
                    <Clock className="w-4 h-4" />
                    <span>{doctor.experience} years experience</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#71717A]">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium text-[#2563EB]">Next: {doctor.nextAvailable}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-4 bg-[#F4F4F8] text-[#18181B] rounded-2xl font-bold text-sm hover:bg-[#EBEBEF] transition-all">
                    View Profile
                  </button>
                  <Link 
                    to={`/student/appointments/book?doctor=${doctor.id}`}
                    className="flex-1 py-4 bg-[#2563EB] text-white rounded-2xl font-bold text-sm text-center hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-100"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-[#F4F4F8] rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-[#71717A]" />
            </div>
            <h3 className="text-2xl font-bold text-[#18181B]">No doctors found</h3>
            <p className="text-[#71717A] mt-2">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindDoctor;