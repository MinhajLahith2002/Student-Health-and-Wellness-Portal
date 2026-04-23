import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createAvailability, deleteAvailability, getMyAvailability, updateAvailability } from '../../../lib/providers';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { LoadingState } from '../../../components/LoadingState';
import { useAuth } from '../../../hooks/useAuth';
import { useSocket } from '../../../hooks/useSocket';
import { toLocalDateInputValue } from '../../../lib/date';

const WEEKDAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 }
];

const TIME_OPTIONS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM'
];

const CONSULTATION_TYPES = ['Video Call', 'In-Person'];

function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toLocalDateInputValue(date);
}

function getInitialForm() {
  return {
    id: '',
    title: '',
    scheduleMode: 'recurring',
    date: getTomorrow(),
    recurringDays: [1, 3, 5],
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    slotDuration: 30,
    consultationTypes: ['Video Call', 'In-Person'],
    isUnavailable: false,
    status: 'Active',
    notes: '',
    breaks: [{ startTime: '12:00 PM', endTime: '12:30 PM', label: 'Lunch break' }]
  };
}

function formatEntryLabel(entry) {
  if (entry.date) {
    return new Date(entry.date).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  const labels = (entry.recurringDays || [])
    .map((value) => WEEKDAYS.find((day) => day.value === value)?.label)
    .filter(Boolean);

  return labels.length ? `Repeats ${labels.join(', ')}` : 'Recurring schedule block';
}

function formatAppointmentDate(value) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTimeLabel(timeValue) {
  if (!timeValue) return 'Time unavailable';

  const match = `${timeValue}`.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return timeValue;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    const safeHours = hours % 12 || 12;
    return `${String(safeHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
  }

  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function toMinutes(timeValue) {
  const match = `${timeValue}`.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];

  if (hours === 12) hours = 0;
  if (meridiem === 'PM') hours += 12;

  return (hours * 60) + minutes;
}

export default function ManageAvailability() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState(getInitialForm());
  const { listenForAvailabilityUpdates, subscribeQueue, unsubscribeQueue } = useSocket();

  const providerId = user?.id || user?._id || '';

  const loadEntries = useCallback(async () => {
    const data = await getMyAvailability();
    setEntries(Array.isArray(data?.entries) ? data.entries : []);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getMyAvailability();
        if (!active) return;
        setEntries(Array.isArray(data?.entries) ? data.entries : []);
      } catch (err) {
        if (active) {
          setStatus(err.message || 'Failed to load availability');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!providerId) return undefined;

    const removeAvailabilityListener = listenForAvailabilityUpdates(async (payload) => {
      if (payload?.role && payload.role !== 'doctor') {
        return;
      }

      try {
        await loadEntries();
      } catch (error) {
        setStatus(error.message || 'Failed to refresh availability');
      }
    });

    subscribeQueue(providerId, async () => {
      try {
        await loadEntries();
      } catch (error) {
        setStatus(error.message || 'Failed to refresh availability');
      }
    });

    return () => {
      removeAvailabilityListener?.();
      unsubscribeQueue(providerId);
    };
  }, [listenForAvailabilityUpdates, loadEntries, providerId, subscribeQueue, unsubscribeQueue]);

  function toggleRecurringDay(value) {
    setForm((current) => ({
      ...current,
      recurringDays: current.recurringDays.includes(value)
        ? current.recurringDays.filter((day) => day !== value)
        : [...current.recurringDays, value].sort((left, right) => left - right)
    }));
  }

  function toggleConsultationType(value) {
    setForm((current) => ({
      ...current,
      consultationTypes: current.consultationTypes.includes(value)
        ? current.consultationTypes.filter((entry) => entry !== value)
        : [...current.consultationTypes, value]
    }));
  }

  function updateBreak(index, key, value) {
    setForm((current) => ({
      ...current,
      breaks: current.breaks.map((entry, entryIndex) => (
        entryIndex === index ? { ...entry, [key]: value } : entry
      ))
    }));
  }

  function addBreak() {
    setForm((current) => ({
      ...current,
      breaks: [...current.breaks, { startTime: '01:00 PM', endTime: '01:30 PM', label: '' }]
    }));
  }

  function removeBreak(index) {
    setForm((current) => ({
      ...current,
      breaks: current.breaks.filter((_, entryIndex) => entryIndex !== index)
    }));
  }

  function resetForm() {
    setForm(getInitialForm());
  }

  function startEdit(entry) {
    setForm({
      id: entry._id,
      title: entry.title || '',
      scheduleMode: entry.date ? 'specific' : 'recurring',
      date: entry.date ? toLocalDateInputValue(entry.date) : getTomorrow(),
      recurringDays: entry.recurringDays || [],
      startTime: entry.startTime || '09:00 AM',
      endTime: entry.endTime || '05:00 PM',
      slotDuration: entry.slotDuration || 30,
      consultationTypes: entry.consultationTypes?.length ? entry.consultationTypes : ['Video Call', 'In-Person'],
      isUnavailable: Boolean(entry.isUnavailable),
      status: entry.status || 'Active',
      notes: entry.notes || '',
      breaks: entry.breaks?.length ? entry.breaks : []
    });
    setStatus('Editing an existing availability block.');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.scheduleMode === 'specific' && !form.date) {
      setStatus('Please choose a date for the one-time availability block.');
      return;
    }

    if (form.scheduleMode === 'recurring' && form.recurringDays.length === 0) {
      setStatus('Choose at least one recurring day for this schedule block.');
      return;
    }

    if (!form.isUnavailable && toMinutes(form.endTime) <= toMinutes(form.startTime)) {
      setStatus('End time must be after the start time.');
      return;
    }

    if (!form.isUnavailable && form.consultationTypes.length === 0) {
      setStatus('Choose at least one consultation type for published slots.');
      return;
    }

    const hasInvalidBreak = form.breaks.some((entry) => {
      if (!entry.startTime || !entry.endTime) return false;
      const start = toMinutes(entry.startTime);
      const end = toMinutes(entry.endTime);
      return start === null || end === null || end <= start;
    });

    if (hasInvalidBreak) {
      setStatus('Each break must have a valid start and end time.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      date: form.scheduleMode === 'specific' ? form.date : null,
      recurringDays: form.scheduleMode === 'recurring' ? form.recurringDays : [],
      startTime: form.isUnavailable ? '' : form.startTime,
      endTime: form.isUnavailable ? '' : form.endTime,
      slotDuration: Number(form.slotDuration),
      consultationTypes: form.isUnavailable ? [] : form.consultationTypes,
      isUnavailable: form.isUnavailable,
      status: form.status,
      notes: form.notes.trim(),
      breaks: form.isUnavailable ? [] : form.breaks.filter((entry) => entry.startTime && entry.endTime)
    };

    try {
      setSubmitting(true);
      setStatus('');
      if (form.id) {
        await updateAvailability(form.id, payload);
        setStatus('Availability block updated.');
      } else {
        await createAvailability(payload);
        setStatus('Availability block added.');
      }
      resetForm();
      await loadEntries();
    } catch (err) {
      setStatus(err.message || 'Failed to save availability');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      setRemovingId(id);
      setStatus('');
      await deleteAvailability(id);
      setStatus('Availability block removed.');
      if (form.id === id) {
        resetForm();
      }
      await loadEntries();
    } catch (err) {
      setStatus(err.message || 'Failed to delete availability');
    } finally {
      setRemovingId('');
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-primary-bg pt-32 px-6 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[440px,1fr] gap-8">
          <section className="bg-white rounded-[32px] border border-[#F0F0F3] p-8 h-fit">
            <h1 className="text-3xl font-bold text-primary-text">Manage Availability</h1>
            <p className="text-secondary-text mt-3">Create, update, pause, or remove recurring schedules, specific dates, breaks, and unavailable days.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none"
                placeholder="Block title, for example Morning Clinic"
              />

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Recurring Days', value: 'recurring' },
                  { label: 'Specific Date', value: 'specific' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, scheduleMode: option.value }))}
                    className={`px-4 py-3 rounded-2xl font-bold text-sm ${form.scheduleMode === option.value ? 'bg-accent-primary text-white' : 'bg-secondary-bg text-primary-text'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-3 text-sm font-semibold text-primary-text">
                <input
                  type="checkbox"
                  checked={form.isUnavailable}
                  onChange={(event) => setForm((current) => ({ ...current, isUnavailable: event.target.checked }))}
                />
                Mark this as an unavailable / holiday block
              </label>

              {form.scheduleMode === 'specific' ? (
                <input
                  type="date"
                  value={form.date}
                  min={toLocalDateInputValue()}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none"
                />
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {WEEKDAYS.map((day) => {
                    const selected = form.recurringDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleRecurringDay(day.value)}
                        className={`px-3 py-3 rounded-2xl font-bold text-sm ${selected ? 'bg-accent-primary text-white' : 'bg-secondary-bg text-primary-text'}`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {!form.isUnavailable && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <select value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none">
                      {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                    </select>
                    <select value={form.endTime} onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))} className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none">
                      {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <select value={form.slotDuration} onChange={(event) => setForm((current) => ({ ...current, slotDuration: Number(event.target.value) }))} className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none">
                      {[15, 30, 45, 50, 60].map((duration) => <option key={duration} value={duration}>{duration} min slots</option>)}
                    </select>
                    <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none">
                      {['Active', 'Inactive'].map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3">Consultation types</p>
                    <div className="flex gap-3">
                      {CONSULTATION_TYPES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleConsultationType(option)}
                          className={`px-4 py-3 rounded-2xl font-bold text-sm ${form.consultationTypes.includes(option) ? 'bg-accent-primary text-white' : 'bg-secondary-bg text-primary-text'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Breaks</p>
                      <button type="button" onClick={addBreak} className="text-sm font-bold text-accent-primary">Add Break</button>
                    </div>
                    {form.breaks.map((entry, index) => (
                      <div key={`${entry.startTime}-${index}`} className="rounded-2xl bg-secondary-bg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <select value={entry.startTime} onChange={(event) => updateBreak(index, 'startTime', event.target.value)} className="px-4 py-3 rounded-2xl bg-white outline-none">
                            {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                          </select>
                          <select value={entry.endTime} onChange={(event) => updateBreak(index, 'endTime', event.target.value)} className="px-4 py-3 rounded-2xl bg-white outline-none">
                            {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={entry.label || ''}
                            onChange={(event) => updateBreak(index, 'label', event.target.value)}
                            className="flex-1 px-4 py-3 rounded-2xl bg-white outline-none"
                            placeholder="Break label"
                          />
                          <button type="button" onClick={() => removeBreak(index)} className="px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <textarea
                rows={4}
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none resize-none"
                placeholder={form.isUnavailable ? 'Optional note about this unavailable day' : 'Optional note about this schedule'}
              />

              {status && <p className={`text-sm ${status.includes('added') || status.includes('updated') || status.includes('removed') || status.includes('Editing') ? 'text-emerald-600' : 'text-red-600'}`}>{status}</p>}

              <div className="flex gap-3">
                {form.id && (
                  <button type="button" onClick={() => { resetForm(); setStatus(''); }} className="flex-1 py-4 bg-secondary-bg text-primary-text rounded-2xl font-bold">
                    Cancel Edit
                  </button>
                )}
                <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-accent-primary text-white rounded-2xl font-bold disabled:opacity-50">
                  {submitting ? 'Saving...' : form.id ? 'Update Block' : 'Add Availability Block'}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white rounded-[32px] border border-[#F0F0F3] p-8">
            <h2 className="text-2xl font-bold text-primary-text mb-6">Published availability</h2>
            <div className="space-y-4">
              {entries.map((entry) => {
                const bookedAppointments = Array.isArray(entry.bookedAppointments) ? entry.bookedAppointments : [];
                const canEditEntry = entry.isEditable !== false;

                return (
                  <div key={entry._id} className="rounded-3xl bg-secondary-bg p-5 space-y-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-primary-text">
                          {entry.isUnavailable ? 'Unavailable / Holiday' : `${entry.startTime} - ${entry.endTime}`}
                        </p>
                        <p className="text-sm text-secondary-text mt-1">{entry.title || formatEntryLabel(entry)}</p>
                        <p className="text-sm text-secondary-text mt-1">{entry.notes || 'Available for booking'}</p>
                        {!entry.isUnavailable && (
                          <p className="text-xs text-secondary-text mt-2">
                            {formatEntryLabel(entry)} - {entry.slotDuration} min - {(entry.consultationTypes || []).join(', ') || 'All types'}
                          </p>
                        )}
                        {entry.breaks?.length > 0 && (
                          <p className="text-xs text-secondary-text mt-1">
                            Breaks: {entry.breaks.map((item) => `${item.startTime}-${item.endTime}`).join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-3">
                        {!entry.isUnavailable && (
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${bookedAppointments.length ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-secondary-text'}`}>
                            {bookedAppointments.length} booked {bookedAppointments.length === 1 ? 'appointment' : 'appointments'}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => startEdit(entry)}
                            disabled={!canEditEntry}
                            className="px-4 py-2 bg-white rounded-full font-bold text-sm text-primary-text disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry._id)}
                            disabled={removingId === entry._id || !canEditEntry}
                            className="px-4 py-2 bg-white rounded-full font-bold text-sm text-rose-600 disabled:opacity-50"
                          >
                            {removingId === entry._id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {!canEditEntry && (
                      <p className="text-xs text-secondary-text">
                        This availability block is linked to the same doctor identity but belongs to another synced doctor account, so it is shown here for booking visibility only.
                      </p>
                    )}

                    {!entry.isUnavailable && (
                      <div className="rounded-3xl bg-white p-5 border border-[#E2E8F0]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-primary-text uppercase tracking-[0.18em]">Booked appointments</h3>
                            <p className="text-sm text-secondary-text mt-1">
                              Appointments created by students from this published availability block appear here.
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-accent-primary">
                            {bookedAppointments.length} scheduled
                          </p>
                        </div>

                        {bookedAppointments.length ? (
                          <div className="space-y-3">
                            {bookedAppointments.map((appointment) => (
                              <div key={appointment._id} className="rounded-2xl bg-secondary-bg p-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div>
                                  <p className="font-bold text-primary-text">{appointment.studentName || 'Student'}</p>
                                  <p className="text-sm text-secondary-text mt-1">
                                    {formatAppointmentDate(appointment.date)} at {formatTimeLabel(appointment.time)} - {appointment.type} - {appointment.status}
                                  </p>
                                  {appointment.studentRecordId && (
                                    <p className="text-xs text-secondary-text mt-1">
                                      Student ID: {appointment.studentRecordId}
                                    </p>
                                  )}
                                  {appointment.studentEmail && (
                                    <p className="text-xs text-secondary-text mt-1">
                                      Contact: {appointment.studentEmail}
                                    </p>
                                  )}
                                  <p className="text-sm text-secondary-text mt-2">
                                    Symptoms: {appointment.symptoms || 'No symptoms submitted.'}
                                  </p>
                                  {appointment.notes && (
                                    <p className="text-sm text-secondary-text mt-1">
                                      Notes: {appointment.notes}
                                    </p>
                                  )}
                                </div>

                                <Link
                                  to={`/doctor/consultation/${appointment._id}`}
                                  className="inline-flex items-center justify-center px-4 py-3 bg-accent-primary text-white rounded-2xl font-bold text-sm whitespace-nowrap"
                                >
                                  Open booking
                                </Link>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-secondary-text">
                            No student has booked this published availability yet.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {!loading && !entries.length && <p className="text-secondary-text">No availability entries published yet.</p>}
              {loading && <LoadingState message="Loading availability..." />}
            </div>
          </section>
        </div>
      </div>
    </ErrorBoundary>
  );
}
