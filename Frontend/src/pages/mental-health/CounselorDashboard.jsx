import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Video } from 'lucide-react';
import { getCachedCounselorDashboard, getCounselorDashboard } from '../../lib/counseling';

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-white rounded-[32px] border border-[#F0F0F3] p-8 animate-pulse">
            <div className="w-10 h-10 rounded-2xl bg-[#F4F4F8]" />
            <div className="w-24 h-3 rounded-full bg-[#F4F4F8] mt-5" />
            <div className="w-16 h-8 rounded-full bg-[#F4F4F8] mt-4" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-[#F0F0F3] p-8 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="w-52 h-7 rounded-full bg-[#F4F4F8]" />
          <div className="w-24 h-4 rounded-full bg-[#F4F4F8]" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-3xl bg-[#F4F4F8] p-5">
              <div className="w-40 h-5 rounded-full bg-white/70" />
              <div className="w-52 h-4 rounded-full bg-white/70 mt-3" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function CounselorDashboard() {
  const [dashboard, setDashboard] = useState(() => getCachedCounselorDashboard());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => !getCachedCounselorDashboard());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getCounselorDashboard();
        if (!active) return;
        setDashboard(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load counselor dashboard');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = dashboard?.stats || {};
  const upcomingSessions = dashboard?.upcomingSessions || [];

  return (
    <div className="bg-[#FCFCFC] pb-20">
      <div className="bg-white border-b border-[#F0F0F3] pt-8 pb-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-[#18181B] tracking-tight">Counselor Dashboard</h1>
            <p className="text-[#71717A] mt-2 text-lg">Guide students through upcoming sessions, notes, and assigned wellness resources.</p>
          </div>
          <div className="flex gap-4">
            <Link to="/counselor/sessions" className="px-6 py-3 bg-[#2563EB] text-white rounded-full font-bold">Open Sessions</Link>
            <Link to="/counselor/profile" className="px-6 py-3 bg-white border border-[#F0F0F3] text-[#18181B] rounded-full font-bold">Profile Settings</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 space-y-8">
        {loading && !dashboard && !error ? (
          <DashboardSkeleton />
        ) : (
          <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
          {[
            { label: 'Upcoming Sessions', value: upcomingSessions.length, icon: Video },
            { label: 'Active Students', value: stats.activeStudents || 0, icon: Users },
            { label: 'Pending Notes', value: stats.pendingNotes || 0, icon: FileText },
            { label: 'Assigned Resources', value: stats.assignedResources || 0, icon: FileText },
            { label: 'Follow-Ups', value: stats.pendingFollowUps || 0, icon: FileText }
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-[32px] border border-[#F0F0F3] p-8">
              <item.icon className="w-6 h-6 text-purple-600 mb-5" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-bold">{item.label}</p>
              <p className="text-3xl font-bold text-[#18181B] mt-3">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[32px] border border-[#F0F0F3] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#18181B]">Upcoming sessions</h2>
            <Link to="/counselor/sessions" className="text-sm font-semibold text-[#2563EB]">Manage all</Link>
          </div>
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <Link key={session._id} to={`/counselor/sessions/${session._id}`} className="block rounded-3xl bg-[#F4F4F8] p-5">
                <p className="font-bold text-[#18181B]">{session.studentName}</p>
                <p className="text-sm text-[#71717A] mt-1">{new Date(session.date).toLocaleDateString()} • {session.time} • {session.type}</p>
              </Link>
            ))}
            {!upcomingSessions.length && <p className="text-[#71717A]">No counseling sessions are booked yet.</p>}
          </div>
        </div>
          </>
        )}

        {loading && dashboard && <p className="text-[#71717A]">Refreshing counselor dashboard...</p>}
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
  );
}
