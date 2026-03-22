import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';

const PrescriptionUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files && e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile) => {
    if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null); // PDF preview not handled here for simplicity
      }
    } else {
      alert('Please upload an image (JPG, PNG) or PDF file.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files && e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl shadow-slate-200/50"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Upload Successful!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your prescription has been submitted for verification. Our pharmacists usually verify documents within 30 minutes.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/student/pharmacy/orders')}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              Track Status
            </button>
            <button 
              onClick={() => navigate('/student/pharmacy')}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Upload Prescription</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Submit Your Prescription</h2>
              <p className="text-slate-500">Please upload a clear photo or scan of your doctor's prescription.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className={cn(
                  "relative border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer group",
                  isDragging ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50",
                  file ? "border-emerald-500 bg-emerald-50/30" : ""
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                />

                <AnimatePresence mode="wait">
                  {!file ? (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">Drag & drop or click to upload</p>
                        <p className="text-sm text-slate-500 mt-1">Supports JPG, PNG, PDF (Max 10MB)</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="preview"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative"
                    >
                      {preview ? (
                        <div className="relative w-48 h-64 mx-auto rounded-xl overflow-hidden shadow-lg border-4 border-white">
                          <img src={preview} alt="Prescription preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-md transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-48 h-64 mx-auto bg-white rounded-xl flex flex-col items-center justify-center shadow-lg border-4 border-white relative">
                          <FileText className="w-16 h-16 text-emerald-600 mb-4" />
                          <p className="text-xs font-bold text-slate-900 px-4 truncate w-full">{file.name}</p>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-md transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <p className="mt-4 text-emerald-600 font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> File ready to upload
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Additional Notes (Optional)</label>
                <textarea 
                  placeholder="e.g., I need the generic version, or specific instructions for the pharmacist..."
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all min-h-[120px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={!file || isSubmitting}
                className={cn(
                  "w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg",
                  file && !isSubmitting 
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" /> Processing...
                  </>
                ) : (
                  "Submit for Verification"
                )}
              </button>

              {/* Info Box */}
              <div className="p-6 bg-slate-50 rounded-2xl flex gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Fast Verification</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Our team of licensed pharmacists will review your prescription within 30 minutes. 
                    You'll receive a notification once it's approved.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                <ShieldCheck className="w-4 h-4" /> Secure & Encrypted Document Storage
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionUpload;