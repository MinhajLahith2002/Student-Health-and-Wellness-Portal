import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Search,
  Stethoscope,
  Video,
  XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../../hooks/useAuth';
import { useAppointments } from '../../../hooks/useAppointments';
import { useSocket } from '../../../hooks/useSocket';
import { getProviders, getProviderAvailability } from '../../../lib/providers';
import { LoadingState } from '../../../components/LoadingState';
import { AppointmentStatusBadge } from '../../../components/AppointmentStatusBadge';
import ErrorBoundary from '../../../components/ErrorBoundary';
import {
  canOpenVideoVisit,
  getVideoVisitBlockedReason
} from '../../../lib/appointments';
import { cn } from '../../../lib/utils';

const TIME_OPTIONS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
];
function formatDateLabel(value) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTimeLabel(timeValue) {
  if (!timeValue) return 'Time unavailable';

  const match = `${timeValue}`.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return timeValue;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    const safeHours = hours % 12 || 12;
    return `${String(safeHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
  }

  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
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
    <div className="bg-white p-6 rounded-[28px] border border-border-gray shadow-sm">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-5', tone)}>
        <CardIcon className="w-6 h-6" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">{label}</p>
      <p className="text-3xl font-bold text-primary-text mt-2">{value}</p>
      <p className="text-sm text-secondary-text mt-3">{hint}</p>
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
      className="bg-white p-6 rounded-2xl border border-border-gray shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-primary-text">{appointment.doctorName}</h3>
          <p className="text-sm text-secondary-text">{appointment.doctorSpecialty}</p>
        </div>
        <AppointmentStatusBadge status={appointment.status} size="sm" />
      </div>

      <div className="space-y-3 mb-6 text-sm text-secondary-text">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4" />
          {formatDateLabel(appointment.date)}
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4" />
          {formatTimeLabel(appointment.time)}
        </div>
        <div className="flex items-center gap-3">
          {appointment.type === 'Video Call' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
          {appointment.type === 'Video Call' ? 'Video Call' : appointment.location || 'Campus Health Center'}
        </div>
      </div>

      {appointment.symptoms && (
        <p className="text-sm text-secondary-text mb-4">{appointment.symptoms}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {appointment.type === 'Video Call' ? (
          canOpenVideo ? (
            <Link
              to={primaryPath}
              className="py-3 bg-accent-primary text-white rounded-xl font-bold text-sm text-center hover:bg-[#105f72] transition-all"
            >
              {appointment.status === 'Ready' ? 'Join Visit' : 'Open Visit'}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="py-3 bg-secondary-bg text-secondary-text rounded-xl font-bold text-sm text-center cursor-not-allowed"
            >
              Video Locked
            </button>
          )
        ) : (
          <Link
            to={primaryPath}
            className="py-3 bg-accent-primary text-white rounded-xl font-bold text-sm text-center hover:bg-[#105f72] transition-all"
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
              isManageOpen ? 'bg-accent-primary text-white' : 'bg-secondary-bg text-primary-text hover:bg-border-gray/50'
            )}
          >
            {isManageOpen ? 'Close Manage' : 'Manage Booking'}
          </button>
        ) : (
          <Link
            to={getRevisitPath(appointment)}
            className="py-3 bg-secondary-bg text-primary-text rounded-xl font-bold text-sm text-center"
          >
            Revisit Doctor
          </Link>
        )}

        {appointment.status === 'Completed' ? (
          <Link
            to={`/student/appointments/${appointment._id}/feedback`}
            className="sm:col-span-2 py-3 bg-white border border-border-gray text-primary-text rounded-xl font-bold text-sm text-center"
          >
            Leave Feedback
          </Link>
        ) : (
          <Link
            to={getRevisitPath(appointment)}
            className="sm:col-span-2 py-3 bg-white border border-border-gray text-primary-text rounded-xl font-bold text-sm text-center"
          >
            Schedule Revisit
          </Link>
        )}
      </div>

      {appointment.type === 'Video Call' && !canOpenVideo && (
        <p className="mt-4 text-xs text-secondary-text">{getVideoVisitBlockedReason(appointment)}</p>
      )}

      {isManageOpen && (
        <div className="mt-6 rounded-3xl bg-secondary-bg p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Manage booking</p>
              <p className="text-sm text-secondary-text mt-2">Reschedule or cancel this appointment without leaving the page.</p>
            </div>
            <button
              type="button"
              onClick={onCloseManage}
              className="text-sm font-semibold text-secondary-text"
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
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent-primary text-white font-bold disabled:opacity-50"
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
  const { user } = useAuth();
  const [statusMessage, setStatusMessage] = useState('');
  const [actionState, setActionState] = useState('');
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [doctorSuggestions, setDoctorSuggestions] = useState([]);
  const [doctorSuggestionsLoading, setDoctorSuggestionsLoading] = useState(true);
  const [doctorSuggestionsError, setDoctorSuggestionsError] = useState('');
  const [bookingPreviewDate, setBookingPreviewDate] = useState(getTodayValue());
  const [bookingSearch, setBookingSearch] = useState('');
  const [manageOpenId, setManageOpenId] = useState('');
  const [manageDraft, setManageDraft] = useState({
    id: '',
    date: '',
    time: '10:00 AM',
    type: 'Video Call',
    cancellationReason: ''
  });

  // PHASE 3: Use new useAppointments hook (replaces localStorage)
  const {
    appointments,
    loading,
    error,
    refetch,
    rescheduleAppointment,
    cancelAppointment,
    checkInAppointment
  } = useAppointments(user?.id);

  const { subscribeAppointment, unsubscribeAppointment, listenForAvailabilityUpdates } = useSocket();

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

  useEffect(() => {
    const id = nextAppointment?._id;
    if (!id) return undefined;

    subscribeAppointment(id, () => {
      refetch();
    });

    return () => {
      unsubscribeAppointment(id);
    };
  }, [nextAppointment?._id, subscribeAppointment, unsubscribeAppointment, refetch]);

  const fetchDoctorSuggestions = useCallback(async () => {
    setDoctorSuggestionsLoading(true);
    setDoctorSuggestionsError('');

    try {
      const providerResponse = await getProviders({ role: 'doctor', publishedOnly: 'true' });
      const providers = Array.isArray(providerResponse?.providers) ? providerResponse.providers : [];

      const suggestions = await Promise.all(providers.map(async (provider) => {
        try {
          const availability = await getProviderAvailability(provider._id, bookingPreviewDate);
          const availableSlots = Array.isArray(availability?.availableSlots) ? availability.availableSlots : [];
          const availabilityEntries = Array.isArray(availability?.entries) ? availability.entries : [];
          const bookedSlots = Array.isArray(availability?.bookedSlots) ? availability.bookedSlots : [];

          return {
            ...provider,
            previewDate: bookingPreviewDate,
            requestedDate: bookingPreviewDate,
            availableSlots: availableSlots.slice(0, 4),
            availabilityEntries,
            bookedSlots,
            foundUpcomingAvailability: availableSlots.length > 0 || availabilityEntries.length > 0
          };
        } catch {
          return {
            ...provider,
            previewDate: bookingPreviewDate,
            requestedDate: bookingPreviewDate,
            availableSlots: [],
            availabilityEntries: [],
            bookedSlots: [],
            foundUpcomingAvailability: false
          };
        }
      }));

      setDoctorSuggestions(suggestions);
    } catch (err) {
      setDoctorSuggestions([]);
      setDoctorSuggestionsError(err.message || 'Failed to load live doctor availability.');
    } finally {
      setDoctorSuggestionsLoading(false);
    }
  }, [bookingPreviewDate]);

  useEffect(() => {
    fetchDoctorSuggestions();
  }, [fetchDoctorSuggestions]);

  useEffect(() => {
    const removeAvailabilityListener = listenForAvailabilityUpdates(() => {
      fetchDoctorSuggestions();
    });

    return () => {
      removeAvailabilityListener?.();
    };
  }, [fetchDoctorSuggestions, listenForAvailabilityUpdates]);

  const filteredDoctorSuggestions = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();
    const visibleSuggestions = doctorSuggestions.filter((doctor) => (
      doctor.foundUpcomingAvailability
    ));

    const matchingSuggestions = !query
      ? visibleSuggestions
      : visibleSuggestions.filter((doctor) => (
      doctor.name.toLowerCase().includes(query)
      || (doctor.specialty || '').toLowerCase().includes(query)
    ));

    const dedupedSuggestions = [...matchingSuggestions.reduce((map, doctor) => {
      const dedupeKey = `${doctor.name.trim().toLowerCase()}|${(doctor.specialty || '').trim().toLowerCase()}`;
      const currentScore = (doctor.availableSlots.length * 10) + doctor.availabilityEntries.length;
      const existing = map.get(dedupeKey);
      const existingScore = existing ? (existing.availableSlots.length * 10) + existing.availabilityEntries.length : -1;

      if (!existing || currentScore > existingScore) {
        map.set(dedupeKey, doctor);
      }

      return map;
    }, new Map()).values()];

    return dedupedSuggestions.sort((left, right) => {
      const leftTime = new Date(left.previewDate).getTime();
      const rightTime = new Date(right.previewDate).getTime();

      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      return left.name.localeCompare(right.name);
    });
  }, [bookingSearch, doctorSuggestions]);

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
      time: formatTimeLabel(appointment.time),
      type: appointment.type,
      cancellationReason: appointment.cancellationReason || ''
    });
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
    setStatusMessage('');
  }

  async function handleCancelAppointment(id) {
    try {
      setActionState(id);
      setStatusMessage('');
      // PHASE 3: Use new hook method with API call
      await cancelAppointment(id, manageDraft.id === id
        ? manageDraft.cancellationReason.trim() || 'Cancelled by student'
        : 'Cancelled by student'
      );
      closeManagePanel();
      setStatusMessage('Appointment cancelled successfully.');
      // Hook automatically updates state
    } catch (err) {
      setStatusMessage(''); // Clear success message
      alert(`Failed to cancel appointment: ${err.message}`);
    } finally {
      setActionState('');
    }
  }

  async function handleRescheduleAppointment(id) {
    if (manageDraft.id !== id || !manageDraft.date || !manageDraft.time) {
      alert('Choose a valid date and time before rescheduling.');
      return;
    }

    if (isPastSelection(manageDraft.date, manageDraft.time)) {
      alert('Please choose a future date and time before rescheduling.');
      return;
    }

    try {
      setActionState(id);
      setStatusMessage('');
      // PHASE 3: Use new hook method with API call
      await rescheduleAppointment(id, manageDraft.date, manageDraft.time);
      closeManagePanel();
      setStatusMessage('Appointment rescheduled successfully.');
      // Hook automatically updates state
    } catch (err) {
      setStatusMessage(''); // Clear success message
      alert(`Failed to reschedule appointment: ${err.message}`);
    } finally {
      setActionState('');
    }
  }

  async function handleCheckIn(id) {
    try {
      setActionState(id);
      setStatusMessage('');
      // PHASE 3: Use new hook method with API call
      await checkInAppointment(id);
      setStatusMessage('You are checked in. Your appointment is now marked as ready.');
      // Hook automatically updates state
    } catch (err) {
      setStatusMessage(''); // Clear success message
      alert(`Failed to check in: ${err.message}`);
    } finally {
      setActionState('');
    }
  }

  return (
    <ErrorBoundary>
      <div className="student-shell pb-20">
        {/* Show loading skeleton on initial load */}
        {loading && appointments.length === 0 ? (
          <LoadingState message="Loading your appointments..." />
        ) : (
          <>
            <div className="pt-32 px-6">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="student-hero px-8 py-10 w-full md:flex md:items-center md:justify-between gap-8">
                  <div>
                    <h1 className="text-4xl font-bold text-primary-text tracking-tight">My Appointments</h1>
                    <p className="text-secondary-text mt-2 text-lg">Track, reschedule, cancel, and check in for your appointments from one place.</p>
                  </div>
                  <Link
                    to="/student/appointments/find"
                    className="px-8 py-4 bg-accent-primary text-white rounded-full font-bold hover:bg-[#105f72] transition-all shadow-lg shadow-accent-primary/15 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Book New Appointment
                  </Link>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-12 space-y-12">
              {/* PHASE 3: Show error with retry button */}
              {error && (
                <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-4 flex items-center justify-between gap-4">
                  <div className="text-sm text-rose-700">
                    <p className="font-bold">Failed to load appointments</p>
                    <p>{error}</p>
                  </div>
                  <button
                    onClick={refetch}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 whitespace-nowrap"
                  >
                    Retry
                  </button>
                </div>
              )}

              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <SummaryCard
                  label="Upcoming Visits"
                  value={upcomingAppointments.length}
                  hint="Confirmed, ready, or in-progress care"
                  icon={Calendar}
                  tone="bg-accent-primary/10 text-accent-primary"
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

              <section className="grid grid-cols-1 xl:grid-cols-[1.25fr,0.75fr] gap-8">
                <div className="student-surface p-8">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3">Next Step</p>
                  {nextAppointment ? (
                    <>
                      <h2 className="text-3xl font-bold text-primary-text">{nextAppointment.doctorName}</h2>
                      <p className="text-secondary-text mt-3 text-lg">
                        {formatDateLabel(nextAppointment.date)} at {nextAppointment.time} • {nextAppointment.type}
                      </p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <AppointmentStatusBadge status={nextAppointment.status} size="md" />
                        <span className="px-4 py-2 rounded-full bg-secondary-bg text-xs font-bold uppercase tracking-wider text-primary-text">
                          {nextAppointment.doctorSpecialty}
                        </span>
                      </div>
                      <div className="mt-8 flex flex-wrap gap-4">
                        {nextAppointment.type === 'Video Call' ? (
                          canOpenVideoVisit(nextAppointment) ? (
                            <Link
                              to={`/student/consultation/${nextAppointment._id}`}
                              className="px-6 py-3 bg-accent-primary text-white rounded-full font-bold"
                            >
                              Open Visit
                            </Link>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="px-6 py-3 bg-secondary-bg text-secondary-text rounded-full font-bold cursor-not-allowed"
                            >
                              Video Locked
                            </button>
                          )
                        ) : (
                          <Link
                            to={`/student/appointments/${nextAppointment._id}/queue`}
                            className="px-6 py-3 bg-accent-primary text-white rounded-full font-bold"
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
                            className="px-6 py-3 bg-secondary-bg text-primary-text rounded-full font-bold"
                          >
                            Manage Visit
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-bold text-primary-text">No visit booked yet</h2>
                      <p className="text-secondary-text mt-3 text-lg">Start by choosing a doctor, reviewing availability, and confirming a slot.</p>
                      <Link to="/student/appointments/find" className="inline-flex mt-8 px-6 py-3 bg-accent-primary text-white rounded-full font-bold">
                        Find Doctor
                      </Link>
                    </>
                  )}
                </div>

                <div className="student-surface p-8">
                  <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-6">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold text-primary-text">Care Checklist</h2>
                  <div className="mt-6 space-y-3 text-sm text-secondary-text">
                    <p className="rounded-2xl bg-secondary-bg px-4 py-4">Find a doctor based on specialty and availability.</p>
                    <p className="rounded-2xl bg-secondary-bg px-4 py-4">Reschedule or cancel directly from the appointment card if your plans change.</p>
                    <p className="rounded-2xl bg-secondary-bg px-4 py-4">Video appointments unlock when the doctor starts the call or the visit reaches ready status.</p>
                  </div>
                  {nextAppointment && (
                    <Link
                      to={getRevisitPath(nextAppointment)}
                      className="block mt-6 rounded-2xl bg-secondary-bg px-5 py-4 font-semibold text-primary-text"
                    >
                      Schedule a revisit with the same doctor
                    </Link>
                  )}
                </div>
              </section>

        <section>
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <h2 className="text-2xl font-bold text-primary-text">Upcoming appointments</h2>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                'Upcoming',
                'Ready',
                'Video'
              ].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider',
                    activeTab === tab ? 'bg-accent-primary text-white' : 'bg-secondary-bg text-secondary-text'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="student-surface p-6 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-2">Live Booking Flow</p>
              <h3 className="text-xl font-bold text-primary-text">Published doctor schedules appear below in real time</h3>
              <p className="text-sm text-secondary-text mt-2 max-w-2xl">
                Doctors first publish availability in Manage Availability. This student view now shows only the schedules published for the exact date you select below, so the visible cards match that chosen day.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="#live-availability"
                className="px-5 py-3 bg-accent-primary text-white rounded-2xl font-bold text-sm"
              >
                Open Live Availability
              </a>
              <Link
                to="/student/appointments/find"
                className="px-5 py-3 bg-secondary-bg text-primary-text rounded-2xl font-bold text-sm"
              >
                Browse All Doctors
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUpcomingAppointments.length === 0 ? (
              <div className="col-span-full py-12 text-center student-surface border-dashed">
                <p className="text-secondary-text">
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

        <section id="live-availability" className="space-y-6 scroll-mt-32">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-2">Separate Real-Time Feed</p>
              <h2 className="text-2xl font-bold text-primary-text">Live doctor availability</h2>
              <p className="text-sm text-secondary-text mt-2 max-w-3xl">
                These cards are generated from the doctor&apos;s published Manage Availability schedules. As soon as a doctor adds, updates, or books a slot, this section refreshes from the same backend availability API used by the full booking page.
              </p>
            </div>
            <span className="px-4 py-2 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold uppercase tracking-[0.18em]">
              Real-Time
            </span>
          </div>

          <div className="student-surface p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr,auto] gap-4 items-end">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3 block">
                  Preview Date
                </span>
                <input
                  type="date"
                  min={getTodayValue()}
                  value={bookingPreviewDate}
                  onChange={(event) => setBookingPreviewDate(event.target.value)}
                  className="w-full px-4 py-4 bg-secondary-bg rounded-2xl outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3 block">
                  Search Doctor
                </span>
                <div className="relative">
                  <Search className="w-4 h-4 text-secondary-text absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(event) => setBookingSearch(event.target.value)}
                    placeholder="Search by name or specialty"
                    className="w-full pl-11 pr-4 py-4 bg-secondary-bg rounded-2xl outline-none"
                  />
                </div>
              </label>

              <Link
                to="/student/appointments/find"
                className="inline-flex items-center justify-center px-5 py-4 bg-white border border-border-gray text-primary-text rounded-2xl font-bold text-sm"
              >
                Full Doctor Directory
              </Link>
            </div>

            <p className="text-sm text-secondary-text mt-4">
              Showing only published doctor availability for {formatDateLabel(bookingPreviewDate)}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {doctorSuggestionsLoading ? (
              <div className="col-span-full py-12 text-center student-surface border-dashed">
                <p className="text-secondary-text">Loading doctor availability cards...</p>
              </div>
            ) : doctorSuggestionsError ? (
              <div className="col-span-full py-12 text-center student-surface border-dashed">
                <p className="text-secondary-text">{doctorSuggestionsError}</p>
              </div>
            ) : filteredDoctorSuggestions.length === 0 ? (
              <div className="col-span-full py-12 text-center student-surface border-dashed">
                <p className="text-secondary-text">No doctor has published availability for this selected date yet. Try another date or open the full doctor directory.</p>
              </div>
            ) : (
              filteredDoctorSuggestions.map((doctor) => (
                <motion.article
                  key={doctor._id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="bg-white p-6 rounded-2xl border border-border-gray shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="font-bold text-primary-text">{doctor.name}</h3>
                      <p className="text-sm text-secondary-text">{doctor.specialty || 'General Physician'}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold">
                      Active
                    </span>
                  </div>

                  <div className="rounded-2xl bg-secondary-bg px-4 py-4 mb-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-secondary-text font-bold mb-2">
                      Published Availability
                    </p>
                    <p className="text-sm font-semibold text-primary-text">
                      {formatDateLabel(doctor.previewDate)}
                    </p>
                    <p className="text-xs text-secondary-text mt-2">
                      Filtered exactly to the student-selected date.
                    </p>
                  </div>

                  {doctor.availabilityEntries.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {doctor.availabilityEntries.map((entry) => (
                        <div key={`${doctor._id}-${entry._id || entry.title || `${entry.startTime}-${entry.endTime}`}`} className="rounded-2xl border border-border-gray px-4 py-3">
                          <p className="text-sm font-semibold text-primary-text">
                            {entry.title || `${entry.startTime} - ${entry.endTime}`}
                          </p>
                          <p className="text-xs text-secondary-text mt-1">
                            {(entry.consultationTypes || []).join(', ') || 'All consultation types'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {doctor.availableSlots.length > 0 ? doctor.availableSlots.map((slot) => (
                      <span key={`${doctor._id}-${slot}`} className="px-3 py-2 rounded-full bg-secondary-bg text-xs font-bold text-primary-text">
                        {formatTimeLabel(slot)}
                      </span>
                    )) : (
                      <p className="text-sm text-secondary-text">No free slots were returned for this date.</p>
                    )}
                  </div>

                  <p className="text-xs text-secondary-text mb-5">
                    {doctor.availableSlots.length > 0
                      ? `Next free slot: ${formatTimeLabel(doctor.availableSlots[0])}`
                      : doctor.bookedSlots.length > 0
                        ? `${doctor.bookedSlots.length} slot(s) are already booked on this published date`
                        : 'Open the full profile to inspect more dates and consultation details.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to={`/student/appointments/doctors/${doctor._id}`}
                      className="py-3 bg-secondary-bg text-primary-text rounded-xl font-bold text-sm text-center"
                    >
                      View Profile
                    </Link>
                    <Link
                      to={`/student/appointments/book/${doctor._id}?date=${doctor.previewDate}`}
                      className="py-3 bg-accent-primary text-white rounded-xl font-bold text-sm text-center"
                    >
                      {doctor.availableSlots.length > 0 ? 'Book Slot' : 'View Dates'}
                    </Link>
                  </div>
                </motion.article>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-primary-text mb-2">Past appointments</h2>
          <div className="student-surface rounded-2xl overflow-hidden">
            <div className="divide-y divide-border-gray">
              {pastAppointments.length === 0 ? (
                <div className="p-6 text-secondary-text">Completed and cancelled appointments will appear here.</div>
              ) : (
                pastAppointments.map((appointment) => (
                  <div key={appointment._id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-secondary-bg/30 transition-colors">
                    <div>
                      <h3 className="font-bold text-primary-text">{appointment.doctorName}</h3>
                      <p className="text-xs text-secondary-text">
                        {appointment.doctorSpecialty} • {formatDateLabel(appointment.date)} • {appointment.time}
                      </p>
                      {appointment.cancellationReason && (
                        <p className="text-xs text-rose-600 mt-2">{appointment.cancellationReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <AppointmentStatusBadge status={appointment.status} size="sm" />
                      {appointment.status === 'Completed' && (
                        <Link
                          to={`/student/appointments/${appointment._id}/feedback`}
                          className="text-sm font-semibold text-accent-primary"
                        >
                          Leave feedback
                        </Link>
                      )}
                      <Link
                        to={getRevisitPath(appointment)}
                        className="text-sm font-semibold text-primary-text"
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

        <section>
          <h2 className="text-2xl font-bold text-primary-text mb-6">Quick actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link to="/student/appointments/find" className="student-card p-6">
              <Calendar className="w-6 h-6 text-accent-primary mb-4" />
              <p className="font-bold text-primary-text">Find Doctor</p>
            </Link>
            <Link to="/student/prescriptions" className="student-card p-6">
              <FileText className="w-6 h-6 text-accent-green mb-4" />
              <p className="font-bold text-primary-text">Prescription History</p>
            </Link>
            <Link to="/mental-health/counselors" className="student-card p-6">
              <MessageSquare className="w-6 h-6 text-accent-purple mb-4" />
              <p className="font-bold text-primary-text">Explore Counselors</p>
            </Link>
          </div>
        </section>
      </div>
      </>
        )}
      </div>
    </ErrorBoundary>
  );
}
