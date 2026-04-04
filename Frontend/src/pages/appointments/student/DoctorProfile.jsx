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
    return <div className="student-shell pt-36 px-6">Loading doctor profile...</div>;
  }

  if (error || !doctor) {
    return <div className="student-shell pt-36 px-6 text-red-600">{error || 'Doctor not found'}</div>;
  }

  return (
    <div className="student-shell pb-20">
      <div className="student-hero pt-32 pb-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 lg:items-center">
          <div className="w-28 h-28 rounded-[32px] bg-[#e8f4f8] text-accent-primary flex items-center justify-center text-4xl font-bold">
            {doctor.name?.[0] || 'D'}
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f7f5] text-accent-primary text-[10px] font-bold uppercase tracking-widest mb-4">
              <Shield className="w-3 h-3" />
              Verified campus provider
            </div>
            <h1 className="text-4xl font-bold text-primary-text">{doctor.name}</h1>
            <p className="text-lg text-secondary-text mt-2">{doctor.specialty || 'General Physician'}</p>
            <p className="text-sm text-primary-text mt-5 leading-relaxed max-w-3xl">
              {doctor.bio || 'Professional medical support for routine care, follow-up visits, and student wellness guidance.'}
            </p>
          </div>
          <Link to={`/student/appointments/book/${doctor._id}`} className="px-8 py-4 bg-accent-primary text-white rounded-full font-bold text-center">
            Book appointment
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 student-surface p-8">
          <h2 className="text-2xl font-bold text-primary-text mb-6">Provider overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl bg-[#e8f4f8] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Specialty</p>
              <p className="font-semibold text-primary-text">{doctor.specialty || 'General Physician'}</p>
            </div>
            <div className="rounded-2xl bg-[#e8f7f5] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-primary mb-2">Experience</p>
              <p className="font-semibold text-primary-text">{doctor.experience ? `${doctor.experience} years` : 'Available'}</p>
            </div>
            <div className="rounded-2xl bg-purple-50 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-600 mb-2">Education</p>
              <p className="font-semibold text-primary-text">{doctor.education?.[0] || 'Campus medical team'}</p>
            </div>
          </div>

          <div className="rounded-3xl bg-[#edf5f8] p-6 mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text mb-3">Consultation Types</p>
            <div className="flex flex-wrap gap-3">
              {[...new Set(availabilityEntries.flatMap((entry) => entry.consultationTypes || []))].map((option) => (
                <span key={option} className="px-4 py-2 rounded-full bg-white text-sm font-bold text-primary-text">
                  {option}
                </span>
              ))}
              {!availabilityEntries.some((entry) => Array.isArray(entry.consultationTypes) && entry.consultationTypes.length > 0) && (
                <span className="px-4 py-2 rounded-full bg-white text-sm font-bold text-primary-text">Video Call</span>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-[#edf5f8] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Stethoscope className="w-5 h-5 text-accent-primary" />
              <h3 className="font-bold text-primary-text">About this doctor</h3>
            </div>
            <p className="text-sm text-secondary-text leading-relaxed">
              {doctor.bio || 'Detailed provider information will appear here once profile fields are updated.'}
            </p>
          </div>
        </section>

        <aside className="student-surface p-8">
          <h2 className="text-xl font-bold text-primary-text mb-5">Availability preview</h2>
          <div className="flex items-center gap-3 text-sm text-secondary-text mb-6">
            <Calendar className="w-4 h-4" />
            Next available date
          </div>
          <div className="grid grid-cols-2 gap-3">
            {availability.slice(0, 6).map((slot) => (
              <div key={slot} className="px-4 py-3 rounded-2xl bg-[#edf5f8] text-center text-sm font-bold text-primary-text">
                {slot}
              </div>
            ))}
          </div>
          {availability.length === 0 && (
            <p className="text-sm text-secondary-text mt-4">No open preview slots were found right now.</p>
          )}
          <Link to={`/student/appointments/book/${doctor._id}`} className="block mt-8 w-full py-4 bg-accent-primary text-white rounded-2xl font-bold text-center">
            Continue to booking
          </Link>
        </aside>
      </div>
    </div>
  );
}

