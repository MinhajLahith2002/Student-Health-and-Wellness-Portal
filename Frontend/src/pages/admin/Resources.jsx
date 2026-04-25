import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, BookOpen, Video, FileText, Eye, CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { useForm } from '../../hooks/useForm';

const Toast = ({ message, type, onClose }) => (
  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
    className={cn('fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl font-bold text-sm', type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white')}>
    {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
    {message}
    <button onClick={onClose}><XCircle className="w-4 h-4 ml-2 opacity-70" /></button>
  </motion.div>
);

const ConfirmModal = ({ item, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center">
      <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6"><Trash2 className="w-8 h-8 text-rose-600" /></div>
      <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete Resource?</h3>
      <p className="text-slate-500 mb-8">Delete <span className="font-bold text-slate-900">"{item?.title}"</span>? This cannot be undone.</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}{loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </motion.div>
  </div>
);

const ResourceModal = ({ editItem, onClose, onSaved }) => {
  const isEdit = !!editItem;
  const [apiError, setApiError] = useState('');
  const validate = (v) => {
    const e = {};
    if (!v.title?.trim()) e.title = 'Title is required';
    if (!v.category?.trim()) e.category = 'Category is required';
    if (!v.description?.trim()) e.description = 'Description is required (min 20 characters)';
    else if (v.description.trim().length < 20) e.description = 'Description must be at least 20 characters';
    if (!v.content?.trim()) e.content = 'Content is required (min 40 characters)';
    else if (v.content.trim().length < 40) e.content = 'Content must be at least 40 characters';
    return e;
  };
  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, setFieldValue } =
    useForm({ title: editItem?.title || '', type: editItem?.type || 'Article', category: editItem?.category || 'Mental Health', description: editItem?.description || '', author: editItem?.author || 'Admin', content: editItem?.content || '', status: editItem?.status || 'Published' }, validate);

  const onSubmit = async (data) => {
    setApiError('');
    try {
      // Backend requires author, content, description
      const payload = {
        title: data.title?.trim(),
        type: data.type?.trim(),
        category: data.category?.trim(),
        author: data.author?.trim() || 'Admin',
        description: data.description?.trim(),
        content: data.content?.trim(),
        status: data.status?.trim()
      };
      let result;
      if (isEdit) {
        result = await apiFetch(`/resources/${editItem._id || editItem.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        result = await apiFetch('/resources', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSaved(result, isEdit);
    } catch (err) { setApiError(err.message || 'Something went wrong'); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Resource' : 'Add Resource'}</h2>
          <button onClick={onClose}><XCircle className="w-6 h-6 text-slate-400" /></button>
        </div>
        {apiError && <div className="mb-4 p-4 bg-rose-50 rounded-2xl text-sm font-bold text-rose-700 flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{apiError}</div>}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Title</label>
            <input name="title" value={values.title} onChange={handleChange} onBlur={handleBlur} placeholder="Resource title"
              className={cn('w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium focus:ring-2 focus:ring-blue-600/20', errors.title && touched.title && 'border border-rose-500')} />
            {errors.title && touched.title && <p className="text-[10px] text-rose-500 font-bold">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
              <select name="type" value={values.type} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium appearance-none">
                {['Article', 'Video', 'Infographic', 'Podcast', 'Guide'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
              <select name="category" value={values.category} onChange={handleChange} onBlur={handleBlur} className={cn('w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium appearance-none focus:ring-2 focus:ring-blue-600/20', errors.category && touched.category && 'border border-rose-500')}>
                {['Mental Health', 'Nutrition', 'General Health', 'Safety', 'Fitness', 'Wellness'].map(c => <option key={c}>{c}</option>)}
              </select>
              {errors.category && touched.category && <p className="text-[10px] text-rose-500 font-bold">{errors.category}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description (min 20 characters)</label>
            <textarea name="description" value={values.description} onChange={handleChange} onBlur={handleBlur} placeholder="Detailed description of the resource"
              rows={3}
              className={cn('w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium focus:ring-2 focus:ring-blue-600/20 resize-none', errors.description && touched.description && 'border border-rose-500')} />
            {errors.description && touched.description && <p className="text-[10px] text-rose-500 font-bold">{errors.description}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content (min 40 characters)</label>
            <textarea name="content" value={values.content} onChange={handleChange} onBlur={handleBlur} placeholder="Resource content or full text"
              rows={3}
              className={cn('w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium focus:ring-2 focus:ring-blue-600/20 resize-none', errors.content && touched.content && 'border border-rose-500')} />
            {errors.content && touched.content && <p className="text-[10px] text-rose-500 font-bold">{errors.content}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
            <div className="flex gap-3">
              {['Published', 'Draft'].map(s => (
                <label key={s} className={cn('flex-1 flex items-center justify-center p-3 rounded-xl cursor-pointer border-2 transition-all', values.status === s ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-transparent bg-slate-50 text-slate-600')}>
                  <input type="radio" name="status" value={s} checked={values.status === s} onChange={() => setFieldValue('status', s)} className="hidden" />
                  <span className="text-xs font-bold">{s}</span>
                </label>
              ))}
            </div>
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

const HealthResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/resources');
      setResources(Array.isArray(data) ? data : (data?.resources || []));
    } catch (err) { showToast(err.message || 'Failed to load resources', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResources(); }, []);

  const filtered = resources.filter(r => {
    const s = r.title?.toLowerCase().includes(search.toLowerCase());
    const t = typeFilter === 'All Types' || r.type === typeFilter;
    return s && t;
  });

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiFetch(`/resources/${deleteTarget._id || deleteTarget.id}`, { method: 'DELETE' });
      setResources(prev => prev.filter(r => (r._id || r.id) !== (deleteTarget._id || deleteTarget.id)));
      showToast('Resource deleted');
      setDeleteTarget(null);
    } catch (err) { showToast(err.message || 'Failed to delete', 'error'); }
    finally { setDeleteLoading(false); }
  };

  const handleSaved = (result, isEdit) => {
    if (isEdit) { setResources(prev => prev.map(r => (r._id || r.id) === (result._id || result.id) ? result : r)); showToast('Resource updated'); setEditItem(null); }
    else { setResources(prev => [result, ...prev]); showToast('Resource created'); setShowAdd(false); }
  };

  const typeIcon = (type) => ({ Video: Video, Article: FileText, Infographic: BookOpen }[type] || FileText);

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Health Resources</h1>
            <p className="text-slate-500 mt-2 text-lg">Publish and manage self-help articles, videos, and guides.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchResources} className="p-4 bg-white border border-slate-100 rounded-full hover:bg-slate-50 shadow-sm"><RefreshCw className={cn('w-5 h-5 text-slate-500', loading && 'animate-spin')} /></button>
            <button onClick={() => setShowAdd(true)} className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2"><Plus className="w-5 h-5" />Add Resource</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600/20" />
          </div>
          <div className="relative w-full md:w-44">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 outline-none appearance-none">
              {['All Types', 'Article', 'Video', 'Infographic', 'Guide'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400"><BookOpen className="w-10 h-10 mb-4 opacity-30" /><p className="font-bold">No resources found</p></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-slate-50/50 border-b border-slate-100">
                {['Resource', 'Type', 'Category', 'Status', 'Actions'].map(h => <th key={h} className={cn('px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]', h === 'Actions' && 'text-right')}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(r => {
                  const Icon = typeIcon(r.type);
                  return (
                    <tr key={r._id || r.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Icon className="w-5 h-5 text-blue-600" /></div><p className="text-sm font-bold text-slate-900">{r.title}</p></div></td>
                      <td className="px-8 py-5"><span className="text-xs font-bold text-slate-500">{r.type}</span></td>
                      <td className="px-8 py-5"><span className="text-xs font-bold text-slate-500">{r.category}</span></td>
                      <td className="px-8 py-5"><span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', r.status === 'Published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')}>{r.status || 'Published'}</span></td>
                      <td className="px-8 py-5 text-right"><div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditItem(r)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(r)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAdd && <ResourceModal editItem={null} onClose={() => setShowAdd(false)} onSaved={handleSaved} />}
        {editItem && <ResourceModal editItem={editItem} onClose={() => setEditItem(null)} onSaved={handleSaved} />}
        {deleteTarget && <ConfirmModal item={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
};

export default HealthResources;
