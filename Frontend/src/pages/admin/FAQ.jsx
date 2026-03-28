import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  XCircle,
  Save,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const MOCK_FAQS = [
  { id: 1, question: "How do I book an appointment?", answer: "You can book an appointment by navigating to the 'Appointments' section on your dashboard and selecting a doctor or counselor available at your preferred time.", category: "General" },
  { id: 2, question: "Is my data private?", answer: "Yes, CampusHealth uses industry-standard encryption and follows strict HIPAA-compliant protocols to ensure your medical and personal data is secure and private.", category: "Security" },
  { id: 3, question: "How do I upload a prescription?", answer: "Go to the Pharmacy section, click on 'Upload Prescription', and select the image or PDF file from your device. Our pharmacist will verify it within 24 hours.", category: "Pharmacy" },
  { id: 4, question: "What should I do in an emergency?", answer: "For immediate life-threatening emergencies, call campus security at 911 or visit the nearest emergency room. You can also use our 'First Aid' guide for minor issues.", category: "Emergency" },
];

import { useForm } from '../../hooks/useForm';

const FAQManager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const validate = (values) => {
    const errors = {};
    if (!values.question) errors.question = "Question is required";
    if (!values.answer) errors.answer = "Answer is required";
    if (!values.category) errors.category = "Category is required";
    return errors;
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm
  } = useForm({
    question: '',
    answer: '',
    category: 'General'
  }, validate);

  const filteredFaqs = MOCK_FAQS.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">FAQ Manager</h1>
            <p className="text-slate-500 mt-2 text-lg">Maintain a searchable knowledge base for common student questions.</p>
          </div>
          <button 
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New FAQ
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search FAQs by question or answer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
            />
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <div 
              key={faq.id}
              className={cn(
                "bg-white rounded-[24px] border transition-all overflow-hidden",
                expandedId === faq.id ? "border-blue-600 shadow-lg shadow-blue-50" : "border-slate-100 shadow-sm"
              )}
            >
              <button 
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                className="w-full p-6 flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    expandedId === faq.id ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400 group-hover:text-blue-600"
                  )}>
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{faq.question}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{faq.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {expandedId === faq.id ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                </div>
              </button>
              
              <AnimatePresence>
                {expandedId === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-20 pb-8">
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-slate-600 leading-relaxed font-medium">{faq.answer}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[40px] border border-slate-100 border-dashed">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <HelpCircle className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No FAQs Found</h3>
              <p className="text-slate-500">Try adjusting your search query or add a new FAQ.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add FAQ Modal Placeholder */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Add New FAQ</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <XCircle className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit((data) => {
                    console.log("Saving FAQ:", data);
                    resetForm();
                    setShowAddModal(false);
                  });
                }} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question</label>
                    <input 
                      name="question"
                      value={values.question}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      type="text" 
                      className={cn(
                        "w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-900",
                        errors.question && touched.question && "border-rose-500 bg-rose-50/10"
                      )}
                      placeholder="e.g. How do I book an appointment?" 
                    />
                    {errors.question && touched.question && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">{errors.question}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                    <select 
                      name="category"
                      value={values.category}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-600"
                    >
                      <option>General</option>
                      <option>Security</option>
                      <option>Pharmacy</option>
                      <option>Emergency</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Answer</label>
                    <textarea 
                      name="answer"
                      value={values.answer}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rows={4} 
                      className={cn(
                        "w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-medium text-slate-600 resize-none",
                        errors.answer && touched.answer && "border-rose-500 bg-rose-50/10"
                      )}
                      placeholder="Provide a detailed answer..." 
                    />
                    {errors.answer && touched.answer && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">{errors.answer}</p>
                    )}
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-bold hover:bg-slate-200 transition-all">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      {isSubmitting ? 'Saving...' : 'Save FAQ'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FAQManager;