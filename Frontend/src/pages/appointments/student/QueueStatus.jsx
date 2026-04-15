import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, Video } from 'lucide-react';
import { canOpenVideoVisit, getVideoVisitBlockedReason } from '../../../lib/appointments';
import { useAppointmentById } from '../../../hooks/useAppointments';
import { useSocket } from '../../../hooks/useSocket';
import { LoadingState } from '../../../components/LoadingState';
import { AppointmentStatusBadge } from '../../../components/AppointmentStatusBadge';
import ErrorBoundary from '../../../components/ErrorBoundary';

function formatDateLabel(value) {
  return new Date(value).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function QueueStatus() {
  const { appointmentId } = useParams();
  const [actionState, setActionState] = useState(false);
  const [queuePos, setQueuePos] = useState(null);
  const [doctorReady, setDoctorReady] = useState(false);

  // PHASE 3: Use new hook with auto-refresh every 5 seconds
  const { appointment, loading, error, refetch, checkInAppointment } = useAppointmentById(appointmentId, {
    refreshInterval: 5000
  });

  // PHASE 4: Real-time socket updates
  const { listenForDoctorReady, listenForQueuePosition, subscribeAppointment } = useSocket();

  // Subscribe to real-time appointment updates
  useEffect(() => {
    if (!appointmentId) return;

    // Listen for doctor marking ready
    const removeDoctorReady = listenForDoctorReady(appointmentId, () => {
      console.log('✅ Doctor is ready!');
      setDoctorReady(true);
      refetch(); // Also fetch latest appointment state
    });

    // Listen for queue position updates
    const removeQueuePosition = listenForQueuePosition(appointmentId, (position) => {
      setQueuePos(position);
    });

    // Subscribe to overall appointment updates
    const unsubscribeAppointment = subscribeAppointment(appointmentId, (updated) => {
      // Auto-refetch will handle UI update
      if (updated.status === 'Ready') {
        setDoctorReady(true);
      }
    });

    return () => {
      removeDoctorReady?.();
      removeQueuePosition?.();
      unsubscribeAppointment?.();
    };
  }, [appointmentId, listenForDoctorReady, listenForQueuePosition, subscribeAppointment, refetch]);

  async function handleCheckIn() {
    try {
      setActionState(true);
      // PHASE 3: Use hook method
      await checkInAppointment(appointmentId);
      // Hook automatically updates state
    } catch (err) {
      alert(`Failed to check in: ${err.message}`);
    } finally {
      setActionState(false);
    }
  }

  function handleCalendarHelper() {
    alert('Calendar export is demo-ready here: use this appointment time to add a reminder in your preferred calendar app.');
  }

  // Determine if checked in (student has checked in)
  const checkedIn =
    Boolean(appointment?.checkInAt) ||
    ['Ready', 'In Progress', 'Completed'].includes(appointment?.status);

  // PHASE 3: Show loading skeleton
  if (loading) return <LoadingState message="Loading queue status..." />;
  if (error || !appointment) {
    return (
      <div className="student-shell pt-36 px-6">
        <div className="max-w-md mx-auto text-center">
          <p className="text-red-600">{error || 'Appointment not found'}</p>
          <Link to="/student/appointments" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="student-shell pt-36 px-6 pb-20">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="student-surface p-8">
          <h1 className="text-3xl font-bold text-primary-text">Queue status</h1>
          <p className="text-secondary-text mt-3">Stay ready for your visit and check in before the consultation begins.</p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl bg-[#edf5f8] p-5">
              <p className="font-bold text-primary-text">{appointment.doctorName}</p>
              <p className="text-sm text-secondary-text mt-1">{appointment.doctorSpecialty}</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-secondary-text">
              <Calendar className="w-4 h-4" />
              {formatDateLabel(appointment.date)} at {appointment.time}
            </div>
            <div className="flex items-center gap-3 text-sm text-secondary-text">
              <Video className="w-4 h-4" />
              {appointment.type}
            </div>
            <div className="flex items-center gap-3 text-sm text-secondary-text">
              <Clock className="w-4 h-4" />
              <AppointmentStatusBadge status={appointment.status} size="sm" />
            </div>
          </div>
        </section>

        <section className="student-surface p-8">
          <div className="rounded-3xl bg-[#e8f7f5] border border-emerald-100 p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-primary mb-2">Check-in state</p>
            <p className="text-2xl font-bold text-primary-text">{checkedIn ? 'Checked in' : 'Pending check-in'}</p>
            <p className="text-sm text-secondary-text mt-3">
              {checkedIn
                ? 'You are marked as ready. Keep this page open for the next step in your visit.'
                : 'Check in before joining the consultation or arriving for your in-person visit.'}
            </p>

            {/* PHASE 4: Real-time indicator for doctor status */}
            {checkedIn && doctorReady && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700 font-semibold">🟢 Doctor is ready for you!</p>
              </div>
            )}

            {/* Queue position (if available) */}
            {queuePos && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  Queue position: <span className="font-bold">{queuePos.queuePosition}</span> of {queuePos.totalInQueue}
                </p>
                {(queuePos.estimatedWait ?? null) !== null && (
                  <p className="text-xs text-blue-600 mt-1">
                    Estimated wait: {queuePos.estimatedWait} minutes
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4">
            {!checkedIn && (
              <button
                onClick={handleCheckIn}
                disabled={actionState}
                className="w-full py-4 bg-accent-primary text-white rounded-2xl font-bold disabled:opacity-50"
              >
                {actionState ? 'Checking in...' : 'Confirm Check-In'}
              </button>
            )}
            {appointment.type === 'Video Call' && (
              canOpenVideoVisit(appointment) ? (
                <Link
                  to={`/student/consultation/${appointment._id}`}
                  className="w-full py-4 bg-[#edf5f8] text-primary-text rounded-2xl font-bold text-center block"
                >
                  Open Consultation Page
                </Link>
              ) : (
                <div className="rounded-2xl bg-[#edf5f8] border border-[#E2E8F0] p-5 text-sm text-[#64748B]">
                  {getVideoVisitBlockedReason(appointment)}
                </div>
              )
            )}
            {checkedIn && (
              <div className="rounded-2xl bg-[#e8f4f8] border border-blue-100 p-5 text-sm text-[#1D4ED8] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5" />
                Your check-in is saved. The doctor can now move you into the consultation flow.
              </div>
            )}
            <button
              type="button"
              onClick={handleCalendarHelper}
              className="w-full py-4 bg-white border border-border-gray text-primary-text rounded-2xl font-bold"
            >
              Add Reminder / Export Time
            </button>
          </div>
        </section>
      </div>
      </div>
    </ErrorBoundary>
  );
}
