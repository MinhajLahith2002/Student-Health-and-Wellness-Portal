import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Clock, Shield, Stethoscope } from 'lucide-react';
import { getProviderAvailability, getProviderById } from '../../../lib/providers';

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [availabilityEntries, setAvailabilityEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    (async () => {
      try {
        setLoading(true);
        const [provider, schedule] = await Promise.all([
          getProviderById(doctorId),
          getProviderAvailability(doctorId, tomorrow.toISOString().slice(0, 10))
        ]);
        if (!active) return;
        setDoctor(provider);
        setAvailability(Array.isArray(schedule?.availableSlots) ? schedule.availableSlots : []);
        setAvailabilityEntries(Array.isArray(schedule?.entries) ? schedule.entries : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load doctor profile');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [doctorId]);

  if (loading) {
    return <div className="min-h-screen bg-[#FCFCFC] pt-36 px-6">Loading doctor profile...</div>;
  }

  if (error || !doctor) {
    return <div className="min-h-screen bg-[#FCFCFC] pt-36 px-6 text-red-600">{error || 'Doctor not found'}</div>;
  }

  return (
    <div className="min-h-screen bg-[#FCFCFC] pb-20">
      <div className="bg-white border-b border-[#F0F0F3] pt-32 pb-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 lg:items-center">
          <div className="w-28 h-28 rounded-[32px] bg-blue-50 text-[#2563EB] flex items-center justify-center text-4xl font-bold">
            {doctor.name?.[0] || 'D'}
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-4">
              <Shield className="w-3 h-3" />
              Verified campus provider
            </div>
            <h1 className="text-4xl font-bold text-[#18181B]">{doctor.name}</h1>
            <p className="text-lg text-[#71717A] mt-2">{doctor.specialty || 'General Physician'}</p>
            <p className="text-sm text-[#18181B] mt-5 leading-relaxed max-w-3xl">
              {doctor.bio || 'Professional medical support for routine care, follow-up visits, and student wellness guidance.'}
            </p>
          </div>
          <Link to={`/student/appointments/book/${doctor._id}`} className="px-8 py-4 bg-[#2563EB] text-white rounded-full font-bold text-center">
            Book appointment
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white rounded-[32px] border border-[#F0F0F3] p-8">
          <h2 className="text-2xl font-bold text-[#18181B] mb-6">Provider overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Specialty</p>
              <p className="font-semibold text-[#18181B]">{doctor.specialty || 'General Physician'}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 mb-2">Experience</p>
              <p className="font-semibold text-[#18181B]">{doctor.experience ? `${doctor.experience} years` : 'Available'}</p>
            </div>
            <div className="rounded-2xl bg-purple-50 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-600 mb-2">Education</p>
              <p className="font-semibold text-[#18181B]">{doctor.education?.[0] || 'Campus medical team'}</p>
            </div>
          </div>

          <div className="rounded-3xl bg-[#F4F4F8] p-6 mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71717A] mb-3">Consultation Types</p>
            <div className="flex flex-wrap gap-3">
              {[...new Set(availabilityEntries.flatMap((entry) => entry.consultationTypes || []))].map((option) => (
                <span key={option} className="px-4 py-2 rounded-full bg-white text-sm font-bold text-[#18181B]">
                  {option}
                </span>
              ))}
              {!availabilityEntries.some((entry) => Array.isArray(entry.consultationTypes) && entry.consultationTypes.length > 0) && (
                <span className="px-4 py-2 rounded-full bg-white text-sm font-bold text-[#18181B]">Video Call</span>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-[#F4F4F8] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Stethoscope className="w-5 h-5 text-[#2563EB]" />
              <h3 className="font-bold text-[#18181B]">About this doctor</h3>
            </div>
            <p className="text-sm text-[#71717A] leading-relaxed">
              {doctor.bio || 'Detailed provider information will appear here once profile fields are updated.'}
            </p>
          </div>
        </section>

        <aside className="bg-white rounded-[32px] border border-[#F0F0F3] p-8">
          <h2 className="text-xl font-bold text-[#18181B] mb-5">Availability preview</h2>
          <div className="flex items-center gap-3 text-sm text-[#71717A] mb-6">
            <Calendar className="w-4 h-4" />
            Next available date
          </div>
          <div className="grid grid-cols-2 gap-3">
            {availability.slice(0, 6).map((slot) => (
              <div key={slot} className="px-4 py-3 rounded-2xl bg-[#F4F4F8] text-center text-sm font-bold text-[#18181B]">
                {slot}
              </div>
            ))}
          </div>
          {availability.length === 0 && (
            <p className="text-sm text-[#71717A] mt-4">No open preview slots were found right now.</p>
          )}
          <Link to={`/student/appointments/book/${doctor._id}`} className="block mt-8 w-full py-4 bg-[#2563EB] text-white rounded-2xl font-bold text-center">
            Continue to booking
          </Link>
        </aside>
      </div>
    </div>
  );
}
