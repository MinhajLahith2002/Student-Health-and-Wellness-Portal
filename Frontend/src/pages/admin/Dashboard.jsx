import React from 'react';
import { 
  Users, 
  Calendar, 
  ShoppingBag, 
  MessageSquare, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import AdminLayout from '../../components/admin/AdminLayout';
import { cn } from '../../lib/utils';

const MOCK_STATS = [
  { label: "Total Users", value: "12,482", trend: "+12.5%", isUp: true, icon: Users, color: "blue" },
  { label: "Appointments Today", value: "142", trend: "+8.2%", isUp: true, icon: Calendar, color: "emerald" },
  { label: "Pending Orders", value: "28", trend: "-2.4%", isUp: false, icon: ShoppingBag, color: "amber" },
  { label: "New Messages", value: "45", trend: "+15.3%", isUp: true, icon: MessageSquare, color: "indigo" },
  { label: "Active Sessions", value: "1,204", trend: "+5.1%", isUp: true, icon: Activity, color: "rose" },
];

const APPOINTMENT_DATA = [
  { name: 'Mon', appointments: 45 },
  { name: 'Tue', appointments: 52 },
  { name: 'Wed', appointments: 48 },
  { name: 'Thu', appointments: 61 },
  { name: 'Fri', appointments: 55 },
  { name: 'Sat', appointments: 42 },
  { name: 'Sun', appointments: 38 },
];

const USER_SIGNUP_DATA = [
  { name: 'Jan', students: 400, doctors: 240 },
  { name: 'Feb', students: 300, doctors: 139 },
  { name: 'Mar', students: 200, doctors: 980 },
  { name: 'Apr', students: 278, doctors: 390 },
  { name: 'May', students: 189, doctors: 480 },
  { name: 'Jun', students: 239, doctors: 380 },
  { name: 'Jul', students: 349, doctors: 430 },
];

const REVENUE_DATA = [
  { name: 'Week 1', revenue: 4000 },
  { name: 'Week 2', revenue: 3000 },
  { name: 'Week 3', revenue: 2000 },
  { name: 'Week 4', revenue: 2780 },
];

const RECENT_ACTIVITY = [
  { id: 1, user: "Dr. Sarah Smith", action: "joined the platform", time: "2 minutes ago", type: "user" },
  { id: 2, user: "Order #8294", action: "has been shipped", time: "15 minutes ago", type: "order" },
  { id: 3, user: "Mental Health Workshop", action: "created by Admin", time: "1 hour ago", type: "event" },
  { id: 4, user: "John Doe", action: "submitted feedback", time: "2 hours ago", type: "feedback" },
  { id: 5, user: "Server Backup", action: "completed successfully", time: "5 hours ago", type: "system" },
];

const ALERTS = [
  { id: 1, title: "Low Stock: Paracetamol", level: "warning", time: "10m ago" },
  { id: 2, title: "Server Load High (85%)", level: "error", time: "25m ago" },
  { id: 3, title: "New Counselor Application", level: "info", time: "1h ago" },
];

const StatCard = ({ stat, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
        stat.color === 'blue' ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" :
        stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" :
        stat.color === 'amber' ? "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white" :
        stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white" :
        "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white"
      )}>
        <stat.icon className="w-6 h-6" />
      </div>
      <div className={cn(
        "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
        stat.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      )}>
        {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {stat.trend}
      </div>
    </div>
    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
    <h3 className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</h3>
  </motion.div>
);

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Super Dashboard</h1>
            <p className="text-slate-500 mt-2 text-lg">Welcome back, Admin. Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white border border-slate-100 rounded-xl flex items-center gap-2 shadow-sm">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-600">Last updated: Just now</span>
            </div>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {MOCK_STATS.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Platform Growth</h3>
                <p className="text-sm text-slate-500 mt-1">User signups over the last 7 months</p>
              </div>
              <select className="px-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-600/20">
                <option>Last 7 months</option>
                <option>Last 12 months</option>
                <option>All time</option>
              </select>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={USER_SIGNUP_DATA}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="students" 
                    stroke="#2563EB" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorStudents)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Chart */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Appointments</h3>
                <p className="text-sm text-slate-500 mt-1">Daily trend this week</p>
              </div>
              <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={APPOINTMENT_DATA}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="appointments" 
                    fill="#2563EB" 
                    radius={[6, 6, 0, 0]} 
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Section: Activity & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
              <button className="text-sm font-bold text-blue-600 hover:underline">View All</button>
            </div>
            <div className="divide-y divide-slate-50">
              {RECENT_ACTIVITY.map((activity) => (
                <div key={activity.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      activity.type === 'user' ? "bg-blue-50 text-blue-600" :
                      activity.type === 'order' ? "bg-emerald-50 text-emerald-600" :
                      activity.type === 'event' ? "bg-indigo-50 text-indigo-600" :
                      "bg-slate-50 text-slate-600"
                    )}>
                      {activity.type === 'user' ? <Users className="w-5 h-5" /> :
                       activity.type === 'order' ? <ShoppingBag className="w-5 h-5" /> :
                       activity.type === 'event' ? <Calendar className="w-5 h-5" /> :
                       <Activity className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        <span className="text-blue-600">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Critical Alerts</h3>
              <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full uppercase tracking-widest">
                {ALERTS.length} Active
              </span>
            </div>
            <div className="p-6 space-y-4">
              {ALERTS.map((alert) => (
                <div key={alert.id} className={cn(
                  "p-4 rounded-xl border flex items-start gap-3",
                  alert.level === 'error' ? "bg-rose-50 border-rose-100" :
                  alert.level === 'warning' ? "bg-amber-50 border-amber-100" :
                  "bg-blue-50 border-blue-100"
                )}>
                  <AlertCircle className={cn(
                    "w-5 h-5 shrink-0 mt-0.5",
                    alert.level === 'error' ? "text-rose-600" :
                    alert.level === 'warning' ? "text-amber-600" :
                    "text-blue-600"
                  )} />
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-bold",
                      alert.level === 'error' ? "text-rose-900" :
                      alert.level === 'warning' ? "text-amber-900" :
                      "text-blue-900"
                    )}>
                      {alert.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{alert.time}</p>
                  </div>
                </div>
              ))}
              <button className="w-full py-4 mt-4 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">
                View All Alerts
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;