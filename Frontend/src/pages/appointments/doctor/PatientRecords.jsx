import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, AlertCircle, RefreshCw } from 'lucide-react';
import { getDoctorPatientById, getDoctorPatients } from '../../../lib/appointments';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { LoadingState } from '../../../components/LoadingState';
import { cn } from '../../../lib/utils';
import { useSocket } from '../../../hooks/useSocket';

function formatDateLabel(value) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function PatientRecords() {
  const { listenForAvailabilityUpdates } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientDetail, setPatientDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestedPatientId = searchParams.get('patient') || '';

  // PHASE 3: Refetch patient list
  const fetchPatients = useCallback(async () => {
    let active = true;
    try {
      setLoading(true);
      setError('');
      const data = await getDoctorPatients();
      if (!active) return;
      const items = Array.isArray(data?.patients) ? data.patients : [];
      setPatients(items);

      if (items.length === 0) {
        setSelectedPatientId('');
        setPatientDetail(null);
        return;
      }

      setSelectedPatientId((current) => {
        if (requestedPatientId && items.some((patient) => patient._id === requestedPatientId)) {
          return requestedPatientId;
        }

        if (current && items.some((patient) => patient._id === current)) {
          return current;
        }

        return items[0]._id;
      });
    } catch (err) {
      if (!active) return;
      setError(err.message || 'Failed to load patients');
      console.error('PatientRecords fetch error:', err);
    } finally {
      if (active) setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [requestedPatientId]);

  // PHASE 3: Auto-fetch on mount
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (!selectedPatientId) {
      if (requestedPatientId) {
        setSearchParams({}, { replace: true });
      }
      return;
    }

    if (requestedPatientId !== selectedPatientId) {
      setSearchParams({ patient: selectedPatientId }, { replace: true });
    }
  }, [requestedPatientId, selectedPatientId, setSearchParams]);

  useEffect(() => {
    const removeAvailabilityListener = listenForAvailabilityUpdates((payload) => {
      if (payload?.role && payload.role !== 'doctor') {
        return;
      }

      fetchPatients();
    });

    return () => {
      removeAvailabilityListener?.();
    };
  }, [fetchPatients, listenForAvailabilityUpdates]);

  useEffect(() => {
    if (!selectedPatientId) return;

    let active = true;
    (async () => {
      try {
        const data = await getDoctorPatientById(selectedPatientId);
        if (!active) return;
        setPatientDetail(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load patient record');
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedPatientId]);

  const filteredPatients = useMemo(() => patients.filter((patient) => {
    const query = searchQuery.trim().toLowerCase();
    return !query
      || patient.name.toLowerCase().includes(query)
      || (patient.studentId || '').toLowerCase().includes(query);
  }), [patients, searchQuery]);

  // PHASE 3: Handle loading/error states
  if (loading) {
    return <LoadingState message="Loading patient records..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-bg pb-20 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-3xl bg-white border border-border-gray p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary-text mb-2">Error</h2>
          <p className="text-secondary-text mb-6">{error}</p>
          <button
            onClick={() => fetchPatients()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-primary-bg pb-20">
      <div className="bg-white border-b border-border-gray pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-primary-text tracking-tight">Patient Records</h1>
          <p className="text-secondary-text mt-2 text-lg">Review visit history, allergies, prescriptions, and active follow-up notes.</p>

          <div className="mt-10 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by patient name or student ID..."
              className="w-full pl-12 pr-4 py-4 bg-secondary-bg border-none rounded-2xl text-sm outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 xl:grid-cols-12 gap-8">
        <section className="xl:col-span-4 space-y-4">
          {filteredPatients.map((patient) => (
            <button
              key={patient._id}
              onClick={() => setSelectedPatientId(patient._id)}
              className={cn(
                'w-full text-left p-6 rounded-[28px] border transition-all',
                selectedPatientId === patient._id ? 'bg-white border-accent-primary shadow-lg shadow-accent-primary/15' : 'bg-white border-border-gray'
              )}
            >
              <p className="font-bold text-primary-text">{patient.name}</p>
              <p className="text-sm text-secondary-text mt-1">Student ID: {patient.studentId || 'N/A'}</p>
              <p className="text-xs text-secondary-text mt-3">Visits: {patient.totalVisits} • Last visit: {formatDateLabel(patient.lastVisit)}</p>
            </button>
          ))}

          {!loading && filteredPatients.length === 0 && (
            <div className="bg-white rounded-[28px] border border-dashed border-border-gray p-8 text-secondary-text">
              {patients.length === 0
                ? 'Confirmed student bookings linked to this doctor will appear here automatically.'
                : 'No patients matched your search.'}
            </div>
          )}
        </section>

        <section className="xl:col-span-8 bg-white rounded-[32px] border border-border-gray p-8">
          {!patientDetail ? (
            <p className="text-secondary-text">Select a patient to open their record.</p>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-primary-text">{patientDetail.patient.name}</h2>
                  <p className="text-secondary-text mt-2">
                    Student ID: {patientDetail.patient.studentId || 'N/A'} • Blood type: {patientDetail.patient.bloodType || 'Not recorded'}
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-50 px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-bold mb-1">Allergies</p>
                  <p className="font-semibold text-primary-text">{patientDetail.patient.allergies?.join(', ') || 'None recorded'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-primary-text mb-4">Medical history</h3>
                  <div className="space-y-3">
                    {patientDetail.patient.medicalHistory?.length ? patientDetail.patient.medicalHistory.map((entry, index) => (
                      <div key={`${entry.condition}-${index}`} className="rounded-2xl bg-secondary-bg p-4">
                        <p className="font-semibold text-primary-text">{entry.condition}</p>
                        <p className="text-sm text-secondary-text mt-1">{entry.status || 'active'}</p>
                      </div>
                    )) : (
                      <p className="text-secondary-text">No long-term history recorded.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-primary-text mb-4">Prescriptions</h3>
                  <div className="space-y-3">
                    {patientDetail.prescriptions?.length ? patientDetail.prescriptions.map((prescription) => (
                      <div key={prescription._id} className="rounded-2xl bg-secondary-bg p-4">
                        <p className="font-semibold text-primary-text">{prescription.medicines?.[0]?.name || 'Prescription issued'}</p>
                        <p className="text-sm text-secondary-text mt-1">{formatDateLabel(prescription.createdAt)} • {prescription.status}</p>
                      </div>
                    )) : (
                      <p className="text-secondary-text">No prescriptions issued yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-xl font-bold text-primary-text mb-4">Visit history</h3>
                <div className="space-y-3">
                  {patientDetail.appointments?.length ? patientDetail.appointments.map((appointment) => (
                    <div key={appointment._id} className="rounded-2xl bg-secondary-bg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-primary-text">{formatDateLabel(appointment.date)} at {appointment.time}</p>
                        <p className="text-sm text-secondary-text mt-1">{appointment.type}</p>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">{appointment.status}</span>
                    </div>
                  )) : (
                    <p className="text-secondary-text">No visit history available.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
      </div>
    </ErrorBoundary>
  );
}
