import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Heart, Library, MessageCircleHeart, Pill, Smile, Stethoscope, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { canOpenVideoVisit, getStudentDashboard } from '../lib/appointments';
import { getSavedResources } from '../lib/mentalHealth';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

function formatDateLabel(value, time) {
  const date = new Date(value);
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}${time ? ` at ${time}` : ''}`;
}

function SummaryCard({ label, value, hint, icon, tone }) {
  const Icon = icon;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="apple-card p-7 border-none bg-white/70 backdrop-blur-sm"
    >
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-5', tone)}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">{label}</p>
      <p className="text-3xl font-semibold text-primary-text mt-2">{value}</p>
      <p className="text-sm text-secondary-text mt-3">{hint}</p>
    </motion.div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getStudentDashboard();
        if (!active) return;
        setDashboard(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load student dashboard');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const quickActions = [
    { label: 'Find Doctor', path: '/student/appointments/find', icon: Stethoscope },
    { label: 'My Appointments', path: '/student/appointments', icon: Calendar },
    { label: 'Explore Counselors', path: '/mental-health/counselors', icon: MessageCircleHeart },
    { label: 'Log Mood', path: '/mental-health/mood', icon: Smile },
    { label: 'My Sessions', path: '/mental-health/sessions', icon: Video },
    { label: 'Resources', path: '/mental-health/resources', icon: Library }
  ];

  const savedResources = useMemo(() => getSavedResources(), []);
  const upcomingAppointments = dashboard?.upcomingAppointments || [];
  const upcomingCounselingSessions = dashboard?.upcomingCounselingSessions || [];
  const recentPrescriptions = dashboard?.recentPrescriptions || [];

  return (
    <div className="student-shell pt-28 sm:pt-36 pb-12 sm:pb-14">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
      <header className="student-hero mb-10 sm:mb-12 px-5 py-6 sm:px-8 sm:py-10 md:px-10 md:py-12 flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <div className="student-chip bg-cyan-100 text-cyan-700 mb-5">
            <Heart className="w-3 h-3 fill-current" />
            Student Health Overview
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-primary-text">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-base sm:text-lg text-secondary-text mt-3 max-w-2xl">
            Keep your medical appointments, counseling sessions, prescriptions, and wellness activity in one place.
          </p>
        </div>
        <div className="rounded-[1.75rem] p-5 sm:p-6 border border-cyan-200/50 bg-[linear-gradient(135deg,#0f2942_0%,#134b63_55%,#14748b_100%)] text-white w-full lg:max-w-sm shadow-[0_24px_60px_rgba(15,41,66,0.18)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Mood Snapshot</p>
          <p className="text-3xl sm:text-4xl font-semibold mt-3">{dashboard?.moodTrends?.averageMood || '0.0'}</p>
          <p className="text-sm text-white/80 mt-3">Average mood score from the last 30 days.</p>
          <Link to="/mental-health/suggestions" className="inline-flex mt-6 text-sm font-semibold underline underline-offset-4">
            View personalized suggestions
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        <SummaryCard
          label="Upcoming Appointments"
          value={upcomingAppointments.length}
          hint="Medical visits already booked"
          icon={Calendar}
          tone="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          label="Counseling Sessions"
          value={upcomingCounselingSessions.length}
          hint="Confidential sessions on your calendar"
          icon={Video}
          tone="bg-purple-50 text-purple-600"
        />
        <SummaryCard
          label="Recent Prescriptions"
          value={recentPrescriptions.length}
          hint="Issued by campus clinicians"
          icon={Pill}
          tone="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          label="Saved Resources"
          value={savedResources.length}
          hint="Bookmarks from your wellness library"
          icon={Library}
          tone="bg-amber-50 text-amber-600"
        />
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-semibold text-primary-text">Quick actions</h2>
          <span className="text-sm text-secondary-text">Jump straight into your most common tasks</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="student-card p-5"
            >
              <action.icon className="w-6 h-6 text-accent-primary mb-4" />
              <p className="font-semibold text-primary-text text-sm">{action.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="student-surface flex max-h-[34rem] flex-col overflow-hidden p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl font-semibold text-primary-text">Upcoming medical care</h2>
            <Link to="/student/appointments" className="text-sm font-semibold text-accent-primary">
              View all
            </Link>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 [scrollbar-gutter:stable] sm:pr-2">
            {upcomingAppointments.length === 0 ? (
              <p className="text-secondary-text">No upcoming medical appointments yet.</p>
            ) : (
              upcomingAppointments.map((appointment) => (
                <Link
                  key={appointment._id}
                  to={appointment.type === 'Video Call' && canOpenVideoVisit(appointment)
                    ? `/student/consultation/${appointment._id}`
                    : appointment.type === 'Video Call'
                      ? '/student/appointments'
                      : `/student/appointments/${appointment._id}/queue`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-[1.4rem] bg-slate-50/85 hover:bg-slate-100/90 transition-colors border border-slate-100"
                >
                  <div>
                    <p className="font-semibold text-primary-text">{appointment.doctorName}</p>
                    <p className="text-sm text-secondary-text">
                      {appointment.doctorSpecialty} • {formatDateLabel(appointment.date, appointment.time)}
                    </p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">
                    {appointment.type}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="student-surface flex max-h-[34rem] flex-col overflow-hidden p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl font-semibold text-primary-text">Counseling & wellness</h2>
            <Link to="/mental-health/sessions" className="text-sm font-semibold text-accent-primary">
              View all
            </Link>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 [scrollbar-gutter:stable] sm:pr-2">
            {upcomingCounselingSessions.length === 0 ? (
              <p className="text-secondary-text">No counseling sessions booked yet.</p>
            ) : (
              upcomingCounselingSessions.map((session) => (
                <Link
                  key={session._id}
                  to={`/mental-health/sessions/${session._id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-[1.4rem] bg-slate-50/85 hover:bg-slate-100/90 transition-colors border border-slate-100"
                >
                  <div>
                    <p className="font-semibold text-primary-text">{session.counselorName}</p>
                    <p className="text-sm text-secondary-text">
                      {session.counselorSpecialty} • {formatDateLabel(session.date, session.time)}
                    </p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-purple">
                    {session.type}
                  </span>
                </Link>
              ))
            )}
          </div>

          <div className="student-muted-panel mt-8 shrink-0 p-6 bg-accent-purple/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-purple mb-2">Saved for later</p>
            <p className="text-primary-text font-semibold">{savedResources.length} bookmarked resources</p>
            <p className="text-sm text-secondary-text mt-2">
              Open your self-help library to continue reading, listening, or practicing.
            </p>
            <Link to="/mental-health/resources" className="inline-flex mt-4 text-sm font-semibold text-accent-purple">
              Open library
            </Link>
          </div>
        </section>
      </div>

      {loading && <p className="text-secondary-text mt-8">Loading your dashboard...</p>}
      {error && <p className="text-red-600 mt-8">{error}</p>}
      </div>
    </div>
  );
}
