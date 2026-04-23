import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, FileText, PhoneOff, Video, VideoOff, AlertCircle, RefreshCw, Share2, Minimize2 } from 'lucide-react';
import { canOpenVideoVisit, getAppointmentById, getVideoVisitBlockedReason } from '../../../lib/appointments';
import { useJitsi } from '../../../hooks/useJitsi';
import { useSocket } from '../../../hooks/useSocket';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { LoadingState } from '../../../components/LoadingState';

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
  const videoContainerRef = useRef(null);
  const { subscribeAppointment, unsubscribeAppointment } = useSocket();

  // PHASE 4: Initialize Jitsi
  const {
    isVideoReady,
    isScreenSharing,
    participants,
    error: jitsiError,
    isInitializing,
    toggleScreenShare,
    initialize,
    dispose
  } = useJitsi(id, {
    containerRef: videoContainerRef,
    roomName: appointment?.meetingRoom || id,
    domain: appointment?.meetingDomain || '',
    displayName: appointment?.studentName || 'Student',
    userRole: 'student',
    avatarUrl: appointment?.studentImage || '',
    autoStart: false
  });

  // PHASE 3: Refetch function for error recovery
  const fetchAppointment = useCallback(async () => {
    let active = true;
    try {
      setLoading(true);
      setError('');
      const data = await getAppointmentById(id);
      if (!active) return;
      setAppointment(data);
    } catch (err) {
      if (!active) return;
      setError(err.message || 'Failed to load consultation');
      console.error('Consultation fetch error:', err);
    } finally {
      if (active) setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [id]);

  // PHASE 3: Auto-fetch on mount
  useEffect(() => {
    if (id) {
      fetchAppointment();
    }
  }, [id, fetchAppointment]);

  useEffect(() => {
    if (!id) return undefined;

    const unsubscribe = subscribeAppointment(id, async (updated) => {
      setAppointment((current) => (current ? { ...current, ...updated } : current));

      if (updated?.status || updated?.meetingRoom || updated?.meetingLink) {
        try {
          const fresh = await getAppointmentById(id);
          setAppointment(fresh);
        } catch (err) {
          console.error('Consultation live refresh error:', err);
        }
      }
    });

    return () => {
      unsubscribe?.();
      unsubscribeAppointment(id);
    };
  }, [id, subscribeAppointment, unsubscribeAppointment]);

  useEffect(() => {
    if (!appointment || !canOpenVideoVisit(appointment)) return undefined;

    const frame = requestAnimationFrame(() => {
      void initialize();
    });

    return () => {
      cancelAnimationFrame(frame);
      dispose();
    };
  }, [appointment, initialize, dispose]);

  if (loading) {
    return <LoadingState message="Loading consultation..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#18181B] text-white flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-[32px] border border-white/10 bg-white/5 backdrop-blur p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-red-400">Error</h1>
          <p className="text-white/70 mt-4">{error}</p>
          <button
            onClick={() => fetchAppointment()}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-[#18181B] text-white flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-[32px] border border-white/10 bg-white/5 backdrop-blur p-8 text-center">
          <AlertCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Consultation not found</h1>
          <button
            onClick={() => navigate('/student/appointments')}
            className="mt-8 px-6 py-3 bg-white text-primary-text rounded-xl font-bold hover:bg-white/90 transition-all"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
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
    <ErrorBoundary>
      <div className="min-h-screen bg-[#18181B] text-white flex flex-col lg:flex-row">
      <div className="flex-1 p-6 lg:p-10 flex items-center justify-center relative">
        <div
          ref={videoContainerRef}
          className="w-full h-[70vh] rounded-[40px] bg-slate-900 border border-white/10 overflow-hidden relative"
        >
          {/* PHASE 4: Jitsi will mount here */}
          {!isVideoReady && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center">
              {isInitializing ? (
                <>
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                  <p className="text-white/70">Initializing video...</p>
                </>
              ) : (
                <>
                  <VideoOff className="w-16 h-16 text-white/40 mb-4" />
                  <p className="text-white/70">Video not ready</p>
                </>
              )}
            </div>
          )}

          {/* Doctor info overlay */}
          {isVideoReady && (
            <div className="absolute bottom-10 left-10">
              <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                <p className="text-xl font-bold">{appointment.doctorName}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/70 mt-1">{appointment.doctorSpecialty}</p>
                <p className="text-xs text-green-400 mt-2">● Live</p>
              </div>
            </div>
          )}

          {/* Participants badge */}
          {participants.length > 0 && (
            <div className="absolute top-10 right-10">
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-sm">
                {participants.length + 1} participants
              </div>
            </div>
          )}
        </div>

        {/* Video controls */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={toggleScreenShare}
            disabled={!isVideoReady}
            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl text-white flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all disabled:opacity-50"
            title="Share screen"
          >
            {isScreenSharing ? <Minimize2 className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
          </button>
          <button
            onClick={() => navigate('/student/appointments')}
            className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-rose-900/30 hover:bg-rose-700 transition-all"
            title="End call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>

        {/* Error display */}
        {jitsiError && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-6 py-3 rounded-lg max-w-md text-center">
            <p className="text-sm">{jitsiError}</p>
          </div>
        )}
      </div>

      <aside className="w-full lg:w-[420px] bg-white text-primary-text p-8 space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Consultation</p>
          <h1 className="text-3xl font-bold mt-2">Visit details</h1>
        </div>

        <div className="rounded-3xl bg-secondary-bg p-6 space-y-4">
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
            onClick={() => navigate(`/student/prescriptions/${appointment.prescriptionId}`)}
            className="w-full py-4 bg-accent-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            View Prescription
          </button>
        )}

        {appointment.status === 'Completed' && (
          <button
            onClick={() => navigate(`/student/appointments/${appointment._id}/feedback`)}
            className="w-full py-4 bg-secondary-bg text-primary-text rounded-2xl font-bold"
          >
            Leave Feedback
          </button>
        )}
      </aside>
      </div>
    </ErrorBoundary>
  );
}
