import React, { useEffect, useMemo, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Users, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  XCircle,
  Save,
  CheckCircle2,
  Filter,
  Search,
  List,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

import { useForm } from '../../hooks/useForm';

const EventManager = () => {
  const [view, setView] = useState('calendar');
  const [currentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  const validate = (values) => {
    const errors = {};
    if (!values.title) errors.title = "Event title is required";
    if (!values.description) errors.description = "Description is required";
    if (!values.date) errors.date = "Date is required";
    if (!values.time) errors.time = "Time is required";
    if (!values.location) errors.location = "Location is required";
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
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    target: 'All Students'
  }, validate);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch('/events?upcoming=false&limit=200');
        if (active) setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load events');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const eventsWithDateKey = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        dateKey: new Date(event.date).toISOString().split('T')[0]
      })),
    [events]
  );

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfMonth + 1;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return {
      day,
      date,
      isCurrentMonth: day > 0 && day <= daysInMonth,
      events: eventsWithDateKey.filter((e) => e.dateKey === date.toISOString().split('T')[0])
    };
  });

  const handleCreateEvent = async (data) => {
    setError('');
    try {
      const payload = {
        ...data,
        status: 'Published',
        color: 'blue'
      };
      const created = await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setEvents((prev) => [created, ...prev]);
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await apiFetch(`/events/${id}`, { method: 'DELETE' });
      setEvents((prev) => prev.filter((ev) => ev._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Event Manager</h1>
            <p className="text-slate-500 mt-2 text-lg">Create and manage campus health events and workshops.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm flex gap-1">
              <button 
                onClick={() => setView('calendar')}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  view === 'calendar' ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-400 hover:bg-slate-50"
                )}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setView('list')}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  view === 'list' ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-400 hover:bg-slate-50"
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Event
            </button>
          </div>
        </div>

        {/* Calendar View */}
        <AnimatePresence mode="wait">
          {view === 'calendar' ? (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Calendar Header */}
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-blue-600">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">
                    Today
                  </button>
                  <button className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-blue-600">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 border-b border-slate-50">
                {DAYS.map(day => (
                  <div key={day} className="py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "min-h-[140px] p-4 border-r border-b border-slate-50 transition-colors hover:bg-slate-50/50",
                      !day.isCurrentMonth && "bg-slate-50/30"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-bold",
                      day.isCurrentMonth ? "text-slate-900" : "text-slate-300",
                      day.date.toDateString() === new Date(2026, 2, 1).toDateString() && "text-blue-600"
                    )}>
                      {day.day}
                    </span>
                    <div className="mt-2 space-y-1">
                      {day.events.map(event => (
                        <button 
                          key={event.id}
                          className={cn(
                            "w-full p-2 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-95",
                            event.color === 'blue' ? "bg-blue-50 text-blue-700 border border-blue-100" :
                            event.color === 'purple' ? "bg-purple-50 text-purple-700 border border-purple-100" :
                            event.color === 'emerald' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            "bg-amber-50 text-amber-700 border border-amber-100"
                          )}
                        >
                          <p className="text-[10px] font-bold truncate">{event.title}</p>
                          <p className="text-[8px] font-medium opacity-70 truncate">{event.time.split(' ')[0]}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {eventsWithDateKey.map((event) => (
                <div key={event._id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex flex-col items-center justify-center",
                      event.color === 'blue' ? "bg-blue-50 text-blue-600" :
                      event.color === 'purple' ? "bg-purple-50 text-purple-600" :
                      event.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                      "bg-amber-50 text-amber-600"
                    )}>
                      <span className="text-xs font-bold uppercase">{event.date.split('-')[1]}</span>
                      <span className="text-2xl font-bold">{event.date.split('-')[2]}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{event.title}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Users className="w-3.5 h-3.5" />
                          {event.target}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteEvent(event._id)} className="p-3 bg-slate-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>

      {/* Add Event Modal Placeholder */}
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
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Add New Event</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <XCircle className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(handleCreateEvent);
                }} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Title</label>
                    <input 
                      name="title"
                      value={values.title} 
                      onChange={handleChange}
                      onBlur={handleBlur}
                      type="text" 
                      className={cn(
                        "w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-900",
                        errors.title && touched.title && "border-rose-500 bg-rose-50/10"
                      )}
                      placeholder="e.g. Flu Shot Clinic" 
                    />
                    {errors.title && touched.title && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">{errors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                    <textarea 
                      name="description"
                      value={values.description} 
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={cn(
                        "w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-medium text-slate-600",
                        errors.description && touched.description && "border-rose-500 bg-rose-50/10"
                      )}
                      placeholder="Event details..." 
                    />
                    {errors.description && touched.description && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">{errors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                      <input 
                        name="date"
                        value={values.date} 
                        onChange={handleChange}
                        onBlur={handleBlur}
                        type="date" 
                        className={cn(
                          "w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-600",
                          errors.date && touched.date && "border-rose-500 bg-rose-50/10"
                        )}
                      />
                      {errors.date && touched.date && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">{errors.date}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Range</label>
                      <input 
                        name="time"
                        value={values.time} 
                        onChange={handleChange}
                        onBlur={handleBlur}
                        type="text" 
                        className={cn(
                          "w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-600",
                          errors.time && touched.time && "border-rose-500 bg-rose-50/10"
                        )}
                        placeholder="e.g. 09:00 AM - 04:00 PM" 
                      />
                      {errors.time && touched.time && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">{errors.time}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        name="location"
                        value={values.location} 
                        onChange={handleChange}
                        onBlur={handleBlur}
                        type="text" 
                        className={cn(
                          "w-full pl-12 pr-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-600",
                          errors.location && touched.location && "border-rose-500 bg-rose-50/10"
                        )}
                        placeholder="e.g. Campus Health Center" 
                      />
                    </div>
                    {errors.location && touched.location && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">{errors.location}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Audience</label>
                    <select 
                      name="target"
                      value={values.target} 
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-600"
                    >
                      <option>All Students</option>
                      <option>All Users</option>
                      <option>Specific Groups</option>
                    </select>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-bold hover:bg-slate-200 transition-all">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      {isSubmitting ? 'Saving...' : 'Save Event'}
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

export default EventManager;
