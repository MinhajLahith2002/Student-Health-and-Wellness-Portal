import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BatteryLow,
  Brain,
  CalendarDays,
  Check,
  CloudRain,
  Heart,
  Pencil,
  PhoneCall,
  X,
  ShieldAlert,
  Smile,
  Sparkles,
  Trash2,
  TrendingUp
} from 'lucide-react';
import {
  createMoodLog,
  deleteMoodLog,
  getCachedMoodLogs,
  getCachedMoodStats,
  getMoodLogs,
  getMoodStats,
  updateMoodLog
} from '../../lib/mentalHealth';

const moodOptions = [
  {
    label: 'Great',
    score: 8,
    icon: Heart,
    detail: 'Steady, open, and energized.',
    tone: 'text-rose-500',
    badge: 'border-rose-100 bg-rose-50',
    selected: 'border-rose-200 bg-rose-50/80'
  },
  {
    label: 'Okay',
    score: 6,
    icon: Smile,
    detail: 'Balanced enough to keep going.',
    tone: 'text-sky-600',
    badge: 'border-sky-100 bg-sky-50',
    selected: 'border-sky-200 bg-sky-50/80'
  },
  {
    label: 'Down',
    score: 4,
    icon: CloudRain,
    detail: 'Low, flat, or emotionally heavy.',
    tone: 'text-indigo-600',
    badge: 'border-indigo-100 bg-indigo-50',
    selected: 'border-indigo-200 bg-indigo-50/80'
  },
  {
    label: 'Stressed',
    score: 3,
    icon: Activity,
    detail: 'Pressure feels sharp right now.',
    tone: 'text-amber-600',
    badge: 'border-amber-100 bg-amber-50',
    selected: 'border-amber-200 bg-amber-50/80'
  },
  {
    label: 'Tired',
    score: 5,
    icon: BatteryLow,
    detail: 'Energy is low and recovery is needed.',
    tone: 'text-slate-500',
    badge: 'border-slate-200 bg-slate-50',
    selected: 'border-slate-300 bg-slate-50/90'
  },
  {
    label: 'Anxious',
    score: 3,
    icon: Brain,
    detail: 'Thoughts feel fast or unsettled.',
    tone: 'text-violet-600',
    badge: 'border-violet-100 bg-violet-50',
    selected: 'border-violet-200 bg-violet-50/80'
  }
];


const ALERT_MOODS = new Set(['Down', 'Stressed', 'Anxious']);
const sampleNotes = [
  'I felt calmer after taking a short walk between classes.',
  'Group work drained me today, but finishing one task helped.',
  'I slept poorly, so everything felt heavier than usual.'
];

function getInitialForm() {
  return {
    id: '',
    mood: 'Okay',
    moodScore: 6,
    notes: ''
  };
}

function getMoodOption(label) {
  return moodOptions.find((option) => option.label === label) || moodOptions[1];
}

function getMostCommonMood(stats) {
  const entries = Object.entries(stats?.moodDistribution || {});
  if (!entries.length) return 'N/A';
  entries.sort((left, right) => right[1] - left[1]);
  return entries[0][0];
}

function formatDateTime(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
}

function getIntensityCopy(score) {
  if (score <= 3) return 'Light intensity. A short note can help you spot context later.';
  if (score <= 6) return 'Moderate intensity. This is a useful level for pattern tracking.';
  if (score <= 8) return 'High intensity. Consider adding details about what is driving it.';
  return 'Very high intensity. If this feels hard to hold alone, reach out for support now.';
}

