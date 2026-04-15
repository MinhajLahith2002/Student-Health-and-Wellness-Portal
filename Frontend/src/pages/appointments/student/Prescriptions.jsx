import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Calendar, 
  User, 
  ChevronRight, 
  Download, 
  ShoppingBag,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPrescriptionHistory } from '../../../lib/appointments';

const Prescriptions = () => {
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getPrescriptionHistory();
        if (!active) return;
        setPrescriptions(Array.isArray(data?.prescriptions) ? data.prescriptions : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load prescriptions');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredPrescriptions = useMemo(
    () =>
      prescriptions.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          (p.doctorName || '').toLowerCase().includes(q) ||
          (Array.isArray(p.medicines) &&
            p.medicines.some((m) => (m.name || '').toLowerCase().includes(q)))
        );
      }),
    [prescriptions, searchQuery]
  );

  return (
    <div className="student-shell pb-20">
      {/* Header */}
      <div className="student-hero pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-primary-text tracking-tight">My Prescriptions</h1>
            <p className="text-secondary-text mt-2 text-lg">Access and manage all medical prescriptions issued to you.</p>
          </motion.div>

          {/* Search Bar */}
          <div className="mt-10 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
            <input 
              type="text"
              placeholder="Search by doctor or medicine name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-secondary-bg border-none rounded-2xl text-sm focus:ring-2 focus:ring-accent-primary/20 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrescriptions.map((prescription) => (
            <motion.div
              key={prescription._id}
              whileHover={{ y: -4, scale: 1.01 }}
              className="student-surface p-8 hover:shadow-md transition-all group cursor-pointer"
              onClick={() => setSelectedPrescription(prescription)}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-accent-primary/10 text-accent-primary rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-text group-hover:text-accent-primary transition-colors">{prescription.doctorName}</h3>
                  <p className="text-xs text-secondary-text font-bold uppercase tracking-widest">
                    {new Date(prescription.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Medicines</p>
                <div className="space-y-2">
                  {(prescription.medicines || []).map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="font-bold text-primary-text">{m.name}</span>
                      <span className="text-secondary-text">{m.dosage}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-4 bg-secondary-bg text-primary-text rounded-2xl font-bold text-sm hover:bg-border-gray/50 transition-all flex items-center justify-center gap-2">
                View Details
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        {loading && <p className="text-sm text-secondary-text">Loading prescriptions...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && filteredPrescriptions.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-secondary-bg rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-secondary-text" />
            </div>
            <h3 className="text-2xl font-bold text-primary-text">No prescriptions found</h3>
            <p className="text-secondary-text mt-2">Any prescriptions issued by your doctors will appear here.</p>
          </div>
        )}
      </div>

      {/* Prescription Detail Modal */}
      <AnimatePresence>
        {selectedPrescription && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPrescription(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-accent-primary/10 text-accent-primary rounded-2xl flex items-center justify-center">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-primary-text">Prescription Details</h2>
                      <p className="text-sm text-secondary-text font-medium">Issued by {selectedPrescription.doctorName} on {selectedPrescription.date}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPrescription(null)} className="p-2 hover:bg-secondary-bg rounded-full transition-all">
                    <X className="w-6 h-6 text-secondary-text" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="bg-secondary-bg p-8 rounded-3xl space-y-6">
                    {selectedPrescription.medicines.map((m, idx) => (
                      <div key={idx} className="pb-6 border-b border-border-gray last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-bold text-primary-text">{m.name}</h4>
                          <span className="px-3 py-1 bg-white text-accent-primary text-[10px] font-bold rounded-full uppercase tracking-widest border border-blue-100">
                            {m.dosage}
                          </span>
                        </div>
                        <p className="text-sm text-secondary-text font-medium mb-3">Duration: {m.duration}</p>
                        <div className="flex items-start gap-2 text-sm text-primary-text font-medium bg-white/50 p-3 rounded-xl">
                          <AlertCircle className="w-4 h-4 text-accent-primary mt-0.5" />
                          {m.instructions}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedPrescription.notes && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Doctor's Notes</p>
                      <p className="text-sm text-primary-text font-medium leading-relaxed">{selectedPrescription.notes}</p>
                    </div>
                  )}

                  <div className="pt-6 flex gap-4">
                    <button className="flex-1 py-5 bg-secondary-bg text-primary-text rounded-[24px] font-bold hover:bg-border-gray/50 transition-all flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" />
                      Download PDF
                    </button>
                    <Link 
                      to="/pharmacy"
                      className="flex-[2] py-5 bg-accent-primary text-white rounded-[24px] font-bold hover:bg-[#105f72] transition-all shadow-lg shadow-accent-primary/15 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Order from Pharmacy
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Prescriptions;

