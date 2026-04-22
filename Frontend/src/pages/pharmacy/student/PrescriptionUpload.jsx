import React, { useRef, useState } from 'react';
import { 
  Upload, 
  X, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Loader2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { apiFetch } from '../../../lib/api';

const PrescriptionUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files && e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile) => {
    if (selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPreview(null);
    } else {
      alert('Please upload a prescription image or PDF file.');
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
    setError('');
    try {
      const formData = new FormData();
      formData.append('prescription', file);
      formData.append('notes', notes);

      await apiFetch('/prescriptions/upload', {
        method: 'POST',
        body: formData
      });

      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to upload prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="pharmacy-shell flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl shadow-slate-200/50"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent-primary" />
          </div>
          <h2 className="text-3xl font-bold text-primary-text mb-4">Upload Successful!</h2>
          <p className="text-secondary-text mb-8 leading-relaxed">
            Your prescription has been submitted for verification. Our pharmacists usually verify documents within 30 minutes.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/student/pharmacy/orders')}
              className="w-full py-4 bg-accent-primary text-white rounded-xl font-bold hover:bg-[#105f72] transition-all shadow-lg shadow-cyan-100"
            >
              Track Status
            </button>
            <button 
              onClick={() => navigate('/student/pharmacy')}
              className="w-full py-4 bg-[#e6f0f4] text-secondary-text rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pharmacy-shell pb-20">
      {/* Header */}
      <div className="pharmacy-hero sticky top-0 z-30 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary-text">Upload Prescription</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="pharmacy-panel overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-primary-text mb-2">Submit Your Prescription</h2>
              <p className="text-secondary-text">Please upload a clear photo or scan of your doctor's prescription.</p>
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
                  isDragging ? "border-accent-primary bg-[#e8f7f5]" : "border-slate-200 hover:border-[#7fc7d5] hover:bg-[#eff6f9]",
                  file ? "border-accent-primary bg-[#e8f7f5]/30" : ""
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
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
                      <div className="w-16 h-16 bg-[#e8f7f5] rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-accent-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-primary-text">Drag & drop or click to upload</p>
                        <p className="text-sm text-secondary-text mt-1">Supports JPG, PNG, WEBP, GIF, or PDF (Max 10MB)</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="preview"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative"
                    >
                      <div className="relative w-48 h-64 mx-auto rounded-xl overflow-hidden shadow-lg border-4 border-white bg-white">
                        {preview ? (
                          <img src={preview} alt="Prescription preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-secondary-text">
                            <FileText className="w-14 h-14 text-accent-primary" />
                            <p className="text-xs font-bold uppercase tracking-wider px-4 text-center break-all">{file?.name}</p>
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(); }}
                          className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-md transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="mt-4 text-accent-primary font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> File ready to upload
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-secondary-text/80 uppercase tracking-wider">Additional Notes (Optional)</label>
                <textarea 
                  placeholder="e.g., I need the generic version, or specific instructions for the pharmacist..."
                  className="w-full p-4 bg-[#eff6f9] border-none rounded-2xl focus:ring-2 focus:ring-accent-primary focus:bg-white transition-all min-h-[120px]"
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
                    ? "bg-accent-primary text-white hover:bg-[#105f72] shadow-cyan-100" 
                    : "bg-[#e6f0f4] text-secondary-text/80 cursor-not-allowed shadow-none"
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
              {error && <p className="text-sm text-rose-600">{error}</p>}

              {/* Info Box */}
              <div className="p-6 bg-[#eff6f9] rounded-2xl flex gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-accent-primary shrink-0 shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-primary-text text-sm">Fast Verification</p>
                  <p className="text-xs text-secondary-text leading-relaxed mt-1">
                    Our team of licensed pharmacists will review your prescription within 30 minutes. 
                    You'll receive a notification once it's approved.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-secondary-text/80 text-xs font-medium">
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
