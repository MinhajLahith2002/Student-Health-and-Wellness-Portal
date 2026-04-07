import { Link } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CalendarClock,
  ChevronRight,
  CircleHelp,
  FileText,
  MessageSquareMore,
  Settings2,
  Video
} from 'lucide-react';

const quickLinks = [
  {
    title: 'My Dashboard',
    description: 'Return to the counselor overview for today’s workload, trends, and upcoming sessions.',
    to: '/counselor/dashboard',
    icon: CalendarClock
  },
  {
    title: 'Profile Settings',
    description: 'Update the public counselor profile students see before choosing your open slots.',
    to: '/counselor/profile-settings',
    icon: Settings2
  },
  {
    title: 'Counselor Scheduling',
    description: 'Manage open slots, booked sessions, and status changes from one workspace.',
    to: '/counselor/sessions',
    icon: CalendarClock
  },
  {
    title: 'Notifications',
    description: 'Review new counseling updates, booking changes, and follow-up alerts.',
    to: '/counselor/notifications',
    icon: Bell
  }
];

const helpSections = [
  {
    title: 'Session types',
    icon: Video,
    points: [
      'Video Call sessions use the Jitsi room provided on the individual session page for both counselor and student.',
      'Chat sessions use the built-in live counseling chat panel so both sides can exchange messages in real time.',
      'In-Person sessions keep the session detail page focused on location, live status, and in-campus follow-up.'
    ]
  },
  {
    title: 'Session status flow',
    icon: CircleHelp,
    points: [
      'Use Confirmed when the session is scheduled and ready.',
      'Move the session to In Progress once the actual counseling interaction starts.',
      'Completed is for finished sessions with valid student-visible outcome data behind them.',
      'Cancelled closes the session and locks the active counseling workflow.'
    ]
  },
  {
    title: 'Notes and follow-up',
    icon: FileText,
    points: [
      'Student-visible summary is the key completion field and should clearly capture the outcome of the session.',
      'Private notes, action plans, resource notes, and assigned resources can be added to support follow-up care.',
      'If you recommend a follow-up session, the follow-up date becomes required.'
    ]
  },
  {
    title: 'Resources and communication',
    icon: MessageSquareMore,
    points: [
      'Published counselor resources appear in the shared student-facing mental-health library.',
      'Draft resources remain counselor-only until published.',
      'Notifications, booked session status, and counselor dashboard updates refresh automatically without a manual reload.'
    ]
  }
];

export default function CounselorHelpCenter() {
  return (
    <div className="pharmacy-shell min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-8 pt-4 space-y-8">
        <section className="pharmacy-hero">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
            <div className="max-w-4xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700">
                <BookOpen className="h-3.5 w-3.5" />
                Counselor Help Center
              </span>
              <h1 className="mt-5 text-5xl font-semibold tracking-tight text-primary-text">
                Stay oriented while managing counselor sessions, notes, and follow-up care.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-secondary-text">
                This guide keeps the counselor workflow easy to understand, from scheduling and session status updates to
                notes, resources, notifications, and student-facing follow-up.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(15,41,66,0.10)] backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">Quick access</p>
              <div className="mt-5 space-y-3">
                {quickLinks.slice(0, 3).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold">{item.title}</span>
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="pharmacy-panel flex items-start gap-4 p-6 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/50"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-primary-text">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-secondary-text">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="pharmacy-panel p-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">Workflow guide</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-primary-text">
              What each counselor tool is meant to do.
            </h2>
            <p className="mt-3 text-secondary-text">
              These sections are written as a static, counselor-facing reference so you can quickly understand what belongs
              in scheduling, what belongs in notes, and what the student sees on the other side.
            </p>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {helpSections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="rounded-[1.75rem] border border-slate-100 bg-slate-50/80 p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-xl font-semibold text-primary-text">{section.title}</h3>
                  </div>
                  <div className="mt-5 space-y-3">
                    {section.points.map((point) => (
                      <div key={point} className="flex items-start gap-3 text-sm leading-6 text-secondary-text">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                        <p>{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
