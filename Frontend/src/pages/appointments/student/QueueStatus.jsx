import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, Video } from 'lucide-react';
import { canOpenVideoVisit, checkInAppointment, getAppointmentById, getVideoVisitBlockedReason } from '../../../lib/appointments';

function formatDateLabel(value) {
  return new Date(value).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function QueueStatus() {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionState, setActionState] = useState(false);
  const [helperMessage, setHelperMessage] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getAppointmentById(appointmentId);
        if (!active) return;
        setAppointment(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load queue details');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [appointmentId]);

  async function handleCheckIn() {
    try {
      setActionState(true);
      const updated = await checkInAppointment(appointmentId);
      setAppointment(updated);
    } catch (err) {
      setError(err.message || 'Failed to check in');
    } finally {
      setActionState(false);
    }
  }

  function handleCalendarHelper() {
    setHelperMessage('Calendar export is demo-ready here: use this appointment time to add a reminder in your preferred calendar app.');
  }

  if (loading) return <div className="student-shell pt-36 px-6">Loading queue status...</div>;
  if (error || !appointment) return <div className="student-shell pt-36 px-6 text-red-600">{error || 'Appointment not found'}</div>;

  const checkedIn = Boolean(appointment.checkInAt);

  return (
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
              Status: {appointment.status}
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
              className="w-full py-4 bg-white border border-[#F0F0F3] text-primary-text rounded-2xl font-bold"
            >
              Add Reminder / Export Time
            </button>
            {helperMessage && (
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 text-sm text-amber-800">
                {helperMessage}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

