import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video as VideoIcon, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  MessageSquare, 
  FileText, 
  History, 
  Plus, 
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  User,
  Activity,
  Clipboard
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_APPOINTMENTS, MOCK_PATIENTS } from '../../../constants/mockAppointmentData';
import { cn } from '../../../lib/utils';

const ConsultationRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const appointment = MOCK_APPOINTMENTS.find(a => a.id === id);
  const patient = MOCK_PATIENTS.find(p => p.id === appointment?.studentId);

  const [activeTab, setActiveTab] = useState('patient');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([{ name: '', dosage: '', duration: '' }]);

  const handleAddMedicine = () => {
    setPrescriptionMedicines([...prescriptionMedicines, { name: '', dosage: '', duration: '' }]);
  };

  if (!appointment || !patient) return <div>Consultation not found</div>;

  return (
    <div className="h-screen bg-[#18181B] flex flex-col lg:flex-row overflow-hidden">
      {/* Video Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 lg:p-10">
        <div className="w-full h-full rounded-[40px] bg-slate-800 overflow-hidden relative shadow-2xl border border-slate-700">
          <img 
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=1080&h=720" 
            alt="Patient"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute bottom-10 left-10">
            <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
              <p className="text-white font-bold text-xl">{patient.name}</p>
              <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold">Age: {patient.age} • Blood: {patient.bloodType}</p>
            </div>
          </div>
        </div>

        {/* Self View */}
        <div className="absolute top-14 right-14 w-48 h-64 rounded-3xl bg-slate-900 border-2 border-white/20 shadow-2xl overflow-hidden z-10">
          <img 
            src={appointment.doctorImage} 
            alt="Self"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Controls */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl",
              isMuted ? "bg-rose-500 text-white" : "bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 border border-white/10"
            )}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl",
              isVideoOff ? "bg-rose-500 text-white" : "bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 border border-white/10"
            )}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
          </button>
          <button 
            onClick={() => navigate('/doctor/dashboard')}
            className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Right Panel (EHR & Prescription) */}
      <div className="w-full lg:w-[500px] h-full bg-white flex flex-col shadow-2xl z-30">
        <div className="p-6 border-b border-[#F0F0F3]">
          <div className="flex bg-[#F4F4F8] p-1.5 rounded-2xl">
            {[
              { id: 'patient', label: 'Patient Info', icon: User },
              { id: 'records', label: 'History', icon: History },
              { id: 'prescription', label: 'Prescription', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                  activeTab === tab.id ? "bg-white text-[#2563EB] shadow-sm" : "text-[#71717A] hover:text-[#18181B]"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'patient' && (
              <motion.div
                key="patient"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-[#18181B]">Medical Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Allergies</p>
                      <p className="text-sm font-bold text-rose-900">{patient.allergies.join(', ')}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Blood Type</p>
                      <p className="text-sm font-bold text-blue-900">{patient.bloodType}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#71717A] uppercase tracking-widest">Medical History</h4>
                  <div className="space-y-3">
                    {patient.history.map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-[#F4F4F8] rounded-xl">
                        <span className="text-sm font-bold text-[#18181B]">{h.condition}</span>
                        <span className="text-xs text-[#71717A] font-medium">{h.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#71717A] uppercase tracking-widest">Consultation Notes</h4>
                  <textarea 
                    rows={6}
                    className="w-full px-6 py-4 bg-[#F4F4F8] border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-medium text-[#18181B] resize-none"
                    placeholder="Enter private consultation notes..."
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'prescription' && (
              <motion.div
                key="prescription"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#18181B]">Issue Prescription</h3>
                  <button 
                    onClick={handleAddMedicine}
                    className="p-2 bg-blue-50 text-[#2563EB] rounded-xl hover:bg-blue-100 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {prescriptionMedicines.map((med, idx) => (
                    <div key={idx} className="p-6 bg-[#F4F4F8] rounded-3xl space-y-4 relative">
                      <button className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest">Medicine Name</label>
                        <input type="text" placeholder="Search medicine..." className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest">Dosage</label>
                          <input type="text" placeholder="e.g. 500mg" className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest">Duration</label>
                          <input type="text" placeholder="e.g. 7 days" className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full py-5 bg-[#2563EB] text-white rounded-[24px] font-bold hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-6 h-6" />
                  Send to Pharmacy & Patient
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ConsultationRoom;