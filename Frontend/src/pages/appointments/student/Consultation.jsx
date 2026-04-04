import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, FileText, PhoneOff, Video, VideoOff } from 'lucide-react';
import { canOpenVideoVisit, getAppointmentById, getVideoVisitBlockedReason } from '../../../lib/appointments';

function formatDateLabel(value) {
  return new Date(value).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function Consultation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const data = await getAppointmentById(id);
        if (!active) return;
        setAppointment(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load consultation');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-[#18181B] text-white flex items-center justify-center">Loading consultation...</div>;
  }

  if (error || !appointment) {
    return <div className="min-h-screen bg-[#18181B] text-white flex items-center justify-center">{error || 'Consultation not found'}</div>;
  }

  if (!canOpenVideoVisit(appointment)) {
    return (
      <div className="min-h-screen bg-[#18181B] text-white flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-[32px] border border-white/10 bg-white/5 backdrop-blur p-8 text-center">
          <h1 className="text-3xl font-bold">Video Visit Locked</h1>
          <p className="text-white/70 mt-4">{getVideoVisitBlockedReason(appointment)}</p>
          <button
            onClick={() => navigate('/student/appointments')}
            className="mt-8 px-6 py-3 bg-white text-primary-text rounded-2xl font-bold"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#18181B] text-white flex flex-col lg:flex-row">
      <div className="flex-1 p-6 lg:p-10 flex items-center justify-center relative">
        <div className="w-full h-[70vh] rounded-[40px] bg-slate-900 border border-white/10 overflow-hidden relative">
          {videoEnabled ? (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.45),_transparent_45%),linear-gradient(135deg,#0f172a,#111827)]" />
          ) : (
            <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
              <VideoOff className="w-16 h-16 text-white/40" />
            </div>
          )}
          <div className="absolute bottom-10 left-10">
            <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
              <p className="text-xl font-bold">{appointment.doctorName}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70 mt-1">{appointment.doctorSpecialty}</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={() => setVideoEnabled((current) => !current)}
            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl text-white flex items-center justify-center border border-white/10"
          >
            {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
          <button
            onClick={() => navigate('/student/appointments')}
            className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-rose-900/30"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>

      <aside className="w-full lg:w-[420px] bg-white text-primary-text p-8 space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Consultation</p>
          <h1 className="text-3xl font-bold mt-2">Visit details</h1>
        </div>

        <div className="rounded-3xl bg-[#edf5f8] p-6 space-y-4">
          <div className="flex items-center gap-3 text-sm text-secondary-text">
            <Calendar className="w-4 h-4" />
            {formatDateLabel(appointment.date)} at {appointment.time}
          </div>
          <div className="flex items-center gap-3 text-sm text-secondary-text">
            <Video className="w-4 h-4" />
            {appointment.type}
          </div>
          <div className="flex items-center gap-3 text-sm text-secondary-text">
            <FileText className="w-4 h-4" />
            Status: {appointment.status}
          </div>
          {appointment.meetingLink && (
            <a href={appointment.meetingLink} target="_blank" rel="noreferrer" className="text-sm font-semibold text-accent-primary">
              Open meeting link
            </a>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3">Symptoms / reason</p>
          <p className="text-sm text-primary-text leading-relaxed">
            {appointment.symptoms || 'No symptoms were entered before this visit.'}
          </p>
        </div>

        {appointment.prescriptionId && (
          <button
            onClick={() => navigate('/student/prescriptions')}
            className="w-full py-4 bg-accent-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            View Prescription
          </button>
        )}

        {appointment.status === 'Completed' && (
          <button
            onClick={() => navigate(`/student/appointments/${appointment._id}/feedback`)}
            className="w-full py-4 bg-[#edf5f8] text-primary-text rounded-2xl font-bold"
          >
            Leave Feedback
          </button>
        )}
      </aside>
    </div>
  );
}

