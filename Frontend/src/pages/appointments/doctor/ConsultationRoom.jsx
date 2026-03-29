import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, PhoneOff, Save, Send, Video, VideoOff } from 'lucide-react';
import { createPrescription, getAppointmentById, updateConsultation } from '../../../lib/appointments';

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
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicine, setMedicine] = useState({ name: '', dosage: '', duration: '', frequency: 'Twice daily', instructions: '' });
  const [saving, setSaving] = useState(false);
  const [creatingPrescription, setCreatingPrescription] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getAppointmentById(id);
        if (!active) return;
        setAppointment(data);
        setConsultationNotes(data.consultationNotes || '');
        setDiagnosis(data.diagnosis || '');
        setFollowUpDate(data.followUpDate ? new Date(data.followUpDate).toISOString().slice(0, 10) : '');
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

  if (loading) return <div className="min-h-screen bg-[#18181B] text-white flex items-center justify-center">Loading consultation...</div>;
  if (error && !appointment) return <div className="min-h-screen bg-[#18181B] text-white flex items-center justify-center">{error}</div>;

  return (
    <div className="min-h-screen bg-[#18181B] text-white flex flex-col xl:flex-row">
      <div className="flex-1 p-6 xl:p-10 flex items-center justify-center relative">
        <div className="w-full h-[72vh] rounded-[40px] bg-slate-900 border border-white/10 overflow-hidden relative">
          {videoEnabled ? (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_45%),linear-gradient(135deg,#111827,#0f172a)]" />
          ) : (
            <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
              <VideoOff className="w-16 h-16 text-white/40" />
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
            onClick={() => setVideoEnabled((current) => !current)}
            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl text-white flex items-center justify-center border border-white/10"
          >
            {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-rose-900/30"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>

      <aside className="w-full xl:w-[520px] bg-white text-[#18181B] p-8 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-bold">Consultation</p>
            <h1 className="text-2xl font-bold">Clinical workspace</h1>
          </div>
        </div>

        <div className="rounded-3xl bg-[#F4F4F8] p-6 mb-8">
          <p className="font-bold text-[#18181B]">{appointment?.studentName || appointment?.studentId?.name}</p>
          <p className="text-sm text-[#71717A] mt-2">Symptoms: {appointment?.symptoms || 'No symptoms supplied before the visit.'}</p>
          <p className="text-sm text-[#71717A] mt-2">Allergies: {appointment?.studentId?.allergies?.join(', ') || 'None recorded'}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-bold mb-3 block">Diagnosis</label>
            <input
              type="text"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              className="w-full px-5 py-4 bg-[#F4F4F8] rounded-2xl outline-none"
              placeholder="Primary diagnosis or visit impression"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-bold mb-3 block">Consultation notes</label>
            <textarea
              rows={6}
              value={consultationNotes}
              onChange={(event) => setConsultationNotes(event.target.value)}
              className="w-full px-5 py-4 bg-[#F4F4F8] rounded-2xl outline-none resize-none"
              placeholder="Record observations, advice, and visit summary."
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-bold mb-3 block">Follow-up date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(event) => setFollowUpDate(event.target.value)}
              className="w-full px-5 py-4 bg-[#F4F4F8] rounded-2xl outline-none"
            />
          </div>

          <div className="rounded-3xl border border-[#F0F0F3] p-6 space-y-4">
            <h2 className="text-lg font-bold">Prescription draft</h2>
            <input type="text" value={medicine.name} onChange={(event) => setMedicine((current) => ({ ...current, name: event.target.value }))} className="w-full px-4 py-3 bg-[#F4F4F8] rounded-2xl outline-none" placeholder="Medicine name" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={medicine.dosage} onChange={(event) => setMedicine((current) => ({ ...current, dosage: event.target.value }))} className="w-full px-4 py-3 bg-[#F4F4F8] rounded-2xl outline-none" placeholder="Dosage" />
              <input type="text" value={medicine.duration} onChange={(event) => setMedicine((current) => ({ ...current, duration: event.target.value }))} className="w-full px-4 py-3 bg-[#F4F4F8] rounded-2xl outline-none" placeholder="Duration" />
            </div>
            <input type="text" value={medicine.instructions} onChange={(event) => setMedicine((current) => ({ ...current, instructions: event.target.value }))} className="w-full px-4 py-3 bg-[#F4F4F8] rounded-2xl outline-none" placeholder="Instructions" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-6">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <button onClick={() => handleSaveConsultation('In Progress')} disabled={saving} className="py-4 bg-[#F4F4F8] rounded-2xl font-bold text-[#18181B] flex items-center justify-center gap-2 disabled:opacity-50">
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
          <button onClick={handleCreatePrescription} disabled={creatingPrescription} className="py-4 bg-[#2563EB] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-5 h-5" />
            {creatingPrescription ? 'Sending...' : 'Send Prescription'}
          </button>
        </div>
      </aside>
    </div>
  );
}
