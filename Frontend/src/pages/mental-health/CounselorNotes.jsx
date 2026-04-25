import { useEffect, useMemo, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import DismissibleBanner from '../../components/DismissibleBanner';
import {
  getCachedCounselorNotes,
  getCounselorNotes,
  subscribeCounselorDashboardRefresh
} from '../../lib/counseling';
import { cn } from '../../lib/utils';

function formatDateValue(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeTimeTo24Hour(value) {
  const rawValue = `${value || ''}`.trim();
  if (!rawValue) return '';
  if (/^\d{2}:\d{2}$/.test(rawValue)) return rawValue;

  const match = rawValue.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!match) return '';

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'AM') {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }

  return `${`${hours}`.padStart(2, '0')}:${minutes}`;
}

export default function CounselorNotes() {
  const [notes, setNotes] = useState(() => getCachedCounselorNotes());
  const [error, setError] = useState('');
  const [studentNameFilter, setStudentNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');

  useEffect(() => {
    let active = true;

    const loadNotes = async (options = {}) => {
      try {
        const data = await getCounselorNotes();
        if (!active) return;
        setNotes(Array.isArray(data?.notes) ? data.notes : []);
        if (!options.suppressError) {
          setError('');
        }
      } catch (err) {
        if (!active) return;
        if (!options.suppressError) {
          setError(err.message || 'Failed to load counselor notes');
        }
      }
    };

    const initialLoadTimer = window.setTimeout(() => {
      if (!active) return;
      loadNotes();
    }, 0);

    const intervalId = window.setInterval(() => {
      loadNotes({ suppressError: true });
    }, 15000);

    const handleFocus = () => {
      loadNotes({ suppressError: true });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadNotes({ suppressError: true });
      }
    };

    const unsubscribe = subscribeCounselorDashboardRefresh(() => {
      loadNotes({ suppressError: true });
    });

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      window.clearTimeout(initialLoadTimer);
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribe();
    };
  }, []);

  const filterErrors = useMemo(() => {
    const nextErrors = {};
    const trimmedStudentName = studentNameFilter.trim();
    const availableDates = new Set(notes.map((entry) => formatDateValue(entry.date)).filter(Boolean));
    const availableTimes = new Set(notes.map((entry) => normalizeTimeTo24Hour(entry.time)).filter(Boolean));

    if (trimmedStudentName && !/^[a-zA-Z\s.'-]+$/.test(trimmedStudentName)) {
      nextErrors.studentName = 'Student name can only include letters, spaces, apostrophes, periods, and hyphens.';
    } else if (trimmedStudentName && trimmedStudentName.length < 2) {
      nextErrors.studentName = 'Enter at least 2 letters to filter by student name.';
    } else if (trimmedStudentName.length > 80) {
      nextErrors.studentName = 'Student name filter must be 80 characters or fewer.';
    }

    if (dateFilter && !/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
      nextErrors.date = 'Enter a valid date.';
    } else if (dateFilter) {
      const parsedDate = new Date(`${dateFilter}T00:00:00`);
      if (Number.isNaN(parsedDate.getTime())) {
        nextErrors.date = 'Enter a valid date.';
      } else if (!availableDates.has(dateFilter)) {
        nextErrors.date = 'No saved notes exist for that date.';
      }
    }

    if (timeFilter && !/^\d{2}:\d{2}$/.test(timeFilter)) {
      nextErrors.time = 'Enter a valid time.';
    } else if (timeFilter) {
      const [hours, minutes] = timeFilter.split(':').map((value) => parseInt(value, 10));
      if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
        nextErrors.time = 'Enter a valid time.';
      } else if (!availableTimes.has(timeFilter)) {
        nextErrors.time = 'No saved notes exist for that time.';
      }
    }

    return nextErrors;
  }, [dateFilter, notes, studentNameFilter, timeFilter]);

  const filteredNotes = useMemo(() => {
    const normalizedStudentName = studentNameFilter.trim().toLowerCase();

    return notes.filter((entry) => {
      const matchesStudentName = !normalizedStudentName
        || entry.studentName?.toLowerCase().includes(normalizedStudentName);
      const matchesDate = !dateFilter || formatDateValue(entry.date) === dateFilter;
      const matchesTime = !timeFilter || normalizeTimeTo24Hour(entry.time) === timeFilter;

      return matchesStudentName && matchesDate && matchesTime;
    });
  }, [dateFilter, notes, studentNameFilter, timeFilter]);

  return (
    <div className="pharmacy-shell min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-8 pt-4 space-y-6">
        <section className="pharmacy-hero">
          <span className="pharmacy-pill bg-emerald-50 text-emerald-700">Counselor Notes</span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-primary-text">Private notes and student-facing summaries.</h1>
        </section>

        <DismissibleBanner
          message={error}
          tone="error"
          onClose={() => setError('')}
          autoHideMs={0}
        />

        <section className="pharmacy-panel overflow-hidden p-0">
          <div className="border-b border-white/70 px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <label className="space-y-2 xl:min-w-0 xl:flex-[1.4]">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Student name</span>
                <span className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-text" />
                  <input
                    type="text"
                    value={studentNameFilter}
                    onChange={(event) => setStudentNameFilter(event.target.value)}
                    className={cn('student-field pl-11', filterErrors.studentName && 'border-red-200 text-red-700 focus:border-red-300 focus:ring-red-100')}
                    placeholder="Filter by student name"
                  />
                </span>
                <span className="block min-h-[1.25rem] text-xs text-red-600">
                  {filterErrors.studentName || ''}
                </span>
              </label>

              <label className="space-y-2 xl:w-[220px] xl:shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Date</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className={cn('student-field', filterErrors.date && 'border-red-200 text-red-700 focus:border-red-300 focus:ring-red-100')}
                />
                <span className="block min-h-[1.25rem] text-xs text-red-600">
                  {filterErrors.date || ''}
                </span>
              </label>

              <label className="space-y-2 xl:w-[220px] xl:shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Time</span>
                <input
                  type="time"
                  value={timeFilter}
                  onChange={(event) => setTimeFilter(event.target.value)}
                  className={cn('student-field', filterErrors.time && 'border-red-200 text-red-700 focus:border-red-300 focus:ring-red-100')}
                />
                <span className="block min-h-[1.25rem] text-xs text-red-600">
                  {filterErrors.time || ''}
                </span>
              </label>
            </div>

            <p className="mt-4 text-sm text-secondary-text">
              Showing {filteredNotes.length} of {notes.length} note{notes.length === 1 ? '' : 's'}.
            </p>
          </div>
        </section>

        <section className="pharmacy-panel overflow-hidden p-0">
          <div className="border-b border-white/70 px-7 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Saved session notes</p>
            <p className="mt-3 text-secondary-text">
              Review counselor-only notes and the student-facing summary from completed counseling sessions.
            </p>
          </div>

          {!notes.length ? (
            <div className="p-8 text-secondary-text">Saved notes will appear here once sessions are documented.</div>
          ) : !filteredNotes.length ? (
            <div className="p-8 text-secondary-text">No counselor notes match the current filters.</div>
          ) : (
            <div className="h-[36rem] overflow-y-auto overscroll-contain rounded-[2rem] pr-2">
              {filteredNotes.map((entry, index) => (
                <article key={entry.sessionId} className={index === 0 ? 'px-7 py-7' : 'border-t border-white/70 px-7 py-7'}>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-accent-primary" />
                    <div>
                      <h2 className="text-2xl font-semibold text-primary-text">{entry.studentName}</h2>
                      <p className="text-secondary-text">{new Date(entry.date).toLocaleDateString()} • {entry.time} • {entry.status}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-secondary-bg/80 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Private notes</p>
                      <p className="mt-3 text-sm leading-6 text-secondary-text">{entry.confidentialNotes || 'No private notes saved.'}</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-emerald-50/80 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">Student-visible summary</p>
                      <p className="mt-3 text-sm leading-6 text-secondary-text">{entry.sharedSummary || 'No summary shared yet.'}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
