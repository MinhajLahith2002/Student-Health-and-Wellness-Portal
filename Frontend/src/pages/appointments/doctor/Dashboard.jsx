import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, FileText, Stethoscope, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { getDoctorDashboard } from '../../../lib/appointments';
import { cn } from '../../../lib/utils';

function formatDateTime(date, time) {
  return `${new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${time}`;
}

function StatCard({ label, value, hint, icon, tone }) {
  const Icon = icon;

  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white p-8 rounded-[32px] border border-[#F0F0F3] shadow-sm">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-6', tone)}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-bold text-[#18181B] mt-2">{value}</p>
      <p className="text-sm text-[#71717A] mt-3">{hint}</p>
    </motion.div>
  );
}

export default function DoctorDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const data = await getDoctorDashboard();
        if (!active) return;
        setDashboard(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load doctor dashboard');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const stats = dashboard?.stats || {};
  const todayAppointments = dashboard?.todayAppointments || [];

  return (
    <div className="min-h-screen bg-[#FCFCFC] pb-20">
      <div className="bg-white border-b border-[#F0F0F3] pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-[#18181B] tracking-tight">Doctor Dashboard</h1>
            <p className="text-[#71717A] mt-2 text-lg">Monitor today’s workload, availability, and consultation queue.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/doctor/availability" className="px-6 py-3 bg-white border border-[#F0F0F3] text-[#18181B] rounded-full font-bold">
              Manage Availability
            </Link>
            <Link to="/doctor/patients" className="px-6 py-3 bg-[#2563EB] text-white rounded-full font-bold">
              Review Patients
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 space-y-10">
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard label="Today's appointments" value={todayAppointments.length} hint="Booked for the current day" icon={Calendar} tone="bg-blue-50 text-blue-600" />
          <StatCard label="Patients in queue" value={stats.queue || 0} hint="Confirmed and waiting" icon={Users} tone="bg-emerald-50 text-emerald-600" />
          <StatCard label="Pending prescriptions" value={stats.pendingPrescriptions || 0} hint="Need to be issued or verified" icon={FileText} tone="bg-amber-50 text-amber-600" />
          <StatCard label="Active schedules" value={stats.activeSchedules || 0} hint="Availability blocks published" icon={Clock} tone="bg-purple-50 text-purple-600" />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="xl:col-span-2 bg-white rounded-[32px] border border-[#F0F0F3] shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#18181B]">Today’s appointments</h2>
              <Link to="/doctor/appointments" className="text-sm font-semibold text-[#2563EB]">
                Open queue
              </Link>
            </div>

            <div className="space-y-4">
              {todayAppointments.length === 0 ? (
                <p className="text-[#71717A]">No appointments are booked for today.</p>
              ) : (
                todayAppointments.map((appointment) => (
                  <div key={appointment._id} className="rounded-3xl bg-[#F4F4F8] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-[#18181B]">{appointment.studentName}</p>
                      <p className="text-sm text-[#71717A] mt-1">{formatDateTime(appointment.date, appointment.time)} • {appointment.type}</p>
                    </div>
                    <Link to={`/doctor/consultation/${appointment._id}`} className="px-5 py-3 bg-[#2563EB] text-white rounded-2xl font-bold text-sm text-center">
                      Open Consultation
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="bg-white rounded-[32px] border border-[#F0F0F3] shadow-sm p-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-[#18181B]">Operational snapshot</h2>
            <p className="text-sm text-[#71717A] mt-3 leading-relaxed">
              Keep moving between scheduling, consultation notes, and patient history without leaving the doctor flow.
            </p>
            <div className="mt-8 space-y-3">
              <Link to="/doctor/availability" className="block rounded-2xl bg-[#F4F4F8] px-5 py-4 font-semibold text-[#18181B]">
                Update schedule blocks
              </Link>
              <Link to="/doctor/appointments" className="block rounded-2xl bg-[#F4F4F8] px-5 py-4 font-semibold text-[#18181B]">
                Manage live queue
              </Link>
              <Link to="/doctor/prescriptions" className="block rounded-2xl bg-[#F4F4F8] px-5 py-4 font-semibold text-[#18181B]">
                Review prescriptions
              </Link>
            </div>
          </aside>
        </div>

        {loading && <p className="text-sm text-[#71717A]">Loading dashboard...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
