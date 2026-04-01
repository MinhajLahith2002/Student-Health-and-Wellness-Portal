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
    <div className="pt-36 pb-14 px-6 max-w-7xl mx-auto min-h-screen bg-primary-bg">
      <header className="mb-12 flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-widest mb-5">
            <Heart className="w-3 h-3 fill-current" />
            Student Health Overview
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-primary-text">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-lg text-secondary-text mt-3 max-w-2xl">
            Keep your medical appointments, counseling sessions, prescriptions, and wellness activity in one place.
          </p>
        </div>
        <div className="apple-card p-6 border-none bg-gradient-to-br from-accent-primary to-indigo-700 text-white w-full lg:max-w-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Mood Snapshot</p>
          <p className="text-4xl font-semibold mt-3">{dashboard?.moodTrends?.averageMood || '0.0'}</p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="apple-card p-5 border-none bg-white/70 backdrop-blur-sm hover:-translate-y-1 transition-transform"
            >
              <action.icon className="w-6 h-6 text-accent-primary mb-4" />
              <p className="font-semibold text-primary-text text-sm">{action.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-primary-text">Upcoming medical care</h2>
            <Link to="/student/appointments" className="text-sm font-semibold text-accent-primary">
              View all
            </Link>
          </div>
          <div className="space-y-4">
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
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-secondary-bg/70 hover:bg-secondary-bg transition-colors"
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

        <section className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-primary-text">Counseling & wellness</h2>
            <Link to="/mental-health/sessions" className="text-sm font-semibold text-accent-primary">
              View all
            </Link>
          </div>
          <div className="space-y-4 mb-8">
            {upcomingCounselingSessions.length === 0 ? (
              <p className="text-secondary-text">No counseling sessions booked yet.</p>
            ) : (
              upcomingCounselingSessions.map((session) => (
                <Link
                  key={session._id}
                  to={`/mental-health/sessions/${session._id}`}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-secondary-bg/70 hover:bg-secondary-bg transition-colors"
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

          <div className="rounded-3xl bg-accent-purple/10 p-6">
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
  );
}
