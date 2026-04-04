import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  Plus,
  Stethoscope,
  Video,
  XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  canOpenVideoVisit,
  checkInAppointment,
  getAppointments,
  getVideoVisitBlockedReason,
  rescheduleAppointment,
  updateAppointmentStatus
} from '../../../lib/appointments';
import { cn } from '../../../lib/utils';

const TIME_OPTIONS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
];

const statusTone = {
  Confirmed: 'bg-blue-50 text-blue-600',
  Ready: 'bg-indigo-50 text-indigo-600',
  'In Progress': 'bg-emerald-50 text-emerald-600',
  Completed: 'bg-slate-100 text-slate-700',
  Cancelled: 'bg-rose-50 text-rose-600',
  'No Show': 'bg-rose-50 text-rose-600',
  Pending: 'bg-amber-50 text-amber-600'
};

function formatDateLabel(value) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

function toDateInputValue(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function toAppointmentDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;

  const [year, month, day] = dateValue.split('-').map(Number);
  const [clock, meridiem] = timeValue.split(' ');
  const [hourText, minuteText] = clock.split(':');
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function isPastSelection(dateValue, timeValue) {
  const selection = toAppointmentDateTime(dateValue, timeValue);
  if (!selection) return false;
  return selection.getTime() < Date.now();
}

function isAppointmentToday(dateValue) {
  return toDateInputValue(dateValue) === getTodayValue();
}

function canManageAppointment(status) {
  return ['Pending', 'Confirmed', 'Ready'].includes(status);
}

function canCancelAppointment(status) {
  return ['Pending', 'Confirmed', 'Ready'].includes(status);
}

function canCheckIn(appointment) {
  return appointment.status === 'Confirmed' && isAppointmentToday(appointment.date);
}

function getRevisitPath(appointment) {
  const doctorId = appointment.doctorId?._id || appointment.doctorId;
  return doctorId && !`${doctorId}`.startsWith('demo-')
    ? `/student/appointments/book/${doctorId}?revisit=${appointment._id}`
    : '/student/appointments/find';
}

function SummaryCard({ label, value, hint, icon, tone }) {
  const CardIcon = icon;

  return (
    <div className="bg-white p-6 rounded-[28px] border border-[#F0F0F3] shadow-sm">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-5', tone)}>
        <CardIcon className="w-6 h-6" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-bold">{label}</p>
      <p className="text-3xl font-bold text-[#18181B] mt-2">{value}</p>
      <p className="text-sm text-[#71717A] mt-3">{hint}</p>
    </div>
  );
}

function AppointmentCard({
  appointment,
  actionState,
  manageDraft,
  manageOpenId,
  onOpenManage,
  onCloseManage,
  onDraftChange,
  onReschedule,
  onCancel,
  onCheckIn
}) {
  const isManageOpen = manageOpenId === appointment._id;
  const hasPastManageSelection = isManageOpen && isPastSelection(manageDraft.date, manageDraft.time);
  const canManage = canManageAppointment(appointment.status);
  const canCancel = canCancelAppointment(appointment.status);
  const showCheckIn = canCheckIn(appointment);
  const canOpenVideo = canOpenVideoVisit(appointment);
  const primaryPath = appointment.type === 'Video Call'
    ? `/student/consultation/${appointment._id}`
    : `/student/appointments/${appointment._id}/queue`;

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      className="bg-white p-6 rounded-2xl border border-[#F0F0F3] shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-[#18181B]">{appointment.doctorName}</h3>
          <p className="text-sm text-[#71717A]">{appointment.doctorSpecialty}</p>
        </div>
        <span className={cn('px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', statusTone[appointment.status] || statusTone.Pending)}>
          {appointment.status}
        </span>
      </div>

      <div className="space-y-3 mb-6 text-sm text-[#71717A]">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4" />
          {formatDateLabel(appointment.date)}
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4" />
          {appointment.time}
        </div>
        <div className="flex items-center gap-3">
          {appointment.type === 'Video Call' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
          {appointment.type === 'Video Call' ? 'Video Call' : appointment.location || 'Campus Health Center'}
        </div>
      </div>

      {appointment.symptoms && (
        <p className="text-sm text-[#71717A] mb-4">{appointment.symptoms}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {appointment.type === 'Video Call' ? (
          canOpenVideo ? (
            <Link
              to={primaryPath}
              className="py-3 bg-[#2563EB] text-white rounded-xl font-bold text-sm text-center hover:bg-[#1D4ED8] transition-all"
            >
              {appointment.status === 'Ready' ? 'Join Visit' : 'Open Visit'}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="py-3 bg-[#E9EEF9] text-[#64748B] rounded-xl font-bold text-sm text-center cursor-not-allowed"
            >
              Video Locked
            </button>
          )
        ) : (
          <Link
            to={primaryPath}
            className="py-3 bg-[#2563EB] text-white rounded-xl font-bold text-sm text-center hover:bg-[#1D4ED8] transition-all"
          >
            {appointment.status === 'Ready' ? 'Open Queue' : 'Queue Status'}
          </Link>
        )}

        {showCheckIn ? (
          <button
            type="button"
            onClick={() => onCheckIn(appointment._id)}
            disabled={actionState === appointment._id}
            className="py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {actionState === appointment._id ? 'Checking in...' : 'Check In'}
          </button>
        ) : canManage ? (
          <button
            type="button"
            onClick={isManageOpen ? onCloseManage : () => onOpenManage(appointment)}
            className={cn(
              'py-3 rounded-xl font-bold text-sm transition-all',
              isManageOpen ? 'bg-[#2563EB] text-white' : 'bg-[#F4F4F8] text-[#18181B] hover:bg-[#EBEBEF]'
            )}
          >
            {isManageOpen ? 'Close Manage' : 'Manage Booking'}
          </button>
        ) : (
          <Link
            to={getRevisitPath(appointment)}
            className="py-3 bg-[#F4F4F8] text-[#18181B] rounded-xl font-bold text-sm text-center"
          >
            Revisit Doctor
          </Link>
        )}

        {appointment.status === 'Completed' ? (
          <Link
            to={`/student/appointments/${appointment._id}/feedback`}
            className="sm:col-span-2 py-3 bg-white border border-[#F0F0F3] text-[#18181B] rounded-xl font-bold text-sm text-center"
          >
            Leave Feedback
          </Link>
        ) : (
          <Link
            to={getRevisitPath(appointment)}
            className="sm:col-span-2 py-3 bg-white border border-[#F0F0F3] text-[#18181B] rounded-xl font-bold text-sm text-center"
          >
            Schedule Revisit
          </Link>
        )}
      </div>

      {appointment.type === 'Video Call' && !canOpenVideo && (
        <p className="mt-4 text-xs text-[#71717A]">{getVideoVisitBlockedReason(appointment)}</p>
      )}

      {isManageOpen && (
        <div className="mt-6 rounded-3xl bg-[#F4F4F8] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-bold">Manage booking</p>
              <p className="text-sm text-[#71717A] mt-2">Reschedule or cancel this appointment without leaving the page.</p>
            </div>
            <button
              type="button"
              onClick={onCloseManage}
              className="text-sm font-semibold text-[#71717A]"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="date"
              min={getTodayValue()}
              value={manageDraft.date}
              onChange={(event) => onDraftChange({ date: event.target.value })}
              className={cn('px-4 py-4 bg-white rounded-2xl outline-none', hasPastManageSelection && 'ring-2 ring-red-300')}
            />
            <select
              value={manageDraft.time}
              onChange={(event) => onDraftChange({ time: event.target.value })}
              className={cn('px-4 py-4 bg-white rounded-2xl outline-none', hasPastManageSelection && 'ring-2 ring-red-300')}
            >
              {TIME_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <select
              value={manageDraft.type}
              onChange={(event) => onDraftChange({ type: event.target.value })}
              className="px-4 py-4 bg-white rounded-2xl outline-none"
            >
              {['Video Call', 'In-Person'].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <textarea
            rows={3}
            value={manageDraft.cancellationReason}
            onChange={(event) => onDraftChange({ cancellationReason: event.target.value })}
            className="w-full px-4 py-4 bg-white rounded-2xl outline-none resize-none"
            placeholder="Optional cancellation reason"
          />

          {hasPastManageSelection && (
            <p className="text-sm text-red-600">Please choose a future date and time.</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onReschedule(appointment._id)}
              disabled={actionState === appointment._id}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#2563EB] text-white font-bold disabled:opacity-50"
            >
              <CalendarClock className="w-4 h-4" />
              {actionState === appointment._id ? 'Saving...' : 'Save Reschedule'}
            </button>
            {canCancel && (
              <button
                type="button"
                onClick={() => onCancel(appointment._id)}
                disabled={actionState === appointment._id}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel Appointment
              </button>
            )}
          </div>
        </div>
      )}
    </motion.article>
  );
}

export default function AppointmentDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [actionState, setActionState] = useState('');
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [manageOpenId, setManageOpenId] = useState('');
  const [manageDraft, setManageDraft] = useState({
    id: '',
    date: '',
    time: '10:00 AM',
    type: 'Video Call',
    cancellationReason: ''
  });

  async function loadAppointments() {
    try {
      setError('');
      const data = await getAppointments();
      setAppointments(Array.isArray(data?.appointments) ? data.appointments : []);
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    }
  }

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const data = await getAppointments();
        if (!active) return;
        setAppointments(Array.isArray(data?.appointments) ? data.appointments : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load appointments');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const sortedAppointments = useMemo(
    () => [...appointments].sort((left, right) => {
      const leftDate = toAppointmentDateTime(toDateInputValue(left.date), left.time)?.getTime() || 0;
      const rightDate = toAppointmentDateTime(toDateInputValue(right.date), right.time)?.getTime() || 0;
      return leftDate - rightDate;
    }),
    [appointments]
  );

  const upcomingAppointments = useMemo(
    () => sortedAppointments.filter((appointment) => ['Confirmed', 'Ready', 'In Progress', 'Pending'].includes(appointment.status)),
    [sortedAppointments]
  );

  const pastAppointments = useMemo(
    () => sortedAppointments.filter((appointment) => ['Completed', 'Cancelled', 'No Show'].includes(appointment.status)),
    [sortedAppointments]
  );

  const readyAppointments = useMemo(
    () => upcomingAppointments.filter((appointment) => appointment.status === 'Ready'),
    [upcomingAppointments]
  );

  const videoAppointments = useMemo(
    () => upcomingAppointments.filter((appointment) => appointment.type === 'Video Call'),
    [upcomingAppointments]
  );

  const nextAppointment = upcomingAppointments[0] || null;
  const completedCount = pastAppointments.filter((appointment) => appointment.status === 'Completed').length;

  const filteredUpcomingAppointments = useMemo(() => {
    if (activeTab === 'Ready') {
      return upcomingAppointments.filter((appointment) => appointment.status === 'Ready');
    }

    if (activeTab === 'Video') {
      return upcomingAppointments.filter((appointment) => appointment.type === 'Video Call');
    }

    return upcomingAppointments;
  }, [activeTab, upcomingAppointments]);

  function openManagePanel(appointment) {
    setManageOpenId(appointment._id);
    setManageDraft({
      id: appointment._id,
      date: toDateInputValue(appointment.date),
      time: appointment.time,
      type: appointment.type,
      cancellationReason: appointment.cancellationReason || ''
    });
    setError('');
    setStatusMessage('');
  }

  function closeManagePanel() {
    setManageOpenId('');
    setManageDraft({
      id: '',
      date: '',
      time: '10:00 AM',
      type: 'Video Call',
      cancellationReason: ''
    });
  }

  function updateManageDraft(patch) {
    setManageDraft((current) => ({ ...current, ...patch }));
    setError('');
    setStatusMessage('');
  }

  async function handleCancelAppointment(id) {
    try {
      setActionState(id);
      setError('');
      setStatusMessage('');
      await updateAppointmentStatus(id, {
        status: 'Cancelled',
        cancellationReason: manageDraft.id === id
          ? manageDraft.cancellationReason.trim() || 'Cancelled by student'
          : 'Cancelled by student'
      });
      closeManagePanel();
      setStatusMessage('Appointment cancelled successfully.');
      await loadAppointments();
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment');
    } finally {
      setActionState('');
    }
  }

  async function handleRescheduleAppointment(id) {
    if (manageDraft.id !== id || !manageDraft.date || !manageDraft.time) {
      setError('Choose a valid date and time before rescheduling.');
      return;
    }

    if (isPastSelection(manageDraft.date, manageDraft.time)) {
      setError('Please choose a future date and time before rescheduling.');
      return;
    }

    try {
      setActionState(id);
      setError('');
      setStatusMessage('');
      await rescheduleAppointment(id, {
        date: manageDraft.date,
        time: manageDraft.time,
        type: manageDraft.type
      });
      closeManagePanel();
      setStatusMessage('Appointment rescheduled successfully.');
      await loadAppointments();
    } catch (err) {
      setError(err.message || 'Failed to reschedule appointment');
    } finally {
      setActionState('');
    }
  }

  async function handleCheckIn(id) {
    try {
      setActionState(id);
      setError('');
      setStatusMessage('');
      await checkInAppointment(id);
      setStatusMessage('You are checked in. Your appointment is now marked as ready.');
      await loadAppointments();
    } catch (err) {
      setError(err.message || 'Failed to check in');
    } finally {
      setActionState('');
    }
  }

  return (
    <div className="student-shell pb-20">
      <div className="pt-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="student-hero px-8 py-10 w-full md:flex md:items-center md:justify-between gap-8">
          <div>
            <h1 className="text-4xl font-bold text-[#18181B] tracking-tight">My Appointments</h1>
            <p className="text-[#71717A] mt-2 text-lg">Track, reschedule, cancel, and check in for your appointments from one place.</p>
          </div>
          <Link
            to="/student/appointments/find"
            className="px-8 py-4 bg-[#2563EB] text-white rounded-full font-bold hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Book New Appointment
          </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 space-y-12">
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <SummaryCard
            label="Upcoming Visits"
            value={upcomingAppointments.length}
            hint="Confirmed, ready, or in-progress care"
            icon={Calendar}
            tone="bg-blue-50 text-[#2563EB]"
          />
          <SummaryCard
            label="Ready To Join"
            value={readyAppointments.length}
            hint="Checked in and waiting for the doctor"
            icon={CheckCircle2}
            tone="bg-indigo-50 text-indigo-600"
          />
          <SummaryCard
            label="Video Consultations"
            value={videoAppointments.length}
            hint="Appointments you can join from your device"
            icon={Video}
            tone="bg-purple-50 text-purple-600"
          />
          <SummaryCard
            label="Completed Visits"
            value={completedCount}
            hint="Medical history already available"
            icon={FileText}
            tone="bg-emerald-50 text-emerald-600"
          />
        </section>

        {statusMessage && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4 text-sm text-emerald-700">
            {statusMessage}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[1.25fr,0.75fr] gap-8">
          <div className="student-surface p-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-bold mb-3">Next Step</p>
            {nextAppointment ? (
              <>
                <h2 className="text-3xl font-bold text-[#18181B]">{nextAppointment.doctorName}</h2>
                <p className="text-[#71717A] mt-3 text-lg">
                  {formatDateLabel(nextAppointment.date)} at {nextAppointment.time} • {nextAppointment.type}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className={cn('px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider', statusTone[nextAppointment.status] || statusTone.Pending)}>
                    {nextAppointment.status}
                  </span>
                  <span className="px-4 py-2 rounded-full bg-[#F4F4F8] text-xs font-bold uppercase tracking-wider text-[#18181B]">
                    {nextAppointment.doctorSpecialty}
                  </span>
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  {nextAppointment.type === 'Video Call' ? (
                    canOpenVideoVisit(nextAppointment) ? (
                      <Link
                        to={`/student/consultation/${nextAppointment._id}`}
                        className="px-6 py-3 bg-[#2563EB] text-white rounded-full font-bold"
                      >
                        Open Visit
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="px-6 py-3 bg-[#E9EEF9] text-[#64748B] rounded-full font-bold cursor-not-allowed"
                      >
                        Video Locked
                      </button>
                    )
                  ) : (
                    <Link
                      to={`/student/appointments/${nextAppointment._id}/queue`}
                      className="px-6 py-3 bg-[#2563EB] text-white rounded-full font-bold"
                    >
                      Open Queue
                    </Link>
                  )}
                  {canCheckIn(nextAppointment) && (
                    <button
                      type="button"
                      onClick={() => handleCheckIn(nextAppointment._id)}
                      disabled={actionState === nextAppointment._id}
                      className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-full font-bold disabled:opacity-50"
                    >
                      {actionState === nextAppointment._id ? 'Checking in...' : 'Check In'}
                    </button>
                  )}
                  {canManageAppointment(nextAppointment.status) && (
                    <button
                      type="button"
                      onClick={() => openManagePanel(nextAppointment)}
                      className="px-6 py-3 bg-[#F4F4F8] text-[#18181B] rounded-full font-bold"
                    >
                      Manage Visit
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-[#18181B]">No visit booked yet</h2>
                <p className="text-[#71717A] mt-3 text-lg">Start by choosing a doctor, reviewing availability, and confirming a slot.</p>
                <Link to="/student/appointments/find" className="inline-flex mt-8 px-6 py-3 bg-[#2563EB] text-white rounded-full font-bold">
                  Find Doctor
                </Link>
              </>
            )}
          </div>

          <div className="student-surface p-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-6">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-[#18181B]">Care Checklist</h2>
            <div className="mt-6 space-y-3 text-sm text-[#71717A]">
              <p className="rounded-2xl bg-[#F4F4F8] px-4 py-4">Find a doctor based on specialty and availability.</p>
              <p className="rounded-2xl bg-[#F4F4F8] px-4 py-4">Reschedule or cancel directly from the appointment card if your plans change.</p>
              <p className="rounded-2xl bg-[#F4F4F8] px-4 py-4">Video appointments unlock only after the visit reaches ready status.</p>
            </div>
            {nextAppointment && (
              <Link
                to={getRevisitPath(nextAppointment)}
                className="block mt-6 rounded-2xl bg-[#F4F4F8] px-5 py-4 font-semibold text-[#18181B]"
              >
                Schedule a revisit with the same doctor
              </Link>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <h2 className="text-2xl font-bold text-[#18181B]">Upcoming appointments</h2>
            <div className="flex items-center gap-3 flex-wrap">
              {['Upcoming', 'Ready', 'Video'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider',
                    activeTab === tab ? 'bg-[#2563EB] text-white' : 'bg-[#F4F4F8] text-[#71717A]'
                  )}
                >
                  {tab}
                </button>
              ))}
              <Link to="/student/appointments/find" className="text-[#2563EB] font-bold text-sm hover:underline">
                Book another visit
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUpcomingAppointments.length === 0 ? (
                <div className="col-span-full py-12 text-center student-surface border-dashed">
                <p className="text-[#71717A]">
                  {activeTab === 'Ready'
                    ? 'No appointments are checked in yet.'
                    : activeTab === 'Video'
                      ? 'No upcoming video visits yet.'
                      : 'You do not have any upcoming appointments yet.'}
                </p>
              </div>
            ) : (
              filteredUpcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  actionState={actionState}
                  manageDraft={manageDraft}
                  manageOpenId={manageOpenId}
                  onOpenManage={openManagePanel}
                  onCloseManage={closeManagePanel}
                  onDraftChange={updateManageDraft}
                  onReschedule={handleRescheduleAppointment}
                  onCancel={handleCancelAppointment}
                  onCheckIn={handleCheckIn}
                />
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#18181B] mb-6">Quick actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link to="/student/appointments/find" className="student-card p-6">
              <Calendar className="w-6 h-6 text-[#2563EB] mb-4" />
              <p className="font-bold text-[#18181B]">Find Doctor</p>
            </Link>
            <Link to="/student/prescriptions" className="student-card p-6">
              <FileText className="w-6 h-6 text-emerald-600 mb-4" />
              <p className="font-bold text-[#18181B]">Prescription History</p>
            </Link>
            <Link to="/mental-health/counselors" className="student-card p-6">
              <MessageSquare className="w-6 h-6 text-purple-600 mb-4" />
              <p className="font-bold text-[#18181B]">Explore Counselors</p>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#18181B] mb-6">History</h2>
          <div className="student-surface rounded-2xl overflow-hidden">
            <div className="divide-y divide-[#F0F0F3]">
              {pastAppointments.length === 0 ? (
                <div className="p-6 text-[#71717A]">Completed and cancelled appointments will appear here.</div>
              ) : (
                pastAppointments.map((appointment) => (
                  <div key={appointment._id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F4F4F8]/30 transition-colors">
                    <div>
                      <h3 className="font-bold text-[#18181B]">{appointment.doctorName}</h3>
                      <p className="text-xs text-[#71717A]">
                        {appointment.doctorSpecialty} • {formatDateLabel(appointment.date)} • {appointment.time}
                      </p>
                      {appointment.cancellationReason && (
                        <p className="text-xs text-rose-600 mt-2">{appointment.cancellationReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={cn('px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', statusTone[appointment.status] || statusTone.Pending)}>
                        {appointment.status}
                      </span>
                      {appointment.status === 'Completed' && (
                        <Link
                          to={`/student/appointments/${appointment._id}/feedback`}
                          className="text-sm font-semibold text-[#2563EB]"
                        >
                          Leave feedback
                        </Link>
                      )}
                      <Link
                        to={getRevisitPath(appointment)}
                        className="text-sm font-semibold text-[#18181B]"
                      >
                        Rebook
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {loading && <p className="text-sm text-[#71717A]">Loading appointments...</p>}
      </div>
    </div>
  );
}
