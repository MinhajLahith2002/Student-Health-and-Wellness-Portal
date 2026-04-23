import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ChevronRight,
  Download,
  FileText,
  Search,
  User,
  X
} from 'lucide-react';
import { getPrescriptionHistory } from '../../../lib/appointments';

function formatIssueDate(value) {
  if (!value) return 'Date unavailable';
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function openPrescriptionPrintView(prescription) {
  if (typeof window === 'undefined' || !prescription) return;

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720');
  if (!popup) return;

  const medicinesMarkup = (prescription.medicines || []).map((medicine) => `
    <tr>
      <td style="padding:12px;border:1px solid #d8dee4;">${medicine.name || '-'}</td>
      <td style="padding:12px;border:1px solid #d8dee4;">${medicine.dosage || '-'}</td>
      <td style="padding:12px;border:1px solid #d8dee4;">${medicine.duration || '-'}</td>
      <td style="padding:12px;border:1px solid #d8dee4;">${medicine.instructions || '-'}</td>
    </tr>
  `).join('');

  popup.document.write(`
    <html>
      <head>
        <title>Prescription ${prescription._id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; color: #1f2937; }
          h1, h2, p { margin: 0 0 12px; }
          .meta { margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { text-align: left; padding: 12px; border: 1px solid #d8dee4; background: #f3f4f6; }
          td { vertical-align: top; }
          .notes { margin-top: 24px; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>Prescription Summary</h1>
        <div class="meta">
          <p><strong>Doctor:</strong> ${prescription.doctorName || '-'}</p>
          <p><strong>Student:</strong> ${prescription.studentName || '-'}</p>
          <p><strong>Issued:</strong> ${formatIssueDate(prescription.createdAt)}</p>
          <p><strong>Status:</strong> ${prescription.status || '-'}</p>
        </div>
        <h2>Medicines</h2>
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Duration</th>
              <th>Instructions</th>
            </tr>
          </thead>
          <tbody>${medicinesMarkup}</tbody>
        </table>
        ${prescription.notes ? `<div class="notes"><h2>Notes</h2><p>${prescription.notes}</p></div>` : ''}
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

export default function DoctorPrescriptions() {
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
        setError(err.message || 'Failed to load issued prescriptions');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filteredPrescriptions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return prescriptions.filter((prescription) => (
      (prescription.studentName || '').toLowerCase().includes(query)
      || (Array.isArray(prescription.medicines)
        && prescription.medicines.some((medicine) => (medicine.name || '').toLowerCase().includes(query)))
    ));
  }, [prescriptions, searchQuery]);

  return (
    <div className="min-h-screen bg-primary-bg pb-20">
      <div className="bg-white border-b border-border-gray pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-primary-text tracking-tight">Issued Prescriptions</h1>
          <p className="text-secondary-text mt-2 text-lg">
            Review prescriptions you have issued and reopen the linked consultation when needed.
          </p>

          <div className="mt-10 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-text" />
            <input
              type="text"
              placeholder="Search by student or medicine name..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-secondary-bg border-none rounded-2xl text-sm focus:ring-2 focus:ring-accent-primary/20 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredPrescriptions.map((prescription) => (
            <motion.button
              key={prescription._id}
              type="button"
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-white text-left p-8 rounded-[32px] border border-border-gray shadow-sm hover:shadow-md transition-all"
              onClick={() => setSelectedPrescription(prescription)}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-accent-primary/10 text-accent-primary rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-text">{prescription.studentName || 'Student'}</h3>
                  <p className="text-xs text-secondary-text font-bold uppercase tracking-widest">
                    {formatIssueDate(prescription.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-secondary-text mb-5">
                <User className="w-4 h-4" />
                {prescription.doctorName || 'Doctor'}
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Medicines</p>
                <div className="space-y-2">
                  {(prescription.medicines || []).slice(0, 3).map((medicine, index) => (
                    <div key={`${prescription._id}-${medicine.name}-${index}`} className="flex items-center justify-between text-sm">
                      <span className="font-bold text-primary-text">{medicine.name}</span>
                      <span className="text-secondary-text">{medicine.dosage}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full py-4 bg-secondary-bg text-primary-text rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                View Details
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.button>
          ))}
        </div>

        {loading && <p className="text-sm text-secondary-text">Loading issued prescriptions...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && filteredPrescriptions.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-secondary-bg rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-secondary-text" />
            </div>
            <h3 className="text-2xl font-bold text-primary-text">No issued prescriptions found</h3>
            <p className="text-secondary-text mt-2">
              Prescriptions you issue during consultations will appear here.
            </p>
          </div>
        )}
      </div>

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
                      <p className="text-sm text-secondary-text font-medium">
                        Issued to {selectedPrescription.studentName || 'Student'} on {formatIssueDate(selectedPrescription.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPrescription(null)}
                    className="p-2 hover:bg-secondary-bg rounded-full transition-all"
                  >
                    <X className="w-6 h-6 text-secondary-text" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="bg-secondary-bg p-8 rounded-3xl space-y-6">
                    {(selectedPrescription.medicines || []).map((medicine, index) => (
                      <div key={`${selectedPrescription._id}-${medicine.name}-${index}`} className="pb-6 border-b border-border-gray last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-bold text-primary-text">{medicine.name}</h4>
                          <span className="px-3 py-1 bg-white text-accent-primary text-[10px] font-bold rounded-full uppercase tracking-widest border border-blue-100">
                            {medicine.dosage}
                          </span>
                        </div>
                        <p className="text-sm text-secondary-text font-medium mb-3">Duration: {medicine.duration}</p>
                        <div className="flex items-start gap-2 text-sm text-primary-text font-medium bg-white/50 p-3 rounded-xl">
                          <AlertCircle className="w-4 h-4 text-accent-primary mt-0.5" />
                          {medicine.instructions}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedPrescription.notes && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Consultation Notes</p>
                      <p className="text-sm text-primary-text font-medium leading-relaxed">{selectedPrescription.notes}</p>
                    </div>
                  )}

                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => openPrescriptionPrintView(selectedPrescription)}
                      className="flex-1 py-5 bg-secondary-bg text-primary-text rounded-[24px] font-bold hover:bg-border-gray/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Print / Save PDF
                    </button>
                    {selectedPrescription.appointmentId ? (
                      <Link
                        to={`/doctor/consultation/${selectedPrescription.appointmentId}`}
                        className="flex-[2] py-5 bg-accent-primary text-white rounded-[24px] font-bold hover:bg-[#105f72] transition-all shadow-lg shadow-accent-primary/15 flex items-center justify-center gap-2"
                      >
                        Open Consultation
                      </Link>
                    ) : (
                      <Link
                        to="/doctor/dashboard"
                        className="flex-[2] py-5 bg-accent-primary text-white rounded-[24px] font-bold hover:bg-[#105f72] transition-all shadow-lg shadow-accent-primary/15 flex items-center justify-center gap-2"
                      >
                        Back to Dashboard
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
