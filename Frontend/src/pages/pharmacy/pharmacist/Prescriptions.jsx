import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ChevronRight,
  Eye,
  AlertCircle,
  ChevronLeft,
  MessageSquare,
  Maximize2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { apiFetch, resolveAssetUrl } from '../../../lib/api';

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-100'
};

function getPrescriptionImageUrl(prescription) {
  return resolveAssetUrl(prescription?.imageUrl || '');
}

const PrescriptionProcessing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pharmacistNotes, setPharmacistNotes] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const tabs = ['Pending', 'Approved', 'Rejected'];

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch(`/prescriptions?status=${encodeURIComponent(activeTab)}&limit=200`);
        if (!active) return;
        const nextPrescriptions = Array.isArray(data?.prescriptions) ? data.prescriptions : [];
        setPrescriptions(nextPrescriptions);
        setSelectedPrescription(nextPrescriptions[0]?._id || null);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load prescriptions');
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [activeTab]);

  const filteredPrescriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return prescriptions.filter((item) => {
      if (!query) return true;
      const studentName = (item.studentName || '').toLowerCase();
      const studentId = (item.studentId?.studentId || item.studentId?._id || item.studentId || '').toString().toLowerCase();
      return studentName.includes(query) || studentId.includes(query);
    });
  }, [prescriptions, searchQuery]);

  const currentPrescription = useMemo(
    () => prescriptions.find((item) => item._id === selectedPrescription),
    [prescriptions, selectedPrescription]
  );

  useEffect(() => {
    setReview(null);
    setReviewError('');
  }, [selectedPrescription]);

  const refreshPrescriptions = async (status = activeTab) => {
    const data = await apiFetch(`/prescriptions?status=${encodeURIComponent(status)}&limit=200`);
    const nextPrescriptions = Array.isArray(data?.prescriptions) ? data.prescriptions : [];
    setPrescriptions(nextPrescriptions);
    setSelectedPrescription(nextPrescriptions[0]?._id || null);
  };

  const loadReview = useCallback(async () => {
    if (!currentPrescription) return;
    try {
      setReviewLoading(true);
      setReviewError('');
      const data = await apiFetch(`/prescriptions/${currentPrescription._id}/review`);
      setReview(data);
    } catch (err) {
      setReviewError(err.message || 'Failed to generate assistant review');
    } finally {
      setReviewLoading(false);
    }
  }, [currentPrescription]);

  useEffect(() => {
    if (!currentPrescription?._id) return;
    loadReview();
  }, [currentPrescription?._id, loadReview]);

  const handleApprove = async () => {
    if (!currentPrescription) return;
    try {
      setIsSaving(true);
      setError('');
      await apiFetch(`/prescriptions/${currentPrescription._id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'Approved',
          pharmacistNotes
        })
      });
      setIsApproveModalOpen(false);
      setPharmacistNotes('');
      await refreshPrescriptions();
    } catch (err) {
      setError(err.message || 'Failed to approve prescription');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    if (!currentPrescription || !rejectionReason) return;
    try {
      setIsSaving(true);
      setError('');
      await apiFetch(`/prescriptions/${currentPrescription._id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'Rejected',
          pharmacistNotes,
          rejectionReason
        })
      });
      setIsRejectModalOpen(false);
      setRejectionReason('');
      setPharmacistNotes('');
      await refreshPrescriptions();
    } catch (err) {
      setError(err.message || 'Failed to reject prescription');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/pharmacist/dashboard')}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
          <div className="lg:col-span-1 space-y-6">
            <div className="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap',
                    activeTab === tab ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
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

            {loading && (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Loading prescriptions...</p>
              </div>
            )}

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {!loading && filteredPrescriptions.map((p) => (
                  <motion.button
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={p._id}
                    onClick={() => setSelectedPrescription(p._id)}
                    className={cn(
                      'w-full p-5 rounded-3xl border-2 text-left transition-all flex items-center gap-4 group',
                      selectedPrescription === p._id
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-white bg-white hover:border-emerald-200 shadow-sm'
                    )}
                  >
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                      {getPrescriptionImageUrl(p) ? (
                        <img src={getPrescriptionImageUrl(p)} alt="Prescription" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ClipboardList className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={cn('font-bold truncate', selectedPrescription === p._id ? 'text-emerald-900' : 'text-slate-900')}>
                          {p.studentName}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        ID: {p.studentId?.studentId || p.studentId?._id || p.studentId || 'N/A'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={cn('px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border', STATUS_STYLES[p.status] || STATUS_STYLES.Pending)}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={cn('w-5 h-5 transition-transform', selectedPrescription === p._id ? 'text-emerald-600 translate-x-1' : 'text-slate-300')} />
                  </motion.button>
                ))}
              </AnimatePresence>

              {!loading && filteredPrescriptions.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} prescriptions</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentPrescription ? (
                <motion.div
                  key={currentPrescription._id}
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
                            <p className="text-slate-500 font-medium">
                              Student ID: {currentPrescription.studentId?.studentId || currentPrescription.studentId?._id || currentPrescription.studentId || 'N/A'}
                            </p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                              Uploaded on {new Date(currentPrescription.createdAt).toLocaleString()}
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
                        <div className="space-y-4">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Prescription Image</p>
                          <div
                            onClick={() => getPrescriptionImageUrl(currentPrescription) && setIsLightboxOpen(true)}
                            className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 relative group shadow-lg"
                          >
                            {getPrescriptionImageUrl(currentPrescription) ? (
                              <>
                                <img
                                  src={getPrescriptionImageUrl(currentPrescription)}
                                  alt="Prescription"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                                  <Maximize2 className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Eye className="w-16 h-16" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Student Notes</p>
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 min-h-[120px]">
                              <p className="text-slate-700 leading-relaxed italic">
                                "{currentPrescription.notes || 'No additional notes provided.'}"
                              </p>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between gap-4 mb-4">
                              <div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Verification Assistant</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Generate a quick review to speed up manual pharmacist verification.
                                </p>
                              </div>
                              <button
                                onClick={loadReview}
                                disabled={reviewLoading}
                                className="px-4 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {reviewLoading ? 'Reading...' : review ? 'Refresh Review' : 'Generate Review'}
                              </button>
                            </div>

                            {!review && !reviewLoading && !reviewError && (
                              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <p className="text-slate-600 text-sm leading-relaxed">
                                  This assistant can summarize the uploaded prescription and flag common review risks before you approve or reject it.
                                </p>
                              </div>
                            )}

                            {reviewError && (
                              <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                                <p className="text-sm text-rose-700">{reviewError}</p>
                              </div>
                            )}

                            {reviewLoading && (
                              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-3 text-slate-600">
                                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                                <span className="text-sm font-medium">Analyzing prescription...</span>
                              </div>
                            )}

                            {review && (
                              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-5">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                    {review.mode === 'openai' ? 'AI Vision Review' : 'Checklist Review'}
                                  </span>
                                  {review.error && (
                                    <span className="text-xs text-amber-700 font-medium">
                                      AI unavailable, fallback used
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <p className="text-sm font-bold text-slate-900 mb-2">Summary</p>
                                  <p className="text-sm text-slate-600 leading-relaxed">{review.summary}</p>
                                </div>

                                {review.extracted && (
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 mb-3">Extracted Details</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      <div className="p-4 bg-white rounded-2xl border border-slate-200">
                                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Patient</p>
                                        <p className="font-medium text-slate-700">{review.extracted.patientName || review.extracted.studentName || 'Not clearly detected'}</p>
                                      </div>
                                      <div className="p-4 bg-white rounded-2xl border border-slate-200">
                                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Doctor</p>
                                        <p className="font-medium text-slate-700">{review.extracted.doctorName || 'Not clearly detected'}</p>
                                      </div>
                                      <div className="p-4 bg-white rounded-2xl border border-slate-200">
                                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                        <p className="font-medium text-slate-700">{review.extracted.prescriptionDate || review.extracted.uploadedAt || 'Not clearly detected'}</p>
                                      </div>
                                      <div className="p-4 bg-white rounded-2xl border border-slate-200">
                                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Legibility</p>
                                        <p className="font-medium text-slate-700">{review.extracted.legibility || 'Needs manual check'}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {Array.isArray(review.extracted?.medicines) && review.extracted.medicines.length > 0 && (
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 mb-3">Possible Medicines</p>
                                    <div className="space-y-3">
                                      {review.extracted.medicines.map((medicine, index) => (
                                        <div key={`${medicine.name || 'medicine'}-${index}`} className="p-4 bg-white rounded-2xl border border-slate-200">
                                          <p className="font-semibold text-slate-800">{medicine.name || 'Unnamed medicine'}</p>
                                          <p className="text-sm text-slate-600 mt-1">
                                            {[medicine.dosage, medicine.frequency, medicine.notes].filter(Boolean).join(' | ') || 'No extra details detected'}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {Array.isArray(review.checks) && review.checks.length > 0 && (
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 mb-3">Checks</p>
                                    <div className="space-y-3">
                                      {review.checks.map((check, index) => (
                                        <div key={`${check.label}-${index}`} className="p-4 bg-white rounded-2xl border border-slate-200">
                                          <div className="flex items-center justify-between gap-3 mb-1">
                                            <p className="font-semibold text-slate-800">{check.label}</p>
                                            <span className={cn(
                                              'px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest',
                                              check.status === 'pass' && 'bg-emerald-50 text-emerald-700',
                                              check.status === 'warning' && 'bg-amber-50 text-amber-700',
                                              check.status === 'fail' && 'bg-rose-50 text-rose-700'
                                            )}>
                                              {check.status}
                                            </span>
                                          </div>
                                          <p className="text-sm text-slate-600">{check.detail}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {Array.isArray(review.warnings) && review.warnings.length > 0 && (
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 mb-3">Warnings</p>
                                    <div className="space-y-2">
                                      {review.warnings.map((warning, index) => (
                                        <div key={`${warning}-${index}`} className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                                          {warning}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {review.recommendation && (
                                  <div className="p-4 bg-white rounded-2xl border border-slate-200">
                                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Recommendation</p>
                                    <p className="text-sm text-slate-700">{review.recommendation}</p>
                                  </div>
                                )}

                                {review.error && (
                                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <p className="text-xs text-amber-800 uppercase tracking-widest mb-1 font-bold">AI Error</p>
                                    <p className="text-sm text-amber-700">{review.error}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {currentPrescription.status === 'Pending' && (
                            <div className="space-y-4">
                              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Decision</p>
                              <div className="grid grid-cols-1 gap-4">
                                <button
                                  onClick={() => setIsApproveModalOpen(true)}
                                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                                >
                                  <CheckCircle2 className="w-6 h-6" /> Approve Prescription
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

                          {currentPrescription.status !== 'Pending' && (
                            <div className={cn(
                              'p-8 rounded-3xl border flex items-center gap-6',
                              currentPrescription.status === 'Approved' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
                            )}>
                              <div className={cn(
                                'w-16 h-16 rounded-2xl flex items-center justify-center text-white',
                                currentPrescription.status === 'Approved' ? 'bg-emerald-500' : 'bg-rose-500'
                              )}>
                                {currentPrescription.status === 'Approved' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                              </div>
                              <div>
                                <h3 className={cn('text-xl font-bold', currentPrescription.status === 'Approved' ? 'text-emerald-900' : 'text-rose-900')}>
                                  Prescription {currentPrescription.status}
                                </h3>
                                <p className={cn('text-sm font-medium', currentPrescription.status === 'Approved' ? 'text-emerald-700/70' : 'text-rose-700/70')}>
                                  {currentPrescription.pharmacistNotes || 'Processed by pharmacist.'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {error && <p className="text-sm text-rose-600">{error}</p>}
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
                  {error && <p className="text-sm text-rose-600 mt-6">{error}</p>}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isLightboxOpen && getPrescriptionImageUrl(currentPrescription) && (
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
              src={getPrescriptionImageUrl(currentPrescription)}
              alt="Prescription Full"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

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
                    value={pharmacistNotes}
                    onChange={(e) => setPharmacistNotes(e.target.value)}
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
                    disabled={!rejectionReason || isSaving}
                    onClick={handleReject}
                    className="py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="relative w-full max-w-2xl bg-white rounded-[40px] p-10 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Approve Prescription</h2>
              <p className="text-slate-500 mb-8 font-medium italic">
                Add an optional note for {currentPrescription.studentName}.
              </p>
              <div className="space-y-2 mb-8">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pharmacist Note (Optional)</label>
                <textarea
                  placeholder="Approved for processing..."
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all min-h-[120px]"
                  value={pharmacistNotes}
                  onChange={(e) => setPharmacistNotes(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsApproveModalOpen(false)}
                  className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={isSaving}
                  onClick={handleApprove}
                  className="py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Approving...' : 'Confirm Approval'}
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