export default function MoodTracker() {
  const cachedLogs = getCachedMoodLogs({ limit: 12 });
  const cachedStats = getCachedMoodStats();
  const [form, setForm] = useState(getInitialForm());
  const [stats, setStats] = useState(cachedStats);
  const [logs, setLogs] = useState(Array.isArray(cachedLogs) ? cachedLogs : []);
  const [loading, setLoading] = useState(() => !cachedStats && !(Array.isArray(cachedLogs) && cachedLogs.length));
  const [entryFilter, setEntryFilter] = useState('All');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [editingEntryId, setEditingEntryId] = useState('');
  const formSectionRef = useRef(null);
  const notesFieldRef = useRef(null);

  function upsertVisibleLog(nextEntry) {
    setLogs((current) => {
      const withoutCurrent = current.filter((entry) => entry._id !== nextEntry._id);
      return [nextEntry, ...withoutCurrent]
        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
        .slice(0, 12);
    });
  }

  function removeVisibleLog(id) {
    setLogs((current) => current.filter((entry) => entry._id !== id));
  }

  async function refreshStats(options = {}) {
    const summary = await getMoodStats(options);
    setStats(summary);
  }

  async function loadData() {
    try {
      setLoading(true);
      const [history, summary] = await Promise.all([getMoodLogs({ limit: 12 }), getMoodStats()]);
      setLogs(Array.isArray(history) ? history : []);
      setStats(summary);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load mood tracker');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!status) return undefined;

    const timeoutId = window.setTimeout(() => {
      setStatus('');
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  const activeMood = useMemo(() => getMoodOption(form.mood), [form.mood]);

  const progressWidth = useMemo(() => {
    const average = Number(stats?.averageMood || 0);
    return `${Math.max(0, Math.min(100, average * 10))}%`;
  }, [stats]);
  const averageMoodValue = useMemo(() => Number(stats?.averageMood || 0), [stats]);
  const progressMarkerLeft = useMemo(() => `${Math.max(0, Math.min(100, averageMoodValue * 10))}%`, [averageMoodValue]);

  const supportLevel = useMemo(() => {
    if (!ALERT_MOODS.has(form.mood)) return 'none';
    if (Number(form.moodScore) >= 8) return 'urgent';
    if (Number(form.moodScore) >= 7) return 'high';
    return 'none';
  }, [form.mood, form.moodScore]);

  const showSupportAlert = supportLevel !== 'none';
  const mostCommonMood = useMemo(() => getMostCommonMood(stats), [stats]);
  const sortedLogs = useMemo(() => (
    [...logs].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
  ), [logs]);
  const latestLog = sortedLogs[0] || null;
  const filteredLogs = useMemo(() => {
    if (entryFilter === 'All') return sortedLogs;
    if (entryFilter === 'Needs support') {
      return sortedLogs.filter((entry) => ALERT_MOODS.has(entry.mood));
    }
    if (entryFilter === 'With notes') {
      return sortedLogs.filter((entry) => `${entry.notes || ''}`.trim().length > 0);
    }
    return sortedLogs.filter((entry) => entry.mood === entryFilter);
  }, [entryFilter, sortedLogs]);

  function startEdit(entry) {
    setForm({
      id: entry._id,
      mood: entry.mood,
      moodScore: entry.moodScore || 5,
      notes: entry.notes || ''
    });
    setEditingEntryId(entry._id);
    setStatus('Editing an existing mood log.');
    setError('');

    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        notesFieldRef.current?.focus();
      }, 250);
    });
  }

  function resetForm() {
    setForm(getInitialForm());
    setEditingEntryId('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.mood) {
      setError('Select a mood before saving.');
      return;
    }

    if (form.notes && form.notes.trim().length < 6) {
      setError('If you add a journal note, please make it a little more descriptive.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setStatus('');

      const payload = {
        mood: form.mood,
        moodScore: Number(form.moodScore),
        notes: form.notes.trim()
      };

      if (form.id) {
        const updatedEntry = await updateMoodLog(form.id, payload);
        upsertVisibleLog(updatedEntry);
        setStatus('Mood entry updated.');
      } else {
        const createdEntry = await createMoodLog(payload);
        upsertVisibleLog(createdEntry);
        setStatus('Mood entry saved.');
      }

      resetForm();
      await refreshStats({ forceRefresh: true });
    } catch (err) {
      setError(err.message || 'Failed to save mood entry');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      setDeletingId(id);
      setError('');
      setStatus('');
      await deleteMoodLog(id);
      removeVisibleLog(id);
      if (form.id === id) {
        resetForm();
      }
      if (editingEntryId === id) {
        setEditingEntryId('');
      }
      setStatus('Mood entry deleted.');
      await refreshStats({ forceRefresh: true });
    } catch (err) {
      setError(err.message || 'Failed to delete mood entry');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <div className="student-shell pt-32 md:pt-36 pb-14">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
        <section className="student-hero relative overflow-hidden px-6 py-8 sm:px-8 md:px-10 md:py-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.22)_0%,rgba(125,211,252,0)_72%)]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(20,116,139,0.12)_0%,rgba(20,116,139,0)_72%)]" />
          <div className="relative grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] gap-8 xl:gap-10 items-center">
            <div className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <Link
                  to="/mental-health"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary-text shadow-[0_10px_22px_rgba(15,41,66,0.05)] transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to mental health
                </Link>
              </div>
              <div className="student-chip bg-cyan-100 text-cyan-700 mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Mood Tracker
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[4.2rem] font-semibold tracking-tight leading-[1.02] text-primary-text text-balance max-w-3xl">
                Check in with yourself before the day gets too loud
              </h1>
              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-secondary-text text-balance">
                Capture today&apos;s mood, track intensity, and notice patterns early so support feels easier to reach when you need it.
              </p>
            </div>

            <div className="w-full xl:self-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
                <div className="rounded-[1.6rem] border border-white/70 bg-white/84 px-5 py-5 shadow-[0_14px_34px_rgba(15,41,66,0.06)] backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Average mood</p>
                      <p className="mt-3 text-3xl font-semibold text-primary-text">
                        {stats?.averageMood?.toFixed ? stats.averageMood.toFixed(1) : stats?.averageMood || '0.0'}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 shadow-[0_10px_24px_rgba(15,41,66,0.05)]">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 w-14 rounded-full bg-cyan-200/90" />
                </div>
                <div className="rounded-[1.6rem] border border-white/70 bg-white/84 px-5 py-5 shadow-[0_14px_34px_rgba(15,41,66,0.06)] backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Entries logged</p>
                      <p className="mt-3 text-3xl font-semibold text-primary-text">{stats?.totalLogs || 0}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 shadow-[0_10px_24px_rgba(15,41,66,0.05)]">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 w-14 rounded-full bg-violet-200/90" />
                </div>
                <div className="rounded-[1.6rem] border border-white/70 bg-white/84 px-5 py-5 shadow-[0_14px_34px_rgba(15,41,66,0.06)] backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Most common</p>
                      <p className="mt-3 text-3xl font-semibold text-primary-text">{mostCommonMood}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shadow-[0_10px_24px_rgba(15,41,66,0.05)]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 w-14 rounded-full bg-amber-200/90" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1.04fr,0.96fr] gap-8 items-start">
          <section ref={formSectionRef} className="student-surface relative overflow-hidden p-6 sm:p-8">
            <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(20,116,139,0.10)_0%,rgba(20,116,139,0)_72%)]`} />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
              <div className="max-w-xl">
                <p className="text-[10px] uppercase tracking-[0.22em] text-secondary-text font-bold">Daily check-in</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-primary-text">How are you feeling right now?</h2>
                <p className="mt-3 text-sm sm:text-base leading-7 text-secondary-text">
                  Pick the closest mood, set the intensity, and add a few words if today needs context.
                </p>
              </div>

              <div className={`shrink-0 rounded-[1.5rem] border px-4 py-4 shadow-[0_12px_28px_rgba(15,41,66,0.05)] ${activeMood.badge}`}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Selected mood</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border bg-white ${activeMood.badge} ${activeMood.tone}`}>
                    <activeMood.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary-text">{activeMood.label}</p>
                    <p className="text-xs text-secondary-text">{form.moodScore}/10 intensity</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative space-y-6">
              {form.id && (
                <div className="rounded-[1.5rem] border border-cyan-200 bg-cyan-50/90 px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-700 font-bold">Edit mode</p>
                      <p className="mt-1 text-sm font-medium text-cyan-900">You are editing a saved mood entry. Update the fields below, then click `Update Mood Entry`.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setStatus('');
                        setError('');
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100"
                    >
                      Stop editing
                    </button>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Choose a mood</label>
                  <span className="text-xs text-secondary-text">Tap the card that feels closest</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {moodOptions.map((mood) => {
                    const Icon = mood.icon;
                    const isActive = form.mood === mood.label;

                    return (
                      <button
                        key={mood.label}
                        type="button"
                        onClick={() => setForm((current) => ({
                          ...current,
                          mood: mood.label,
                          moodScore: current.id ? current.moodScore : mood.score
                        }))}
                        className={`rounded-[1.5rem] border p-4 text-left transition-all duration-300 ${
                          isActive
                            ? `${mood.selected} shadow-[0_16px_34px_rgba(15,41,66,0.08)]`
                            : 'border-white/80 bg-white/72 hover:border-slate-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border bg-white ${mood.badge} ${mood.tone}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${isActive ? 'bg-white text-primary-text' : 'bg-slate-100 text-secondary-text'}`}>
                            {mood.score}/10
                          </span>
                        </div>
                        <p className="mt-4 font-semibold text-primary-text">{mood.label}</p>
                        <p className="mt-1 text-sm leading-6 text-secondary-text">{mood.detail}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/70 bg-slate-50/80 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold block">Mood intensity</label>
                    <p className="mt-2 text-sm text-secondary-text">Move the slider to show how strong today feels.</p>
                  </div>
                  <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-text shadow-[0_8px_18px_rgba(15,41,66,0.06)]">
                    {form.moodScore}/10
                  </div>
                </div>

                <div className="mt-5">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={form.moodScore}
                    onChange={(event) => setForm((current) => ({ ...current, moodScore: Number(event.target.value) }))}
                    className="w-full"
                    style={{ accentColor: '#14748B' }}
                  />
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-secondary-text">
                    <span>Light</span>
                    <span>Moderate</span>
                    <span>Heavy</span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500"
                      style={{ width: `${Math.max(10, form.moodScore * 10)}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-secondary-text">{getIntensityCopy(form.moodScore)}</p>
                  {ALERT_MOODS.has(form.mood) && (
                    <p className="mt-3 text-xs text-amber-700">
                      Support guidance appears for {form.mood.toLowerCase()} moods at 7/10 or higher.
                    </p>
                  )}
                </div>
              </div>

              {showSupportAlert && (
                <div
                  className={`rounded-[1.75rem] border px-5 py-5 ${
                    supportLevel === 'urgent'
                      ? 'border-rose-200 bg-rose-50'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        supportLevel === 'urgent' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold ${supportLevel === 'urgent' ? 'text-rose-900' : 'text-amber-900'}`}>
                        {supportLevel === 'urgent' ? 'Urgent support check-in detected' : 'High-intensity check-in detected'}
                      </p>
                      <p className={`mt-2 text-sm leading-6 ${supportLevel === 'urgent' ? 'text-rose-800' : 'text-amber-800'}`}>
                        {supportLevel === 'urgent'
                          ? 'Your mood looks very intense right now. Please check counseling support, and call emergency help immediately if you feel unsafe.'
                          : 'This check-in looks heavy. It may help to connect with counseling support before the day gets more difficult.'}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          to="/mental-health/counselors"
                          className="inline-flex items-center gap-2 rounded-2xl bg-accent-primary px-4 py-3 font-bold text-white shadow-[0_12px_28px_rgba(20,116,139,0.18)]"
                        >
                          Check Counseling
                        </Link>
                        <a
                          href="tel:1990"
                          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-bold text-rose-700 shadow-[0_10px_22px_rgba(15,41,66,0.08)]"
                        >
                          <PhoneCall className="h-4 w-4" />
                          Emergency Call 1990
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/72 p-5">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="mood-notes" className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">
                    Journal note
                  </label>
                  <span className="text-xs text-secondary-text">
                    {form.notes.trim().length ? `${form.notes.trim().length} characters` : 'Optional'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-secondary-text">Optional, but useful when you want to remember what shaped the day.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sampleNotes.map((note, index) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, notes: note }))}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-secondary-text transition-colors hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      {`Sample ${index + 1}`}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={notesFieldRef}
                  id="mood-notes"
                  rows={5}
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="mt-4 min-h-[9rem] w-full rounded-[1.4rem] border border-[#d9e8ee] bg-white px-4 py-4 text-primary-text outline-none resize-none shadow-[0_10px_24px_rgba(15,41,66,0.04)] transition-all duration-300 focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10"
                  placeholder="Example: I felt overwhelmed before class, but talking to a friend helped me settle down."
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
              {status && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-700">
                  <span>{status}</span>
                  <button
                    type="button"
                    onClick={() => setStatus('')}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-cyan-700 transition-colors hover:bg-cyan-100"
                    aria-label="Dismiss status message"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                {form.id && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setStatus('');
                      setError('');
                    }}
                    className="student-secondary-button flex-1"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex flex-[1.3] items-center justify-center gap-2 rounded-[1.45rem] bg-[linear-gradient(135deg,#14748b_0%,#1f869c_100%)] px-6 py-4 font-bold text-white shadow-[0_18px_34px_rgba(20,116,139,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(20,116,139,0.28)] disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <Check className="h-4 w-4" />
                  {submitting ? 'Saving...' : form.id ? 'Update Mood Entry' : 'Save Mood Entry'}
                </button>
              </div>
            </form>
          </section>

          <section className="space-y-6">
            <div className="student-surface p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Pattern view</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary-text">Your mood picture at a glance</h2>
                  <p className="mt-2 text-sm leading-7 text-secondary-text">
                    A compact snapshot of your recent rhythm so it is easier to notice changes quickly.
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 shadow-[0_10px_22px_rgba(15,41,66,0.05)]">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 rounded-[1.9rem] border border-cyan-100 bg-[linear-gradient(135deg,#f7fcfe_0%,#edf8fb_52%,#e4f4f8_100%)] p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-[0_10px_24px_rgba(15,41,66,0.06)]">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Progress snapshot</p>
                        <p className="mt-1 text-3xl font-semibold text-primary-text">
                          {averageMoodValue.toFixed(1)}/10
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-secondary-text">
                      Based on your recent mood intensity average across saved check-ins.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:min-w-[20rem]">
                    <div className="rounded-[1.35rem] border border-white/70 bg-white/85 px-4 py-4 shadow-[0_10px_24px_rgba(15,41,66,0.05)]">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-secondary-text font-bold">Last check-in</p>
                      <div className="mt-3 flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        <p className="text-sm leading-6 text-primary-text">
                          {latestLog ? formatDateTime(latestLog.date) : 'No check-ins yet'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1.35rem] border border-white/70 bg-white/85 px-4 py-4 shadow-[0_10px_24px_rgba(15,41,66,0.05)]">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-secondary-text font-bold">Frequent mood</p>
                      <div className="mt-3 flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <p className="text-sm leading-6 font-medium text-primary-text">{mostCommonMood}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-secondary-text">
                    <span>Lower mood</span>
                    <span>Higher mood</span>
                  </div>
                  <div className="relative pt-8">
                    <div
                      className="absolute top-0 -translate-x-1/2"
                      style={{ left: progressMarkerLeft }}
                    >
                      <div className="rounded-full bg-primary-text px-3 py-1 text-[11px] font-bold text-white shadow-[0_10px_22px_rgba(15,41,66,0.14)]">
                        Avg {averageMoodValue.toFixed(1)}
                      </div>
                      <div className="mx-auto h-3 w-px bg-primary-text/30" />
                    </div>
                    <div className="h-3 rounded-full bg-white/90 overflow-hidden shadow-[inset_0_1px_2px_rgba(15,41,66,0.05)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-purple via-cyan-500 to-emerald-500"
                        style={{ width: progressWidth }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-secondary-text">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/mental-health/suggestions"
                  className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] border border-[#d7e4ea] bg-white/95 px-6 py-3.5 font-bold text-primary-text shadow-[0_12px_28px_rgba(15,41,66,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Explore suggestions
                </Link>
                <Link
                  to="/mental-health/counselors"
                  className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] bg-[linear-gradient(135deg,#14748b_0%,#1d8aa3_100%)] px-6 py-3.5 font-bold text-white shadow-[0_16px_34px_rgba(20,116,139,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(20,116,139,0.26)]"
                >
                  <Heart className="h-4 w-4" />
                  Find support
                </Link>
              </div>
            </div>

            <div className="student-surface p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Recent entries</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary-text">Your latest check-ins</h2>
                  <p className="mt-2 text-sm leading-7 text-secondary-text">Edit an entry, remove it, or skim past notes without digging through clutter.</p>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-secondary-text">
                  {logs.length} saved
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Filter entries</p>
                  <p className="mt-1 text-sm text-secondary-text">Choose a mood or shortcut filter.</p>
                </div>
                <div className="w-full sm:w-[18rem]">
                  <select
                    value={entryFilter}
                    onChange={(event) => setEntryFilter(event.target.value)}
                    className="student-field py-3"
                  >
                    {['All', 'Needs support', 'With notes', ...moodOptions.map((mood) => mood.label)].map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-secondary-text">
                  Showing <span className="font-semibold text-primary-text">{filteredLogs.length}</span> of <span className="font-semibold text-primary-text">{logs.length}</span> entries
                </p>
                {entryFilter !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setEntryFilter('All')}
                    className="text-sm font-semibold text-accent-primary hover:text-[#105f72]"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              <div className="mt-4 max-h-[42rem] overflow-y-auto pr-2 space-y-4">
                {loading && (
                  <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-8 text-center text-secondary-text">
                    Loading recent mood entries...
                  </div>
                )}
                {filteredLogs.map((entry) => {
                  const mood = getMoodOption(entry.mood);
                  const Icon = mood.icon;

                  return (
                    <div
                      key={entry._id}
                      className={`rounded-[1.65rem] border p-5 shadow-[0_12px_26px_rgba(15,41,66,0.05)] transition-all ${
                        editingEntryId === entry._id
                          ? 'border-cyan-200 bg-cyan-50/70 shadow-[0_16px_32px_rgba(20,116,139,0.10)]'
                          : 'border-white/80 bg-white/78'
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white ${mood.badge} ${mood.tone}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="font-semibold text-primary-text">{entry.mood}</p>
                                <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700">
                                  {entry.moodScore || 5}/10 intensity
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secondary-text">
                                <CalendarDays className="h-3.5 w-3.5" />
                                <span>{formatDateTime(entry.date)}</span>
                              </div>
                            </div>
                          </div>

                          {entry.notes ? (
                            <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-7 text-secondary-text">{entry.notes}</p>
                          ) : (
                            <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-400">No note added for this check-in.</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 self-start min-w-[5.5rem]">
                          <button
                            type="button"
                            onClick={() => startEdit(entry)}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-secondary-text transition-colors hover:bg-slate-200 hover:text-primary-text"
                            aria-label="Edit mood entry"
                          >
                            <Pencil className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry._id)}
                            disabled={deletingId === entry._id}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
                            aria-label="Delete mood entry"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!loading && !filteredLogs.length && (
                  <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-[0_10px_22px_rgba(15,41,66,0.05)]">
                      <Activity className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-primary-text">
                      {logs.length ? 'No entries match this filter' : 'No mood entries yet'}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-secondary-text">
                      {logs.length
                        ? 'Try another filter or clear the current one to see more of your timeline.'
                        : 'Start with a quick check-in on the left and your recent timeline will appear here.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
