import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Search, CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { useForm } from '../../hooks/useForm';

const Toast = ({ message, type, onClose }) => (
  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
    className={cn('fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl font-bold text-sm', type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white')}>
    {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
    {message}<button onClick={onClose}><XCircle className="w-4 h-4 ml-2 opacity-70" /></button>
  </motion.div>
);

const FAQModal = ({ editItem, onClose, onSaved }) => {
  const isEdit = !!editItem;
  const [apiError, setApiError] = useState('');
  const validate = (v) => {
    const e = {};
    if (!v.question?.trim()) e.question = 'Question is required';
    if (!v.answer?.trim()) e.answer = 'Answer is required';
    return e;
  };
  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, setFieldValue } =
    useForm({ question: editItem?.question || '', answer: editItem?.answer || '', category: editItem?.category || 'General' }, validate);

  const onSubmit = async (data) => {
    setApiError('');
    try {
      let result;
      if (isEdit) {
        result = await apiFetch(`/faqs/${editItem._id || editItem.id}`, { method: 'PUT', body: JSON.stringify(data) });
      } else {
        const endpoints = ['/faqs', '/faq', '/admin/faqs', '/admin/faq'];
        let lastErr = null;
        for (const ep of endpoints) {
          try { result = await apiFetch(ep, { method: 'POST', body: JSON.stringify(data) }); lastErr = null; break; }
          catch(e) { lastErr = e; if (!e.message?.includes('404') && !e.message?.includes('Not Found')) throw e; }
        }
        if (lastErr) throw lastErr;
      }
      onSaved(result, isEdit);
    } catch (err) { setApiError(err.message || 'Something went wrong'); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit FAQ' : 'Add FAQ'}</h2>
          <button onClick={onClose}><XCircle className="w-6 h-6 text-slate-400" /></button>
        </div>
        {apiError && <div className="mb-4 p-4 bg-rose-50 rounded-2xl text-sm font-bold text-rose-700 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{apiError}</div>}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question</label>
            <input name="question" value={values.question} onChange={handleChange} onBlur={handleBlur} placeholder="Enter the question..."
              className={cn('w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium focus:ring-2 focus:ring-blue-600/20', errors.question && touched.question && 'border border-rose-500')} />
            {errors.question && touched.question && <p className="text-[10px] text-rose-500 font-bold">{errors.question}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Answer</label>
            <textarea name="answer" value={values.answer} onChange={handleChange} onBlur={handleBlur} rows={4} placeholder="Enter the answer..."
              className={cn('w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium focus:ring-2 focus:ring-blue-600/20 resize-none', errors.answer && touched.answer && 'border border-rose-500')} />
            {errors.answer && touched.answer && <p className="text-[10px] text-rose-500 font-bold">{errors.answer}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
            <input name="category" value={values.category} onChange={handleChange} placeholder="e.g. General, Health, Pharmacy"
              className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium focus:ring-2 focus:ring-blue-600/20" />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}{isSubmitting ? 'Saving...' : isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const FAQManager = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const endpoints = ['/faqs', '/faq', '/admin/faqs', '/admin/faq'];
      let list = [];
      for (const ep of endpoints) {
        try {
          const data = await apiFetch(ep);
          list = Array.isArray(data) ? data : (data?.faqs || data?.faq || data?.data || data?.results || []);
          break;
        } catch(e) { if (!e.message?.includes('404') && !e.message?.includes('Not Found')) break; }
      }
      setFaqs(list);
    } catch (err) { if (!err.message?.includes('Not Found') && !err.message?.includes('404')) showToast(err.message || 'Failed to load FAQs', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFAQs(); }, []);

  const filtered = faqs.filter(f => f.question?.toLowerCase().includes(search.toLowerCase()) || f.answer?.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (faq) => {
    setDeleteLoading(faq._id || faq.id);
    try {
      await apiFetch(`/faqs/${faq._id || faq.id}`, { method: 'DELETE' });
      setFaqs(prev => prev.filter(f => (f._id || f.id) !== (faq._id || faq.id)));
      showToast('FAQ deleted');
    } catch (err) { showToast(err.message || 'Failed to delete', 'error'); }
    finally { setDeleteLoading(null); }
  };

  const handleSaved = (result, isEdit) => {
    if (isEdit) { setFaqs(prev => prev.map(f => (f._id || f.id) === (result._id || result.id) ? result : f)); showToast('FAQ updated'); setEditItem(null); }
    else { setFaqs(prev => [result, ...prev]); showToast('FAQ created'); setShowAdd(false); }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">FAQ Manager</h1>
            <p className="text-slate-500 mt-2 text-lg">Manage frequently asked questions for the platform.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchFAQs} className="p-4 bg-white border border-slate-100 rounded-full hover:bg-slate-50 shadow-sm"><RefreshCw className={cn('w-5 h-5 text-slate-500', loading && 'animate-spin')} /></button>
            <button onClick={() => setShowAdd(true)} className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2"><Plus className="w-5 h-5" />Add FAQ</button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search FAQs..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-sm outline-none focus:ring-2 focus:ring-blue-600/20" />
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-slate-400"><Search className="w-10 h-10 mb-4 opacity-30" /><p className="font-bold">No FAQs found</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(faq => (
              <div key={faq._id || faq.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-6 cursor-pointer" onClick={() => setExpandedId(expandedId === (faq._id || faq.id) ? null : (faq._id || faq.id))}>
                  <div className="flex items-center gap-4 flex-1">
                    <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs font-bold shrink-0">Q</span>
                    <p className="font-bold text-slate-900 text-sm">{faq.question}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={(e) => { e.stopPropagation(); setEditItem(faq); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(faq); }} disabled={deleteLoading === (faq._id || faq.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-40">
                      {deleteLoading === (faq._id || faq.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                    {expandedId === (faq._id || faq.id) ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>
                <AnimatePresence>
                  {expandedId === (faq._id || faq.id) && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-6 pb-6 pl-18">
                        <div className="ml-12 p-4 bg-slate-50 rounded-xl">
                          <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                          {faq.category && <span className="mt-3 inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-widest">{faq.category}</span>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && <FAQModal editItem={null} onClose={() => setShowAdd(false)} onSaved={handleSaved} />}
        {editItem && <FAQModal editItem={editItem} onClose={() => setEditItem(null)} onSaved={handleSaved} />}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
};

export default FAQManager;
