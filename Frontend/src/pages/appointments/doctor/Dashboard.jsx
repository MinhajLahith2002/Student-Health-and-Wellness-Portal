import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, FileText, Stethoscope, Users, AlertCircle, RefreshCw, HeartPulse, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { getDoctorDashboard } from '../../../lib/appointments';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { LoadingState } from '../../../components/LoadingState';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../hooks/useAuth';
import { useSocket } from '../../../hooks/useSocket';

function formatDateTime(date, time) {
  return `${new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${time}`;
}

function formatDateLabel(date) {
  if (!date) return 'Not scheduled';

  return new Date(date).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getAgeLabel(dateOfBirth) {
  if (!dateOfBirth) return 'Age not recorded';

  const birthDate = new Date(dateOfBirth);
  const ageDiff = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDiff);
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  return `${years} years`;
}

function StatCard({ label, value, hint, icon, tone }) {
  const Icon = icon;

  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white p-8 rounded-[32px] border border-border-gray shadow-sm">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-6', tone)}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-bold text-primary-text mt-2">{value}</p>
      <p className="text-sm text-secondary-text mt-3">{hint}</p>
    </motion.div>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { listenForAvailabilityUpdates, subscribeQueue, unsubscribeQueue } = useSocket();

  const fetchDoctorDashboard = useCallback(async () => {
    let active = true;
    try {
      setLoading(true);
      setError('');
      const data = await getDoctorDashboard();
      if (!active) return;
      setDashboard(data);
    } catch (err) {
      if (!active) return;
      setError(err.message || 'Failed to load doctor dashboard');
      console.error('DoctorDashboard fetch error:', err);
    } finally {
      if (active) setLoading(false);
    }
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    fetchDoctorDashboard();
  }, [fetchDoctorDashboard]);

  useEffect(() => {
    const providerId = user?.id || user?._id;
    if (!providerId) return undefined;

    const removeAvailabilityListener = listenForAvailabilityUpdates((payload) => {
      if (payload?.role && payload.role !== 'doctor') {
        return;
      }

      fetchDoctorDashboard();
    });

    subscribeQueue(providerId, () => {
      fetchDoctorDashboard();
    });

    return () => {
      removeAvailabilityListener?.();
      unsubscribeQueue(providerId);
    };
  }, [fetchDoctorDashboard, listenForAvailabilityUpdates, subscribeQueue, unsubscribeQueue, user?.id, user?._id]);

  if (loading) {
    return <LoadingState message="Loading doctor dashboard..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-bg pb-20 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-3xl bg-white border border-border-gray p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary-text mb-2">Error</h2>
          <p className="text-secondary-text mb-6">{error}</p>
          <button
            onClick={() => fetchDoctorDashboard()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const todayAppointments = dashboard?.todayAppointments || [];
  const upcomingAppointments = dashboard?.upcomingAppointments || [];
  const patientRecords = dashboard?.patientRecords || [];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-primary-bg pb-20">
        <div className="bg-white border-b border-border-gray pt-32 pb-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-primary-text tracking-tight">Doctor Dashboard</h1>
              <p className="text-secondary-text mt-2 text-lg">Monitor today&apos;s workload, availability, and booked consultations.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/doctor/availability" className="px-6 py-3 bg-white border border-border-gray text-primary-text rounded-full font-bold">
                Manage Availability
              </Link>
              <Link to="/doctor/patients" className="px-6 py-3 bg-accent-primary text-white rounded-full font-bold">
                Review Patients
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 space-y-10">
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
            <StatCard label="Today's appointments" value={todayAppointments.length} hint="Booked for the current day" icon={Calendar} tone="bg-accent-primary/10 text-accent-primary" />
            <StatCard label="Patients in queue" value={stats.queue || 0} hint="Confirmed and waiting" icon={Users} tone="bg-emerald-50 text-emerald-600" />
            <StatCard label="Patient records" value={stats.totalPatients || 0} hint="Linked to this doctor account" icon={HeartPulse} tone="bg-rose-50 text-rose-600" />
            <StatCard label="Issued prescriptions" value={stats.issuedPrescriptions || 0} hint="Created from completed consultations" icon={FileText} tone="bg-amber-50 text-amber-600" />
            <StatCard label="Active schedules" value={stats.activeSchedules || 0} hint="Availability blocks published" icon={Clock} tone="bg-purple-50 text-purple-600" />
          </section>

          <section className="bg-white rounded-[32px] border border-border-gray shadow-sm p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-primary-text">Patient records snapshot</h2>
                <p className="text-sm text-secondary-text mt-2">
                  Student medical records linked to this exact doctor login are shown here first, before the appointment sections below.
                </p>
              </div>
              <Link to="/doctor/patients" className="text-sm font-semibold text-accent-primary">
                Open full patient records
              </Link>
            </div>

            {patientRecords.length === 0 ? (
              <div className="mt-6 rounded-3xl bg-secondary-bg p-6">
                <p className="font-semibold text-primary-text">No patient records are currently linked to this doctor account.</p>
                <p className="text-sm text-secondary-text mt-2">
                  Patient records appear only after a student books an appointment with the exact doctor profile attached to this login. If you see schedules but no records, the booking may belong to a different doctor account with a similar name.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/doctor/availability" className="px-5 py-3 bg-white border border-border-gray text-primary-text rounded-2xl font-bold text-sm">
                    Manage Availability
                  </Link>
                  <Link to="/doctor/patients" className="px-5 py-3 bg-accent-primary text-white rounded-2xl font-bold text-sm">
                    Review Patients
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
                {patientRecords.slice(0, 3).map((patient) => (
                  <div key={patient._id} className="rounded-3xl bg-secondary-bg p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-primary-text">{patient.name}</h3>
                        <p className="text-sm text-secondary-text mt-1">{patient.studentId || 'Student ID pending'}</p>
                      </div>
                      <span className="px-3 py-2 rounded-full bg-white text-xs font-bold text-primary-text">
                        {patient.totalVisits} visits
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-secondary-text">
                      <p>Allergies: {patient.allergies?.length ? patient.allergies.join(', ') : 'None recorded'}</p>
                      <p>Blood type: {patient.bloodType || 'Not recorded'}</p>
                      <p>Last visit: {formatDateLabel(patient.lastVisit)}</p>
                    </div>

                    <div className="mt-4 rounded-2xl bg-white px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-secondary-text font-bold mb-2">Latest appointment</p>
                      {patient.recentAppointments?.[0] ? (
                        <>
                          <p className="font-semibold text-primary-text">
                            {formatDateTime(patient.recentAppointments[0].date, patient.recentAppointments[0].time)}
                          </p>
                          <p className="text-sm text-secondary-text mt-1">
                            {patient.recentAppointments[0].symptoms || patient.recentAppointments[0].notes || 'No booking notes recorded.'}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-secondary-text">No appointment snapshot recorded yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <section id="doctor-queue" className="xl:col-span-2 bg-white rounded-[32px] border border-border-gray shadow-sm p-8 scroll-mt-32">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-text">Today's appointments</h2>
                <Link to="/doctor/dashboard#doctor-queue" className="text-sm font-semibold text-accent-primary">
                  Open queue
                </Link>
              </div>

              <div className="space-y-4">
                {todayAppointments.length === 0 ? (
                  <p className="text-secondary-text">No appointments are booked for today.</p>
                ) : (
                  todayAppointments.map((appointment) => (
                    <div key={appointment._id} className="rounded-3xl bg-secondary-bg p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-bold text-primary-text">{appointment.studentName}</p>
                          <span className="px-3 py-1 rounded-full bg-white text-xs font-bold text-secondary-text">
                            {appointment.studentProfile?.studentId || 'Student ID pending'}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold">
                            {appointment.status}
                          </span>
                        </div>
                        <p className="text-sm text-secondary-text mt-1">{formatDateTime(appointment.date, appointment.time)} - {appointment.type}</p>
                        <p className="text-sm text-secondary-text mt-2">
                          Reason: {appointment.symptoms || appointment.notes || 'No booking reason submitted.'}
                        </p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="rounded-2xl bg-white px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-secondary-text font-bold mb-1">Allergies</p>
                            <p className="text-primary-text font-semibold">
                              {appointment.studentProfile?.allergies?.length
                                ? appointment.studentProfile.allergies.join(', ')
                                : 'None recorded'}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-secondary-text font-bold mb-1">Blood / Age</p>
                            <p className="text-primary-text font-semibold">
                              {appointment.studentProfile?.bloodType || 'Not recorded'} - {getAgeLabel(appointment.studentProfile?.dateOfBirth)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-secondary-text font-bold mb-1">Medical history</p>
                            <p className="text-primary-text font-semibold">
                              {appointment.studentProfile?.medicalHistory?.length
                                ? appointment.studentProfile.medicalHistory.slice(0, 2).map((entry) => entry.condition).join(', ')
                                : 'No chronic history recorded'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 lg:w-[180px]">
                        <Link to={`/doctor/consultation/${appointment._id}`} className="px-5 py-3 bg-accent-primary text-white rounded-2xl font-bold text-sm text-center">
                          Open Consultation
                        </Link>
                        <Link to={`/doctor/patients?patient=${appointment.studentProfile?._id || appointment.studentId?._id || appointment.studentId || ''}`} className="px-5 py-3 bg-white text-primary-text rounded-2xl font-bold text-sm text-center border border-border-gray">
                          Open Patient Record
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="bg-white rounded-[32px] border border-border-gray shadow-sm p-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-primary-text">Operational snapshot</h2>
              <p className="text-sm text-secondary-text mt-3 leading-relaxed">
                Availability publishing and student bookings are linked, but they appear in different views for clarity.
              </p>
              <div className="mt-8 space-y-3">
                <Link to="/doctor/availability" className="block rounded-2xl bg-secondary-bg px-5 py-4 font-semibold text-primary-text">
                  Update schedule blocks
                </Link>
                <Link to="/doctor/dashboard#doctor-queue" className="block rounded-2xl bg-secondary-bg px-5 py-4 font-semibold text-primary-text">
                  Manage live queue
                </Link>
                <div className="rounded-2xl bg-secondary-bg px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-secondary-text font-bold mb-2">Patients linked</p>
                  <p className="font-semibold text-primary-text">{stats.totalPatients || 0} patient records are now available directly on this dashboard.</p>
                </div>
                <Link to="/doctor/prescriptions" className="block rounded-2xl bg-secondary-bg px-5 py-4 font-semibold text-primary-text">
                  Review prescriptions
                </Link>
              </div>
            </aside>
          </div>

          <section className="bg-white rounded-[32px] border border-border-gray shadow-sm p-8">
            <h2 className="text-2xl font-bold text-primary-text">Upcoming booked appointments</h2>
            <p className="text-sm text-secondary-text mt-2 mb-6">
              Students can book future dates, so those bookings may not appear in the today-only queue above.
            </p>

            <div className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <p className="text-secondary-text">No booked appointments were found for the next two weeks.</p>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment._id} className="rounded-3xl bg-secondary-bg p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-bold text-primary-text">{appointment.studentName}</p>
                        <span className="px-3 py-1 rounded-full bg-white text-xs font-bold text-secondary-text">
                          {appointment.studentProfile?.studentId || 'Student ID pending'}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-text mt-1">{formatDateTime(appointment.date, appointment.time)} - {appointment.type} - {appointment.status}</p>
                      <p className="text-sm text-secondary-text mt-2">
                        Reason: {appointment.symptoms || 'No symptoms or reason submitted.'}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-secondary-text mt-2">
                          Notes: {appointment.notes}
                        </p>
                      )}
                      <p className="text-sm text-secondary-text mt-2">
                        Allergies: {appointment.studentProfile?.allergies?.length ? appointment.studentProfile.allergies.join(', ') : 'None recorded'}
                      </p>
                    </div>
                    <Link to={`/doctor/consultation/${appointment._id}`} className="px-5 py-3 bg-accent-primary text-white rounded-2xl font-bold text-sm text-center">
                      View Booking
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-white rounded-[32px] border border-border-gray shadow-sm p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-primary-text">Patient medical records on dashboard</h2>
                <p className="text-sm text-secondary-text mt-2">
                  This doctor-only view keeps each student&apos;s booking history and recorded medical details directly on the dashboard.
                </p>
              </div>
              <Link to="/doctor/patients" className="text-sm font-semibold text-accent-primary">
                Open full patient records
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
              {patientRecords.length === 0 ? (
                <div className="xl:col-span-2 rounded-3xl bg-secondary-bg p-6 text-secondary-text">
                  No patient records are linked to this doctor yet.
                </div>
              ) : (
                patientRecords.map((patient) => (
                  <div key={patient._id} className="rounded-3xl bg-secondary-bg p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-primary-text">{patient.name}</h3>
                        <p className="text-sm text-secondary-text mt-1">
                          {patient.studentId || 'Student ID pending'} - {patient.email || 'Email not recorded'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-2 rounded-full bg-white text-xs font-bold text-primary-text">
                          {patient.totalVisits} visits
                        </span>
                        <span className="px-3 py-2 rounded-full bg-white text-xs font-bold text-primary-text">
                          {patient.bloodType || 'Blood type N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-white p-4">
                        <div className="flex items-center gap-2 text-rose-600 mb-2">
                          <ShieldAlert className="w-4 h-4" />
                          <p className="text-[10px] uppercase tracking-[0.18em] font-bold">Allergies</p>
                        </div>
                        <p className="text-sm font-semibold text-primary-text">
                          {patient.allergies?.length ? patient.allergies.join(', ') : 'None recorded'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <div className="flex items-center gap-2 text-emerald-600 mb-2">
                          <HeartPulse className="w-4 h-4" />
                          <p className="text-[10px] uppercase tracking-[0.18em] font-bold">Profile</p>
                        </div>
                        <p className="text-sm font-semibold text-primary-text">
                          {patient.gender || 'Gender not recorded'} - {getAgeLabel(patient.dateOfBirth)}
                        </p>
                        <p className="text-xs text-secondary-text mt-2">
                          Last visit: {formatDateLabel(patient.lastVisit)}{patient.nextVisit ? ` | Next visit: ${formatDateLabel(patient.nextVisit)}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-secondary-text font-bold mb-3">Medical history</p>
                      {patient.medicalHistory?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {patient.medicalHistory.slice(0, 4).map((entry, index) => (
                            <span key={`${patient._id}-${entry.condition}-${index}`} className="px-3 py-2 rounded-full bg-white text-xs font-bold text-primary-text">
                              {entry.condition} ({entry.status || 'active'})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-secondary-text">No long-term medical history recorded.</p>
                      )}
                    </div>

                    <div className="mt-5">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-secondary-text font-bold mb-3">Recent appointments</p>
                      <div className="space-y-3">
                        {patient.recentAppointments?.map((appointment) => (
                          <div key={appointment._id} className="rounded-2xl bg-white p-4 flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-primary-text">
                                {formatDateTime(appointment.date, appointment.time)} - {appointment.type}
                              </p>
                              <p className="text-sm text-secondary-text mt-1">
                                {appointment.symptoms || appointment.notes || 'No booking notes recorded.'}
                              </p>
                              {appointment.diagnosis && (
                                <p className="text-sm text-secondary-text mt-1">
                                  Diagnosis: {appointment.diagnosis}
                                </p>
                              )}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent-primary">
                              {appointment.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </ErrorBoundary>
  );
}
