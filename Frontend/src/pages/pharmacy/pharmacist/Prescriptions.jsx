import React, { useState } from 'react';
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  ChevronRight, 
  Eye, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  MessageSquare,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MOCK_PRESCRIPTIONS } from '../../../constants/mockPharmacyData';
import { cn } from '../../../lib/utils';

const PrescriptionProcessing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const tabs = ['Pending', 'Approved', 'Rejected'];

  const filteredPrescriptions = MOCK_PRESCRIPTIONS.filter(p => p.status === activeTab);
  const currentPrescription = MOCK_PRESCRIPTIONS.find(p => p.id === selectedPrescription);

  const handleVerify = (id) => {
    if (selectedItems.length === 0) {
      alert("Please select at least one medicine to approve the prescription.");
      return;
    }
    // Simulate verification and order creation
    setIsApproveModalOpen(false);
    alert(`Prescription ${id} verified! Order created with ${selectedItems.length} items.`);
    // In a real app, this would call apiFetch('/prescriptions/approve', { items: selectedItems })
  };

  const toggleItem = (med) => {
    setSelectedItems(prev => 
      prev.find(i => i.id === med.id) 
        ? prev.filter(i => i.id !== med.id)
        : [...prev, { ...med, quantity: 1 }]
    );
  };

  const handleReject = (id) => {
    // Simulate rejection
    setIsRejectModalOpen(false);
    alert(`Prescription ${id} rejected. Reason: ${rejectionReason}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Prescription Processing</h1>
              <p className="text-sm text-slate-500">Verify and process student uploaded prescriptions.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search student ID or name..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all w-64"
              />
            </div>
            <button className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Prescription List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap",
                    activeTab === tab ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activePrescriptionTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" 
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredPrescriptions.map((p) => (
                  <motion.button
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={p.id}
                    onClick={() => setSelectedPrescription(p.id)}
                    className={cn(
                      "w-full p-5 rounded-3xl border-2 text-left transition-all flex items-center gap-4 group",
                      selectedPrescription === p.id 
                        ? "border-emerald-500 bg-emerald-50/50" 
                        : "border-white bg-white hover:border-emerald-200 shadow-sm"
                    )}
                  >
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                      <img src={p.imageUrl} alt="Prescription" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={cn("font-bold truncate", selectedPrescription === p.id ? "text-emerald-900" : "text-slate-900")}>
                          {p.studentName}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">ID: {p.studentId}</p>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border",
                          p.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-100" : 
                          p.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                          "bg-rose-50 text-rose-700 border-rose-100"
                        )}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-transform",
                      selectedPrescription === p.id ? "text-emerald-600 translate-x-1" : "text-slate-300"
                    )} />
                  </motion.button>
                ))}
              </AnimatePresence>

              {filteredPrescriptions.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} prescriptions</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Detail View */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentPrescription ? (
                <motion.div
                  key={currentPrescription.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600">
                            <ClipboardList className="w-10 h-10" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold text-slate-900">{currentPrescription.studentName}</h2>
                            <p className="text-slate-500 font-medium">Student ID: {currentPrescription.studentId}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                              Uploaded on {new Date(currentPrescription.date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
                            <MessageSquare className="w-6 h-6" />
                          </button>
                          <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
                            <AlertCircle className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Image Lightbox Trigger */}
                        <div className="space-y-4">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Prescription Image</p>
                          <div 
                            onClick={() => setIsLightboxOpen(true)}
                            className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 relative group cursor-zoom-in shadow-lg"
                          >
                            <img 
                              src={currentPrescription.imageUrl} 
                              alt="Prescription" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                              <Maximize2 className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>

                        {/* Verification Controls */}
                        <div className="space-y-8">
                          <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Student Notes</p>
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 min-h-[120px]">
                              <p className="text-slate-700 leading-relaxed italic">
                                "{currentPrescription.notes || 'No additional notes provided.'}"
                              </p>
                            </div>
                          </div>

                          {currentPrescription.status === "PENDING" && (
                            <div className="space-y-4">
                              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Decision</p>
                              <div className="grid grid-cols-1 gap-4">
                                <button 
                                  onClick={() => setIsApproveModalOpen(true)}
                                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                                >
                                  <CheckCircle2 className="w-6 h-6" /> Approve & Select Medicines
                                </button>
                                <button 
                                  onClick={() => setIsRejectModalOpen(true)}
                                  className="w-full py-5 bg-white text-rose-600 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-rose-50 transition-all border-2 border-rose-100"
                                >
                                  <XCircle className="w-6 h-6" /> Reject Prescription
                                </button>
                              </div>
                            </div>
                          )}

                          {currentPrescription.status !== "PENDING" && (
                            <div className={cn(
                              "p-8 rounded-3xl border flex items-center gap-6",
                              currentPrescription.status === "APPROVED" ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                            )}>
                              <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center text-white",
                                currentPrescription.status === "APPROVED" ? "bg-emerald-500" : "bg-rose-500"
                              )}>
                                {currentPrescription.status === "APPROVED" ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                              </div>
                              <div>
                                <h3 className={cn(
                                  "text-xl font-bold",
                                  currentPrescription.status === "APPROVED" ? "text-emerald-900" : "text-rose-900"
                                )}>
                                  Prescription {currentPrescription.status}
                                </h3>
                                <p className={cn(
                                  "text-sm font-medium",
                                  currentPrescription.status === "APPROVED" ? "text-emerald-700/70" : "text-rose-700/70"
                                )}>
                                  Processed by Dr. Sarah Wilson on Feb 28, 2026
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-[40px] border border-slate-200 border-dashed p-32 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Eye className="w-12 h-12 text-slate-200" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Select a Prescription</h2>
                  <p className="text-slate-500 max-w-sm mx-auto text-lg">
                    Choose a prescription from the queue to review and process.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && currentPrescription && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex items-center justify-center p-10"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button className="absolute top-10 right-10 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all">
              <XCircle className="w-8 h-8" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={currentPrescription.imageUrl} 
              alt="Prescription Full" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {isRejectModalOpen && currentPrescription && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRejectModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Reject Prescription</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Reason for Rejection</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-bold text-slate-700"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  >
                    <option value="">Select a reason...</option>
                    <option value="Illegible Image">Illegible Image</option>
                    <option value="Missing Information">Missing Information</option>
                    <option value="Expired Prescription">Expired Prescription</option>
                    <option value="Duplicate Submission">Duplicate Submission</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pharmacist Note (Optional)</label>
                  <textarea 
                    placeholder="Provide more details for the student..."
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={() => setIsRejectModalOpen(false)}
                    className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={!rejectionReason}
                    onClick={() => handleReject(currentPrescription.id)}
                    className="py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Approve Modal - Medicine Selection */}
      <AnimatePresence>
        {isApproveModalOpen && currentPrescription && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsApproveModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] p-10 shadow-2xl max-h-[90vh] flex flex-col"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Approve Prescription</h2>
              <p className="text-slate-500 mb-8 font-medium italic">Select medicines to include in the order for {currentPrescription.studentName}</p>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-8 no-scrollbar">
                {import.meta.env.MODE === 'development' && !MOCK_MEDICINES ? <p>Loading medicines...</p> : 
                  (MOCK_MEDICINES || []).map((med) => (
                    <button
                      key={med.id}
                      onClick={() => toggleItem(med)}
                      className={cn(
                        "w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4",
                        selectedItems.find(i => i.id === med.id)
                          ? "border-emerald-500 bg-emerald-50/50"
                          : "border-slate-100 hover:border-emerald-200"
                      )}
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                        <img src={med.image} alt={med.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900">{med.name}</h4>
                        <p className="text-xs text-slate-500">{med.strength} • ${med.price}</p>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedItems.find(i => i.id === med.id) ? "bg-emerald-500 border-emerald-500" : "border-slate-200"
                      )}>
                        {selectedItems.find(i => i.id === med.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  ))
                }
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setIsApproveModalOpen(false)}
                  className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={selectedItems.length === 0}
                  onClick={() => handleVerify(currentPrescription.id)}
                  className="py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm & Create Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrescriptionProcessing;