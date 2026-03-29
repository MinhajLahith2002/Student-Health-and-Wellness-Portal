import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { getDoctorPatientById, getDoctorPatients } from '../../../lib/appointments';
import { cn } from '../../../lib/utils';

function formatDateLabel(value) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function PatientRecords() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientDetail, setPatientDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const data = await getDoctorPatients();
        if (!active) return;
        const items = Array.isArray(data?.patients) ? data.patients : [];
        setPatients(items);
        if (items[0]) {
          setSelectedPatientId(items[0]._id);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load patients');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-[#FCFCFC] pb-20">
      <div className="bg-white border-b border-[#F0F0F3] pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-[#18181B] tracking-tight">Patient Records</h1>
          <p className="text-[#71717A] mt-2 text-lg">Review visit history, allergies, prescriptions, and active follow-up notes.</p>

          <div className="mt-10 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by patient name or student ID..."
              className="w-full pl-12 pr-4 py-4 bg-[#F4F4F8] border-none rounded-2xl text-sm outline-none"
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
                selectedPatientId === patient._id ? 'bg-white border-[#2563EB] shadow-lg shadow-blue-100' : 'bg-white border-[#F0F0F3]'
              )}
            >
              <p className="font-bold text-[#18181B]">{patient.name}</p>
              <p className="text-sm text-[#71717A] mt-1">Student ID: {patient.studentId || 'N/A'}</p>
              <p className="text-xs text-[#71717A] mt-3">Visits: {patient.totalVisits} • Last visit: {formatDateLabel(patient.lastVisit)}</p>
            </button>
          ))}

          {!loading && filteredPatients.length === 0 && (
            <div className="bg-white rounded-[28px] border border-dashed border-[#F0F0F3] p-8 text-[#71717A]">
              No patients matched your search.
            </div>
          )}
        </section>

        <section className="xl:col-span-8 bg-white rounded-[32px] border border-[#F0F0F3] p-8">
          {!patientDetail ? (
            <p className="text-[#71717A]">Select a patient to open their record.</p>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-[#18181B]">{patientDetail.patient.name}</h2>
                  <p className="text-[#71717A] mt-2">
                    Student ID: {patientDetail.patient.studentId || 'N/A'} • Blood type: {patientDetail.patient.bloodType || 'Not recorded'}
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-50 px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-bold mb-1">Allergies</p>
                  <p className="font-semibold text-[#18181B]">{patientDetail.patient.allergies?.join(', ') || 'None recorded'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-[#18181B] mb-4">Medical history</h3>
                  <div className="space-y-3">
                    {patientDetail.patient.medicalHistory?.length ? patientDetail.patient.medicalHistory.map((entry, index) => (
                      <div key={`${entry.condition}-${index}`} className="rounded-2xl bg-[#F4F4F8] p-4">
                        <p className="font-semibold text-[#18181B]">{entry.condition}</p>
                        <p className="text-sm text-[#71717A] mt-1">{entry.status || 'active'}</p>
                      </div>
                    )) : (
                      <p className="text-[#71717A]">No long-term history recorded.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#18181B] mb-4">Prescriptions</h3>
                  <div className="space-y-3">
                    {patientDetail.prescriptions?.length ? patientDetail.prescriptions.map((prescription) => (
                      <div key={prescription._id} className="rounded-2xl bg-[#F4F4F8] p-4">
                        <p className="font-semibold text-[#18181B]">{prescription.medicines?.[0]?.name || 'Prescription issued'}</p>
                        <p className="text-sm text-[#71717A] mt-1">{formatDateLabel(prescription.createdAt)} • {prescription.status}</p>
                      </div>
                    )) : (
                      <p className="text-[#71717A]">No prescriptions issued yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-xl font-bold text-[#18181B] mb-4">Visit history</h3>
                <div className="space-y-3">
                  {patientDetail.appointments?.length ? patientDetail.appointments.map((appointment) => (
                    <div key={appointment._id} className="rounded-2xl bg-[#F4F4F8] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#18181B]">{formatDateLabel(appointment.date)} at {appointment.time}</p>
                        <p className="text-sm text-[#71717A] mt-1">{appointment.type}</p>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563EB]">{appointment.status}</span>
                    </div>
                  )) : (
                    <p className="text-[#71717A]">No visit history available.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {loading && <p className="max-w-7xl mx-auto px-6 mt-6 text-sm text-[#71717A]">Loading patient records...</p>}
      {error && <p className="max-w-7xl mx-auto px-6 mt-6 text-sm text-red-600">{error}</p>}
    </div>
  );
}
