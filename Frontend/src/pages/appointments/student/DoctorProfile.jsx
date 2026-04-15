import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Shield, Stethoscope, AlertCircle, RefreshCw } from 'lucide-react';
import { getProviderAvailability, getProviderById } from '../../../lib/providers';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { LoadingState } from '../../../components/LoadingState';
import { useSocket } from '../../../hooks/useSocket';

const AVAILABILITY_LOOKAHEAD_DAYS = 14;

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToDateValue(dateValue, daysToAdd) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  date.setDate(date.getDate() + daysToAdd);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(value) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const { listenForAvailabilityUpdates } = useSocket();
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [availabilityEntries, setAvailabilityEntries] = useState([]);
  const [previewDate, setPreviewDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDoctorProfile = useCallback(async () => {
    let active = true;
    const requestedStartDate = getTodayValue();

    try {
      setLoading(true);
      setError('');

      const provider = await getProviderById(doctorId);
      let schedule = null;
      let resolvedDate = requestedStartDate;

      for (let offset = 0; offset < AVAILABILITY_LOOKAHEAD_DAYS; offset += 1) {
        const candidateDate = addDaysToDateValue(requestedStartDate, offset);
        const candidateSchedule = await getProviderAvailability(doctorId, candidateDate);
        const availableSlots = Array.isArray(candidateSchedule?.availableSlots) ? candidateSchedule.availableSlots : [];
        const candidateEntries = Array.isArray(candidateSchedule?.entries) ? candidateSchedule.entries : [];

        if (availableSlots.length > 0 || candidateEntries.length > 0) {
          schedule = candidateSchedule;
          resolvedDate = candidateDate;
          break;
        }
      }

      if (!schedule) {
        schedule = await getProviderAvailability(doctorId, requestedStartDate);
      }

      if (!active) return;
      setDoctor(provider);
      setAvailability(Array.isArray(schedule?.availableSlots) ? schedule.availableSlots : []);
      setAvailabilityEntries(Array.isArray(schedule?.entries) ? schedule.entries : []);
      setPreviewDate(resolvedDate);
    } catch (err) {
      if (!active) return;
      setError(err.message || 'Failed to load doctor profile');
      console.error('DoctorProfile fetch error:', err);
    } finally {
      if (active) setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [doctorId]);

  useEffect(() => {
    if (doctorId) {
      fetchDoctorProfile();
    }
  }, [doctorId, fetchDoctorProfile]);

  useEffect(() => {
    if (!doctorId) return undefined;

    const removeAvailabilityListener = listenForAvailabilityUpdates((payload) => {
      if (payload?.providerId && `${payload.providerId}` !== `${doctorId}`) {
        return;
      }

      fetchDoctorProfile();
    });

    return () => {
      removeAvailabilityListener?.();
    };
  }, [doctorId, fetchDoctorProfile, listenForAvailabilityUpdates]);

  if (loading) {
    return <LoadingState message="Loading doctor profile..." />;
  }

  if (error) {
    return (
      <div className="student-shell pt-36 px-6 pb-20">
        <div className="max-w-md mx-auto rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-800 font-semibold mb-4">{error}</p>
          <button
            onClick={() => fetchDoctorProfile()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="student-shell pt-36 px-6 pb-20 text-center">
        <AlertCircle className="w-12 h-12 text-secondary-text mx-auto mb-4" />
        <p className="text-secondary-text">Doctor not found</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
              {previewDate ? `Next published date: ${formatDateLabel(previewDate)}` : 'Next available date'}
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
    </ErrorBoundary>
  );
}
