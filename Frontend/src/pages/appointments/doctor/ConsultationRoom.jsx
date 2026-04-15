import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, PhoneOff, Save, Send, AlertCircle, RefreshCw, Share2, Minimize2 } from 'lucide-react';
import {
  canOpenVideoVisit,
  createPrescription,
  getAppointmentById,
  updateConsultation
} from '../../../lib/appointments';
import { useJitsi } from '../../../hooks/useJitsi';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { LoadingState } from '../../../components/LoadingState';

function validatePrescriptionDraft(medicine) {
  if (!medicine.name.trim()) return 'Medicine name is required before sending a prescription.';
  if (!medicine.dosage.trim()) return 'Dosage is required before sending a prescription.';
  if (!medicine.duration.trim()) return 'Duration is required before sending a prescription.';
  if (!medicine.instructions.trim()) return 'Instructions are required before sending a prescription.';
  return '';
}

export default function ConsultationRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicine, setMedicine] = useState({ name: '', dosage: '', duration: '', frequency: 'Twice daily', instructions: '' });
  const [saving, setSaving] = useState(false);
  const [creatingPrescription, setCreatingPrescription] = useState(false);
  const [startingVideo, setStartingVideo] = useState(false);

  const videoContainerRef = useRef(null);

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
    displayName: appointment?.doctorName || 'Doctor',
    userRole: 'doctor',
    avatarUrl: appointment?.doctorImage || '',
    autoStart: false
  });
  const fetchAppointment = useCallback(async () => {
    let active = true;
    try {
      const data = await getAppointmentById(id);
      if (!active) return;
      setAppointment(data);
      setConsultationNotes(data.consultationNotes || '');
      setDiagnosis(data.diagnosis || '');
      setFollowUpDate(data.followUpDate ? new Date(data.followUpDate).toISOString().slice(0, 10) : '');
      setError('');
    } catch (err) {
      if (!active) return;
      setError(err.message || 'Failed to load consultation');
      console.error('ConsultationRoom fetch error:', err);
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
    if (!appointment || !canOpenVideoVisit(appointment)) return undefined;

    const frame = requestAnimationFrame(() => {
      void initialize();
    });

    return () => {
      cancelAnimationFrame(frame);
      dispose();
    };
  }, [appointment, initialize, dispose]);

  async function handleSaveConsultation(statusOverride) {
    const trimmedDiagnosis = diagnosis.trim();
    const trimmedNotes = consultationNotes.trim();

    if (!trimmedDiagnosis && !trimmedNotes) {
      setError('Add a diagnosis or consultation notes before saving the consultation.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const updated = await updateConsultation(id, {
        consultationNotes: trimmedNotes,
        diagnosis: trimmedDiagnosis,
        followUpDate,
        followUpReason: followUpDate ? 'Follow-up recommended' : '',
        status: statusOverride || appointment?.status || 'In Progress'
      });
      setAppointment(updated);
    } catch (err) {
      setError(err.message || 'Failed to save consultation');
    } finally {
      setSaving(false);
    }
  }

  async function handleStartVideoCall() {
    if (!appointment || appointment.type !== 'Video Call') return;

    try {
      setStartingVideo(true);
      setError('');
      const updated = await updateConsultation(id, {
        status: appointment.status === 'Ready' ? 'In Progress' : 'In Progress'
      });
      setAppointment(updated);
    } catch (err) {
      setError(err.message || 'Failed to start the video consultation');
    } finally {
      setStartingVideo(false);
    }
  }

  async function handleCreatePrescription() {
    if (!appointment) return;

    const validationError = validatePrescriptionDraft(medicine);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setCreatingPrescription(true);
      setError('');
      const prescription = await createPrescription({
        appointmentId: appointment._id,
        studentId: appointment.studentId?._id || appointment.studentId,
        medicines: [{
          ...medicine,
          name: medicine.name.trim(),
          dosage: medicine.dosage.trim(),
          duration: medicine.duration.trim(),
          instructions: medicine.instructions.trim()
        }],
        notes: consultationNotes.trim() || diagnosis.trim()
      });

      const updated = await updateConsultation(id, {
        consultationNotes: consultationNotes.trim(),
        diagnosis: diagnosis.trim(),
        followUpDate,
        followUpReason: followUpDate ? 'Follow-up recommended' : '',
        prescriptionId: prescription._id,
        status: 'Completed'
      });

      setAppointment(updated);
      navigate('/doctor/prescriptions');
    } catch (err) {
      setError(err.message || 'Failed to create prescription');
    } finally {
      setCreatingPrescription(false);
    }
  }

  if (loading) return <LoadingState message="Loading consultation room..." />;

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-[#18181B] text-white flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-[40px] border border-white/10 bg-white/5 backdrop-blur p-8 text-center">
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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#18181B] text-white flex flex-col xl:flex-row">
      <div className="flex-1 p-6 xl:p-10 flex items-center justify-center relative">
        <div className="w-full h-[72vh] rounded-[40px] bg-slate-900 border border-white/10 overflow-hidden relative">
          <div ref={videoContainerRef} className="absolute inset-0" style={{ backgroundColor: '#111827' }} />

          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-sm text-white/70">Connecting...</p>
              </div>
            </div>
          )}

          {jitsiError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-sm text-white max-w-xs">{jitsiError}</p>
                <button
                  type="button"
                  onClick={() => {
                    dispose();
                    void initialize();
                  }}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  Reconnect
                </button>
              </div>
            </div>
          )}

          {isVideoReady && participants && participants.length > 0 && (
            <div className="absolute top-4 right-4 z-40 bg-black/60 backdrop-blur-md px-3 py-2 rounded-full text-xs text-white border border-white/10">
              {participants.length + 1} in call
            </div>
          )}

          <div className="absolute bottom-10 left-10">
            <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
              <p className="text-xl font-bold">{appointment?.studentName || appointment?.studentId?.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70 mt-1">{appointment?.type}</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={toggleScreenShare}
            disabled={isInitializing}
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition ${
              isScreenSharing
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isScreenSharing ? 'Stop share' : 'Start share'}
          >
            {isScreenSharing ? <Minimize2 className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
          </button>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-rose-900/30 hover:bg-rose-700 transition"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>

      <aside className="w-full xl:w-[520px] bg-surface text-primary-text p-8 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Consultation</p>
            <h1 className="text-2xl font-bold text-primary-text">Clinical workspace</h1>
          </div>
        </div>

        <div className="rounded-3xl bg-secondary-bg p-6 mb-8">
          <p className="font-bold text-primary-text">{appointment?.studentName || appointment?.studentId?.name}</p>
          <p className="text-sm text-secondary-text mt-2">Symptoms: {appointment?.symptoms || 'No symptoms supplied before the visit.'}</p>
          <p className="text-sm text-secondary-text mt-2">Allergies: {appointment?.studentId?.allergies?.join(', ') || 'None recorded'}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3 block">Diagnosis</label>
            <input
              type="text"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none text-primary-text"
              placeholder="Primary diagnosis or visit impression"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3 block">Consultation notes</label>
            <textarea
              rows={6}
              value={consultationNotes}
              onChange={(event) => setConsultationNotes(event.target.value)}
              className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none resize-none text-primary-text"
              placeholder="Record observations, advice, and visit summary."
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3 block">Follow-up date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(event) => setFollowUpDate(event.target.value)}
              className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none text-primary-text"
            />
          </div>

          <div className="rounded-3xl border border-border-gray p-6 space-y-4">
            <h2 className="text-lg font-bold text-primary-text">Prescription draft</h2>
            <input type="text" value={medicine.name} onChange={(event) => setMedicine((current) => ({ ...current, name: event.target.value }))} className="w-full px-4 py-3 bg-secondary-bg rounded-2xl outline-none text-primary-text" placeholder="Medicine name" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={medicine.dosage} onChange={(event) => setMedicine((current) => ({ ...current, dosage: event.target.value }))} className="w-full px-4 py-3 bg-secondary-bg rounded-2xl outline-none text-primary-text" placeholder="Dosage" />
              <input type="text" value={medicine.duration} onChange={(event) => setMedicine((current) => ({ ...current, duration: event.target.value }))} className="w-full px-4 py-3 bg-secondary-bg rounded-2xl outline-none text-primary-text" placeholder="Duration" />
            </div>
            <input type="text" value={medicine.instructions} onChange={(event) => setMedicine((current) => ({ ...current, instructions: event.target.value }))} className="w-full px-4 py-3 bg-secondary-bg rounded-2xl outline-none text-primary-text" placeholder="Instructions" />
          </div>
        </div>

        {error && <p className="text-sm text-error mt-6">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {appointment?.type === 'Video Call' && !canOpenVideoVisit(appointment) && (
            <button
              onClick={handleStartVideoCall}
              disabled={startingVideo || !['Confirmed', 'Ready'].includes(appointment?.status)}
              className="py-4 bg-accent-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#105f72]"
            >
              <RefreshCw className={`w-5 h-5 ${startingVideo ? 'animate-spin' : ''}`} />
              {startingVideo ? 'Starting Call...' : 'Start Video Call'}
            </button>
          )}
          <button onClick={() => handleSaveConsultation('In Progress')} disabled={saving} className="py-4 bg-secondary-bg rounded-2xl font-bold text-primary-text flex items-center justify-center gap-2 disabled:opacity-50">
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
          <button onClick={handleCreatePrescription} disabled={creatingPrescription} className="py-4 bg-accent-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#105f72]">
            <Send className="w-5 h-5" />
            {creatingPrescription ? 'Sending...' : 'Send Prescription'}
          </button>
        </div>
      </aside>
      </div>
    </ErrorBoundary>
  );
}
