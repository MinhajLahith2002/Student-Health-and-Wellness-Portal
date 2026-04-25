import React, { useEffect, useRef, useState } from 'react';
import {
  Bell, Send, Plus, Search, Trash2, Eye, Users, Loader2, XCircle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';

// ── Root cause of the old bug:
//    useEffect(() => { ... resetForm(); }, [selectedNotification, setValues, resetForm])
//    resetForm had [initialValues] as dep; initialValues is a NEW object each render
//    → resetForm reference changed every render → effect ran every render → INFINITE LOOP
//    → React couldn't process navigation clicks → page felt "stuck"
//
// Fix: NO useEffect for form sync. Drive form state directly from click handlers.

const NotificationsHub = () => {
  const [selectedId, setSelectedId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Uncontrolled form state — no useEffect sync needed ─────────────────────
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('All Users');
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  const titleRef = useRef(null);

  // ── Load notifications ────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch('/notifications?limit=100');
        if (!active) return;
        const rows = Array.isArray(data?.notifications) ? data.notifications : [];
        setNotifications(rows);
        // Select first notification and populate form
        if (rows[0]) {
          setSelectedId(rows[0]._id);
          setTitle(rows[0].title || '');
          setMessage(rows[0].message || '');
          setTarget(rows[0].target || 'All Users');
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load notifications');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // ── Select a notification → populate form directly (no useEffect) ─────────
  const handleSelectNotification = (notif) => {
    setSelectedId(notif._id);
    setTitle(notif.title || '');
    setMessage(notif.message || '');
    setTarget(notif.target || 'All Users');
    setFormErrors({});
    setTouched({});
    setError('');
  };

  // ── New notification → clear form directly ────────────────────────────────
  const handleNewNotification = () => {
    setSelectedId('');
    setTitle('');
    setMessage('');
    setTarget('All Users');
    setFormErrors({});
    setTouched({});
    setError('');
    setTimeout(() => titleRef.current?.focus(), 100);
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!message.trim()) e.message = 'Message is required';
    else if (message.length > 250) e.message = 'Max 250 characters';
    return e;
  };

  // ── Send notification ─────────────────────────────────────────────────────
  const handleSend = async () => {
    const allTouched = { title: true, message: true };
    setTouched(allTouched);
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setError(''); setIsSending(true);
    try {
      const created = await apiFetch('/notifications', {
        method: 'POST',
        body: JSON.stringify({ title, message, target, type: 'system' }),
      });
      setNotifications(prev => [created, ...prev]);
      setSelectedId(created._id);
      setSuccess('Notification sent successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  // ── Delete notification ───────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`/notifications/${deleteId}`, { method: 'DELETE' });
      const next = notifications.filter(n => n._id !== deleteId);
      setNotifications(next);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      if (next[0]) {
        handleSelectNotification(next[0]);
      } else {
        handleNewNotification();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete');
      setShowDeleteConfirm(false);
    }
  };

  const selectedNotification = notifications.find(n => n._id === selectedId) || null;

  const filtered = notifications.filter(n =>
    !searchQuery ||
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TARGETS = ['All Users', 'All Students', 'All Doctors', 'Specific Role'];

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Notifications Hub</h1>
            <p className="text-slate-500 mt-2 text-lg">Create and manage push notifications for the platform.</p>
          </div>
          <button
            onClick={handleNewNotification}
            className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Notification
          </button>
        </div>

        {error && <p className="text-sm text-rose-600 font-medium bg-rose-50 px-4 py-3 rounded-xl">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: History */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : (
              <div className="space-y-3">
                {filtered.map(notif => (
                  <button
                    key={notif._id}
                    onClick={() => handleSelectNotification(notif)}
                    className={cn(
                      'w-full p-5 rounded-[24px] border-2 text-left transition-all',
                      selectedId === notif._id
                        ? 'border-blue-600 bg-blue-50/30 shadow-sm shadow-blue-100'
                        : 'border-white bg-white hover:border-blue-100 shadow-sm'
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest',
                        notif.status === 'Sent' ? 'bg-emerald-50 text-emerald-600' :
                        notif.status === 'Scheduled' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-100 text-slate-500'
                      )}>
                        {notif.status || 'Sent'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 truncate text-sm">{notif.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notif.target}</span>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && !loading && (
                  <div className="py-12 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-3 text-slate-200" />
                    <p className="text-sm font-medium">No notifications yet</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Composer */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedId ? 'Edit Notification' : 'Create Notification'}
                  </h2>
                  <div className="flex gap-2">
                    <button className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all" title="Preview">
                      <Eye className="w-5 h-5" />
                    </button>
                    {selectedId && (
                      <button
                        onClick={() => { setDeleteId(selectedId); setShowDeleteConfirm(true); }}
                        className="p-3 bg-slate-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  {/* Form */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notification Title</label>
                      <input
                        ref={titleRef}
                        type="text"
                        value={title}
                        onChange={e => {
                          setTitle(e.target.value);
                          if (formErrors.title) setFormErrors(p => ({ ...p, title: null }));
                        }}
                        onBlur={() => setTouched(p => ({ ...p, title: true }))}
                        className={cn(
                          'w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-blue-600/20 outline-none font-bold text-slate-900',
                          formErrors.title && touched.title && 'border-rose-500 bg-rose-50/10'
                        )}
                        placeholder="Enter title..."
                      />
                      {formErrors.title && touched.title && (
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{formErrors.title}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message Content</label>
                        <span className="text-[10px] font-bold text-slate-400">{message.length} / 250</span>
                      </div>
                      <textarea
                        rows={5}
                        value={message}
                        onChange={e => {
                          setMessage(e.target.value);
                          if (formErrors.message) setFormErrors(p => ({ ...p, message: null }));
                        }}
                        onBlur={() => setTouched(p => ({ ...p, message: true }))}
                        className={cn(
                          'w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-blue-600/20 outline-none font-medium text-slate-600 resize-none',
                          formErrors.message && touched.message && 'border-rose-500 bg-rose-50/10'
                        )}
                        placeholder="Type your message here..."
                      />
                      {formErrors.message && touched.message && (
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{formErrors.message}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Audience</label>
                      <div className="grid grid-cols-2 gap-3">
                        {TARGETS.map(t => (
                          <label
                            key={t}
                            onClick={() => setTarget(t)}
                            className={cn(
                              'flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2',
                              target === t ? 'border-blue-600 bg-blue-50' : 'bg-slate-50 border-transparent hover:bg-slate-100'
                            )}
                          >
                            <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center',
                              target === t ? 'border-blue-600' : 'border-slate-300'
                            )}>
                              {target === t && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                            </div>
                            <span className={cn('text-xs font-bold', target === t ? 'text-blue-700' : 'text-slate-600')}>{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button type="button" onClick={handleNewNotification} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-bold hover:bg-slate-200 transition-all">
                        Clear Form
                      </button>
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={isSending}
                        className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {isSending ? 'Sending...' : 'Send Now'}
                      </button>
                    </div>
                  </div>

                  {/* Phone Preview */}
                  <div className="hidden xl:block">
                    <div className="relative mx-auto w-[280px] h-[560px] bg-slate-900 rounded-[50px] border-[8px] border-slate-800 shadow-2xl overflow-hidden">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-2xl z-10" />
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-20" />
                      <div className="absolute top-16 left-3 right-3">
                        <motion.div
                          key={title + message}
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                              <Bell className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">CampusHealth</span>
                            <span className="text-[10px] text-slate-400 ml-auto">now</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{title || 'Notification Title'}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
                            {message || 'Your message will appear here for users to see.'}
                          </p>
                        </motion.div>
                      </div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-28 h-1.5 bg-white/30 rounded-full" />
                    </div>
                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">Live Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 z-40 pointer-events-none">
            <div className="bg-emerald-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold">{success}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-10 text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-rose-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Delete Notification?</h2>
              <p className="text-slate-500 mb-8">This action cannot be undone. The notification will be permanently removed.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NotificationsHub;
