import React, { useEffect, useMemo, useState } from 'react';
import { 
  Bell, 
  Send, 
  Clock, 
  CheckCircle2, 
  Users, 
  Smartphone, 
  Mail, 
  Plus, 
  Search,
  Filter,
  Trash2,
  Eye,
  Calendar,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';

import { useForm } from '../../hooks/useForm';

const NotificationsHub = () => {
  const [selectedId, setSelectedId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const validate = (values) => {
    const errors = {};
    if (!values.title?.trim()) errors.title = "Title is required";
    if (!values.message?.trim()) {
      errors.message = "Message content is required";
    } else if (values.message.length > 250) {
      errors.message = "Message cannot exceed 250 characters";
    }
    return errors;
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    resetForm,
    setFieldValue
  } = useForm({
    title: '',
    message: '',
    target: 'All Users'
  }, validate);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch('/notifications?limit=100');
        if (!active) return;
        const rows = Array.isArray(data?.notifications) ? data.notifications : [];
        setNotifications(rows);
        if (rows[0]?._id) setSelectedId(rows[0]._id);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load notifications');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const selectedNotification = useMemo(
    () => notifications.find((n) => n._id === selectedId) || null,
    [notifications, selectedId]
  );

  useEffect(() => {
    if (selectedNotification) {
      setValues({
        title: selectedNotification.title,
        message: selectedNotification.message,
        target: selectedNotification.target
      });
    } else {
      resetForm();
    }
  }, [selectedNotification, setValues, resetForm]);

  const handleSend = async () => {
    setError('');
    handleSubmit(async (data) => {
      setIsSending(true);
      try {
        const created = await apiFetch('/notifications', {
          method: 'POST',
          body: JSON.stringify({
            ...data,
            type: 'system'
          })
        });
        setNotifications((prev) => [created, ...prev]);
        setSelectedId(created._id);
        resetForm();
      } catch (err) {
        setError(err.message || 'Failed to send notification');
      } finally {
        setIsSending(false);
      }
    });
  };

  const handleDelete = async () => {
    if (!selectedNotification?._id) return;
    try {
      await apiFetch(`/notifications/${selectedNotification._id}`, { method: 'DELETE' });
      const next = notifications.filter((n) => n._id !== selectedNotification._id);
      setNotifications(next);
      setSelectedId(next[0]?._id || '');
    } catch (err) {
      setError(err.message || 'Failed to delete notification');
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Notifications Hub</h1>
            <p className="text-slate-500 mt-2 text-lg">Create and manage push notifications for the platform.</p>
          </div>
          <button className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Notification
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: History List */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search notifications..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              {notifications.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => setSelectedId(notif._id)}
                  className={cn(
                    "w-full p-6 rounded-[24px] border-2 text-left transition-all relative group",
                    selectedId === notif.id 
                      ? "border-blue-600 bg-blue-50/30" 
                      : "border-white bg-white hover:border-blue-100 shadow-sm"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      notif.status === 'Sent' ? "bg-emerald-50 text-emerald-600" :
                      notif.status === 'Scheduled' ? "bg-blue-50 text-blue-600" :
                      "bg-slate-100 text-slate-500"
                    )}>
                      {notif.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(notif.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 truncate">{notif.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notif.target}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Composer / Detail */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden sticky top-28">
              <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedId ? 'Edit Notification' : 'Create Notification'}
                  </h2>
                  <div className="flex gap-2">
                    <button className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={handleDelete} className="p-3 bg-slate-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  {/* Form */}
                  <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notification Title</label>
                      <input 
                        name="title"
                        type="text" 
                        value={values.title}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={cn(
                          "w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-900",
                          errors.title && touched.title && "border-rose-500 bg-rose-50/10"
                        )}
                        placeholder="Enter title..." 
                      />
                      {errors.title && touched.title && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">{errors.title}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message Content</label>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{values.message.length} / 250</span>
                      </div>
                      <textarea 
                        name="message"
                        rows={5}
                        value={values.message}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={cn(
                          "w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-medium text-slate-600 resize-none",
                          errors.message && touched.message && "border-rose-500 bg-rose-50/10"
                        )}
                        placeholder="Type your message here..." 
                      />
                      {errors.message && touched.message && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">{errors.message}</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Audience</label>
                      <div className="grid grid-cols-2 gap-3">
                        {["All Users", "All Students", "All Doctors", "Specific Role"].map(t => (
                          <label key={t} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border-2 border-transparent has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                            <input 
                              type="radio" 
                              name="target" 
                              value={t}
                              checked={values.target === t} 
                              onChange={() => setFieldValue('target', t)} 
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600" 
                            />
                            <span className="text-xs font-bold text-slate-600">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                      <button type="button" onClick={() => resetForm()} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-bold hover:bg-slate-200 transition-all">Clear Form</button>
                      <button 
                        type="button" 
                        onClick={handleSend} 
                        disabled={isSending}
                        className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isSending ? (
                          <Bell className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                        {isSending ? 'Sending...' : 'Send Now'}
                      </button>
                    </div>
                  </form>

                  {/* Preview */}
                  <div className="hidden xl:block">
                    <div className="relative mx-auto w-[300px] h-[600px] bg-slate-900 rounded-[50px] border-[8px] border-slate-800 shadow-2xl overflow-hidden">
                      {/* Phone Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-10"></div>
                      
                      {/* Wallpaper */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-20"></div>
                      
                      {/* Notification Card */}
                      <div className="absolute top-20 left-4 right-4">
                        <motion.div 
                          initial={{ y: -20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                              <Bell className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">CampusHealth</span>
                            <span className="text-[10px] text-slate-400 font-medium ml-auto">now</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{selectedNotification?.title || "Notification Title"}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {selectedNotification?.message || "Your message will appear here for users to read on their mobile devices."}
                          </p>
                        </motion.div>
                      </div>

                      {/* Bottom Bar */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/30 rounded-full"></div>
                    </div>
                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mt-6">Live Mobile Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </>
  );
};

export default NotificationsHub;