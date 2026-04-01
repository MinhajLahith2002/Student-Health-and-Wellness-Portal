import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, PhoneCall, Pencil, ShieldAlert, Trash2 } from 'lucide-react';
import { createMoodLog, deleteMoodLog, getMoodLogs, getMoodStats, updateMoodLog } from '../../lib/mentalHealth';

const moods = [
  { label: 'Great', score: 8, emoji: '😄' },
  { label: 'Okay', score: 6, emoji: '🙂' },
  { label: 'Down', score: 4, emoji: '😔' },
  { label: 'Stressed', score: 3, emoji: '😣' },
  { label: 'Tired', score: 5, emoji: '😴' },
  { label: 'Anxious', score: 3, emoji: '😟' }
];

function getInitialForm() {
  return {
    id: '',
    mood: 'Okay',
    moodScore: 6,
    notes: ''
  };
}

const ALERT_MOODS = new Set(['Down', 'Stressed', 'Anxious']);

export default function MoodTracker() {
  const [form, setForm] = useState(getInitialForm());
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  async function loadData() {
    try {
      const [history, summary] = await Promise.all([getMoodLogs({ limit: 12 }), getMoodStats()]);
      setLogs(Array.isArray(history) ? history : []);
      setStats(summary);
    } catch (err) {
      setError(err.message || 'Failed to load mood tracker');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const progressWidth = useMemo(() => {
    const average = Number(stats?.averageMood || 0);
    return `${Math.max(5, Math.min(100, average * 10))}%`;
  }, [stats]);

  const supportLevel = useMemo(() => {
    if (!ALERT_MOODS.has(form.mood)) return 'none';
    if (Number(form.moodScore) >= 8) return 'urgent';
    if (Number(form.moodScore) >= 7) return 'high';
    return 'none';
  }, [form.mood, form.moodScore]);

  const showSupportAlert = useMemo(() => supportLevel !== 'none', [supportLevel]);

  function startEdit(entry) {
    setForm({
      id: entry._id,
      mood: entry.mood,
      moodScore: entry.moodScore || 5,
      notes: entry.notes || ''
    });
    setStatus('Editing an existing mood log.');
    setError('');
  }

  function resetForm() {
    setForm(getInitialForm());
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
        await updateMoodLog(form.id, payload);
        setStatus('Mood entry updated.');
      } else {
        await createMoodLog(payload);
        setStatus('Mood entry saved.');
      }

      resetForm();
      await loadData();
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
      if (form.id === id) {
        resetForm();
      }
      setStatus('Mood entry deleted.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete mood entry');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <div className="pt-36 pb-12 px-6 max-w-6xl mx-auto min-h-screen bg-primary-bg">
      <div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-8">
        <section className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm h-fit">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-accent-purple" />
            <h1 className="text-3xl font-semibold text-primary-text">Mood Tracker</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, mood: mood.label, moodScore: current.id ? current.moodScore : mood.score }))}
                  className={`px-4 py-4 rounded-2xl font-semibold ${form.mood === mood.label ? 'bg-accent-purple text-white' : 'bg-secondary-bg text-primary-text'}`}
                >
                  <span className="mr-2">{mood.emoji}</span>
                  {mood.label}
                </button>
              ))}
            </div>

            <div className="rounded-2xl bg-secondary-bg/70 px-5 py-4">
              <label className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold block mb-3">Mood intensity</label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.moodScore}
                onChange={(event) => setForm((current) => ({ ...current, moodScore: Number(event.target.value) }))}
                className="w-full"
              />
              <p className="text-sm text-secondary-text mt-2">Current intensity: {form.moodScore}/10</p>
              {ALERT_MOODS.has(form.mood) && (
                <p className="text-xs text-amber-700 mt-2">
                  Support guidance appears for {form.mood.toLowerCase()} moods at 7/10 or higher.
                </p>
              )}
            </div>

            {showSupportAlert && (
              <div className={`rounded-2xl px-5 py-4 ${
                supportLevel === 'urgent'
                  ? 'border border-rose-200 bg-rose-50'
                  : 'border border-amber-200 bg-amber-50'
              }`}>
                <div className="flex items-start gap-3">
                  <ShieldAlert className={`w-5 h-5 mt-0.5 ${supportLevel === 'urgent' ? 'text-rose-600' : 'text-amber-600'}`} />
                  <div className="space-y-3">
                    <div>
                      <p className={`font-semibold ${supportLevel === 'urgent' ? 'text-rose-900' : 'text-amber-900'}`}>
                        {supportLevel === 'urgent' ? 'Urgent support check-in detected' : 'High-intensity check-in detected'}
                      </p>
                      <p className={`text-sm mt-1 ${supportLevel === 'urgent' ? 'text-rose-800' : 'text-amber-800'}`}>
                        {supportLevel === 'urgent'
                          ? 'Your current mood looks very intense. Please check counseling now, and call emergency support immediately if you feel unsafe.'
                          : 'Your mood is trending high right now. Please consider checking counseling support before it gets heavier.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        to="/mental-health/counselors"
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent-purple text-white font-bold"
                      >
                        Check Counseling
                      </Link>
                      <a
                        href="tel:1990"
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-600 text-white font-bold shadow-sm"
                      >
                        <PhoneCall className="w-4 h-4" />
                        Emergency Call 1990
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <textarea
              rows={5}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none resize-none"
              placeholder="Optional journal entry or note about today."
            />

            {error && <p className="text-sm text-red-600">{error}</p>}
            {status && <p className="text-sm text-emerald-600">{status}</p>}

            <div className="flex gap-3">
              {form.id && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setStatus('');
                    setError('');
                  }}
                  className="flex-1 py-4 bg-secondary-bg text-primary-text rounded-2xl font-bold"
                >
                  Cancel Edit
                </button>
              )}
              <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-accent-purple text-white rounded-2xl font-bold disabled:opacity-50">
                {submitting ? 'Saving...' : form.id ? 'Update Mood Entry' : 'Save Mood Entry'}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="apple-card p-6 border-none bg-white/70 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Average mood</p>
              <p className="text-3xl font-semibold text-primary-text mt-3">{stats?.averageMood?.toFixed ? stats.averageMood.toFixed(1) : stats?.averageMood || '0.0'}</p>
            </div>
            <div className="apple-card p-6 border-none bg-white/70 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Entries</p>
              <p className="text-3xl font-semibold text-primary-text mt-3">{stats?.totalLogs || 0}</p>
            </div>
            <div className="apple-card p-6 border-none bg-white/70 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Most common</p>
              <p className="text-3xl font-semibold text-primary-text mt-3">{Object.keys(stats?.moodDistribution || {})[0] || 'N/A'}</p>
            </div>
          </div>

          <div className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-primary-text">Progress snapshot</h2>
                <p className="text-sm text-secondary-text mt-2">A lightweight trend view based on your recent mood intensity average.</p>
              </div>
              <span className="text-sm font-semibold text-accent-primary">{Number(stats?.averageMood || 0).toFixed(1)}/10</span>
            </div>
            <div className="h-4 rounded-full bg-secondary-bg overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-accent-purple to-emerald-500" style={{ width: progressWidth }} />
            </div>
          </div>

          <div className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-primary-text mb-6">Recent entries</h2>
            <div className="space-y-4">
              {logs.map((entry) => (
                <div key={entry._id} className="rounded-2xl bg-secondary-bg/70 px-5 py-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-primary-text">{entry.mood}</p>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-purple">
                          {entry.moodScore || 5}/10
                        </span>
                      </div>
                      <p className="text-xs text-secondary-text mt-1">
                        {new Date(entry.date).toLocaleDateString()} • {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {entry.notes && <p className="text-sm text-secondary-text mt-2">{entry.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEdit(entry)} className="p-2 rounded-xl bg-white text-secondary-text">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry._id)}
                        disabled={deletingId === entry._id}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!logs.length && <p className="text-secondary-text">No mood entries yet. Start with a quick check-in on the left.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
