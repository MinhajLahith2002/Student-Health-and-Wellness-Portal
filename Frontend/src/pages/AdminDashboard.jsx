import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart3, 
  Users, 
  Settings, 
  Bell, 
  Search,
  Download,
  Filter,
  ArrowUpRight,
  Shield,
  Activity,
  Calendar,
  Pill,
  MessageSquare,
  ChevronRight,
  MoreHorizontal,
  Mail,
  UserPlus,
  Lock,
  Globe,
  Database,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Jan', appointments: 400, users: 2400 },
  { name: 'Feb', appointments: 300, users: 1398 },
  { name: 'Mar', appointments: 600, users: 9800 },
  { name: 'Apr', appointments: 800, users: 3908 },
  { name: 'May', appointments: 500, users: 4800 },
  { name: 'Jun', appointments: 900, users: 3800 },
];

const COLORS = ['#5856D6', '#2ECC71', '#FF9F0A', '#AF7AC5'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  const menuItems = [
    { label: "Overview", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "User Directory", icon: <Users className="w-5 h-5" /> },
    { label: "Security Logs", icon: <Shield className="w-5 h-5" /> },
    { label: "Notifications", icon: <Bell className="w-5 h-5" /> },
    { label: "System Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex min-h-screen bg-primary-bg">
      {/* Sidebar */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-border-gray/10 hidden lg:flex flex-col fixed inset-y-0 z-50">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-16 group cursor-pointer">
            <div className="w-12 h-12 bg-accent-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-2xl shadow-accent-primary/30 group-hover:scale-110 transition-transform duration-500">C</div>
            <span className="font-semibold text-2xl tracking-tighter text-primary-text">CampusHealth</span>
          </div>
          
          <nav className="space-y-3">
            {menuItems.map((item, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                  activeTab === item.label ? 'bg-accent-primary text-white shadow-xl shadow-accent-primary/20' : 'text-secondary-text hover:bg-secondary-bg/50 hover:text-primary-text'
                }`}
              >
                {item.icon}
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-10 border-t border-border-gray/10">
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-secondary-bg/30 border border-border-gray/5">
            <div className="w-12 h-12 rounded-full bg-accent-primary flex items-center justify-center text-white font-bold text-lg shadow-inner">A</div>
            <div>
              <p className="font-bold text-sm text-primary-text tracking-tight">System Admin</p>
              <p className="text-[10px] text-secondary-text font-bold uppercase tracking-widest opacity-60">Super User</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-10 lg:p-20">
        <AnimatePresence mode="wait">
          {activeTab === "Overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-20">
                <div>
                  <h1 className="text-5xl md:text-6xl font-semibold mb-3 tracking-tighter text-primary-text text-balance">Unified Intelligence</h1>
                  <p className="text-xl text-secondary-text leading-relaxed text-balance">Centralized command for the entire platform.</p>
                </div>
                <div className="flex gap-4">
                  <div className="relative hidden md:block">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-text w-4 h-4" />
                    <input type="text" placeholder="Search metrics..." className="apple-input pl-12 py-3.5 text-sm w-72 border-none bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm" />
                  </div>
                  <button className="apple-button-secondary flex items-center gap-2 py-3.5 px-8 text-sm font-bold">
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
              </header>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                {[
                  { label: "Active Users", value: "12,432", trend: "+12.5%", icon: <Users />, color: "text-accent-primary", bg: "bg-accent-primary/10" },
                  { label: "Total Revenue", value: "$45,240", trend: "+8.2%", icon: <Activity />, color: "text-accent-green", bg: "bg-accent-green/10" },
                  { label: "Appointments", value: "1,240", trend: "+15.4%", icon: <Calendar />, color: "text-warning", bg: "bg-warning/10" },
                  { label: "Pharmacy Sales", value: "542", trend: "+2.1%", icon: <Pill />, color: "text-accent-purple", bg: "bg-accent-purple/10" },
                ].map((metric, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="apple-card p-10 border-none bg-white/60 backdrop-blur-sm shadow-xl"
                  >
                    <div className={`w-14 h-14 mb-8 flex items-center justify-center rounded-2xl ${metric.bg} ${metric.color} shadow-sm`}>
                      {metric.icon}
                    </div>
                    <p className="text-secondary-text text-[10px] font-bold uppercase tracking-widest mb-3">{metric.label}</p>
                    <div className="flex items-end gap-3">
                      <p className="text-5xl font-bold text-primary-text tracking-tighter">{metric.value}</p>
                      <span className="text-accent-green text-xs font-bold flex items-center mb-2">
                        {metric.trend} <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-20">
                <section className="lg:col-span-8 apple-card p-12 border-none bg-white/60 backdrop-blur-sm shadow-2xl">
                  <div className="flex justify-between items-center mb-12">
                    <div>
                      <h2 className="text-3xl font-semibold text-primary-text tracking-tight">User Growth</h2>
                      <p className="text-base text-secondary-text font-medium">New registrations over the last 6 months</p>
                    </div>
                    <select className="bg-secondary-bg/50 border-none rounded-2xl px-6 py-3 text-sm font-bold outline-none text-primary-text cursor-pointer hover:bg-secondary-bg transition-colors">
                      <option>Last 6 Months</option>
                      <option>Last Year</option>
                    </select>
                  </div>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5856D6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#5856D6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F3" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#86868B', fontSize: 12, fontWeight: 500}} dy={15} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#86868B', fontSize: 12, fontWeight: 500}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '20px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
                        />
                        <Area type="monotone" dataKey="users" stroke="#5856D6" strokeWidth={5} fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="lg:col-span-4 apple-card p-12 border-none bg-white/60 backdrop-blur-sm shadow-2xl">
                  <h2 className="text-3xl font-semibold text-primary-text mb-12 tracking-tight">Service Usage</h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Medical', value: 400 },
                            { name: 'Mental Health', value: 300 },
                            { name: 'Pharmacy', value: 300 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={10}
                          dataKey="value"
                        >
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-6 mt-12">
                    {[
                      { label: 'Medical Consultations', value: '40%', color: COLORS[0] },
                      { label: 'Mental Health Support', value: '30%', color: COLORS[1] },
                      { label: 'Pharmacy Orders', value: '30%', color: COLORS[2] },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-4 h-4 rounded-full shadow-sm" style={{backgroundColor: item.color}}></div>
                          <span className="text-sm font-bold text-secondary-text tracking-tight">{item.label}</span>
                        </div>
                        <span className="text-sm font-black text-primary-text">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Recent Activity Table */}
              <section className="apple-card overflow-hidden border-none bg-white/60 backdrop-blur-sm shadow-2xl">
                <div className="p-12 border-b border-border-gray/10 flex justify-between items-center">
                  <h2 className="text-3xl font-semibold text-primary-text tracking-tight">Recent System Activity</h2>
                  <button className="text-accent-primary font-bold text-sm flex items-center gap-1 hover:underline">
                    View All Logs <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-secondary-bg/20">
                        <th className="px-12 py-6 text-[10px] font-black uppercase tracking-widest text-secondary-text opacity-60">User</th>
                        <th className="px-12 py-6 text-[10px] font-black uppercase tracking-widest text-secondary-text opacity-60">Action</th>
                        <th className="px-12 py-6 text-[10px] font-black uppercase tracking-widest text-secondary-text opacity-60">Module</th>
                        <th className="px-12 py-6 text-[10px] font-black uppercase tracking-widest text-secondary-text opacity-60">Time</th>
                        <th className="px-12 py-6 text-[10px] font-black uppercase tracking-widest text-secondary-text opacity-60">Status</th>
                        <th className="px-12 py-6"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border-gray/10">
                      {[
                        { user: "Alex Johnson", action: "Booked Appointment", module: "Medical", time: "2 mins ago", status: "Success" },
                        { user: "Dr. Sarah Wilson", action: "Issued Prescription", module: "Pharmacy", time: "15 mins ago", status: "Success" },
                        { user: "System", action: "Security Update", module: "Core", time: "1 hour ago", status: "System" },
                        { user: "Jane Smith", action: "Mood Logged", module: "Mental Health", time: "2 hours ago", status: "Success" },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-secondary-bg/30 transition-all duration-300 group">
                          <td className="px-12 py-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-secondary-bg border-2 border-white shadow-sm flex items-center justify-center font-bold text-secondary-text text-xs">
                                {row.user.charAt(0)}
                              </div>
                              <span className="font-bold text-base text-primary-text tracking-tight">{row.user}</span>
                            </div>
                          </td>
                          <td className="px-12 py-8 text-sm font-medium text-secondary-text">{row.action}</td>
                          <td className="px-12 py-8">
                            <span className="px-4 py-1.5 rounded-full bg-secondary-bg text-[10px] font-black uppercase tracking-widest text-secondary-text">{row.module}</span>
                          </td>
                          <td className="px-12 py-8 text-sm font-medium text-secondary-text">{row.time}</td>
                          <td className="px-12 py-8">
                            <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${row.status === 'Success' ? 'bg-accent-green' : 'bg-accent-primary'}`}></div>
                              <span className="text-xs font-black text-primary-text uppercase tracking-widest">{row.status}</span>
                            </div>
                          </td>
                          <td className="px-12 py-8 text-right">
                            <button className="p-2.5 text-secondary-text hover:text-primary-text hover:bg-white rounded-xl transition-all"><MoreHorizontal className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "User Directory" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <header className="flex justify-between items-center mb-16">
                <div>
                  <h1 className="text-5xl font-semibold tracking-tighter text-primary-text">User Directory</h1>
                  <p className="text-xl text-secondary-text mt-2">Manage all students, doctors, and staff.</p>
                </div>
                <button className="apple-button-primary flex items-center gap-2">
                  <UserPlus className="w-5 h-5" /> Add New User
                </button>
              </header>

              <div className="apple-card overflow-hidden border-none bg-white/60 backdrop-blur-sm shadow-xl">
                <div className="p-10 border-b border-border-gray/10 flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-text w-4 h-4" />
                    <input type="text" placeholder="Search by name, email, or ID..." className="apple-input pl-12 py-3.5 text-sm w-full border-none bg-secondary-bg/30 rounded-2xl" />
                  </div>
                  <button className="apple-button-secondary py-3.5 px-6 text-sm flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filters
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary-bg/20">
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-text opacity-60">User</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-text opacity-60">Role</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-text opacity-60">Status</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-text opacity-60">Last Active</th>
                      <th className="px-10 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-gray/10">
                    {[
                      { name: "Sarah Wilson", email: "s.wilson@campus.edu", role: "Doctor", status: "Active", lastActive: "Just now" },
                      { name: "John Smith", email: "j.smith@student.edu", role: "Student", status: "Active", lastActive: "2h ago" },
                      { name: "Emily Brown", email: "e.brown@staff.edu", role: "Admin", status: "Inactive", lastActive: "2 days ago" },
                    ].map((user, i) => (
                      <tr key={i} className="hover:bg-secondary-bg/30 transition-colors">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-primary-text">{user.name}</p>
                              <p className="text-xs text-secondary-text">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className="px-3 py-1 rounded-full bg-secondary-bg text-[10px] font-bold uppercase tracking-widest text-secondary-text">{user.role}</span>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-accent-green' : 'bg-secondary-text'}`}></div>
                            <span className="text-xs font-bold text-primary-text">{user.status}</span>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-sm text-secondary-text">{user.lastActive}</td>
                        <td className="px-10 py-6 text-right">
                          <button className="p-2 text-secondary-text hover:text-primary-text"><MoreHorizontal className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "Security Logs" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <header className="mb-16">
                <h1 className="text-5xl font-semibold tracking-tighter text-primary-text">Security Logs</h1>
                <p className="text-xl text-secondary-text mt-2">Monitor system access and critical events.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {[
                  { label: "Failed Logins", value: "24", status: "warning", icon: <Lock /> },
                  { label: "Active Sessions", value: "1,432", status: "success", icon: <Globe /> },
                  { label: "Database Health", value: "99.9%", status: "success", icon: <Database /> },
                ].map((item, i) => (
                  <div key={i} className="apple-card p-8 border-none bg-white/60 backdrop-blur-sm">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                      item.status === 'success' ? 'bg-accent-green/10 text-accent-green' : 'bg-warning/10 text-warning'
                    }`}>
                      {item.icon}
                    </div>
                    <p className="text-secondary-text text-[10px] font-bold uppercase tracking-widest mb-2">{item.label}</p>
                    <p className="text-4xl font-bold text-primary-text">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="apple-card p-10 border-none bg-white/60 backdrop-blur-sm shadow-xl">
                <div className="space-y-8">
                  {[
                    { event: "Unauthorized Access Attempt", ip: "192.168.1.45", time: "10 mins ago", type: "Critical" },
                    { event: "Admin Password Changed", ip: "10.0.0.12", time: "1 hour ago", type: "Info" },
                    { event: "New Device Login", ip: "172.16.0.5", time: "3 hours ago", type: "Warning" },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-2xl hover:bg-secondary-bg/30 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          log.type === 'Critical' ? 'bg-error/10 text-error' : 
                          log.type === 'Warning' ? 'bg-warning/10 text-warning' : 'bg-accent-primary/10 text-accent-primary'
                        }`}>
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-primary-text">{log.event}</p>
                          <p className="text-xs text-secondary-text">IP: {log.ip} • {log.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        log.type === 'Critical' ? 'bg-error/10 text-error' : 
                        log.type === 'Warning' ? 'bg-warning/10 text-warning' : 'bg-accent-primary/10 text-accent-primary'
                      }`}>
                        {log.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "Notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <header className="flex justify-between items-center mb-16">
                <div>
                  <h1 className="text-5xl font-semibold tracking-tighter text-primary-text">Notifications</h1>
                  <p className="text-xl text-secondary-text mt-2">Broadcast messages and system alerts.</p>
                </div>
                <button className="apple-button-primary flex items-center gap-2">
                  <Mail className="w-5 h-5" /> New Broadcast
                </button>
              </header>

              <div className="space-y-6">
                {[
                  { title: "System Maintenance", message: "Scheduled maintenance on Sunday at 2:00 AM.", time: "Sent 2h ago", recipients: "All Users", status: "Delivered" },
                  { title: "Flu Vaccination Drive", message: "Free flu shots available at the campus clinic next week.", time: "Sent 1d ago", recipients: "Students", status: "Delivered" },
                  { title: "Security Alert", message: "Please update your passwords as part of our quarterly security review.", time: "Draft", recipients: "All Staff", status: "Draft" },
                ].map((notif, i) => (
                  <div key={i} className="apple-card p-8 border-none bg-white/60 backdrop-blur-sm shadow-lg flex items-start justify-between group">
                    <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-secondary-bg flex items-center justify-center text-secondary-text">
                        <Bell className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-primary-text mb-2 tracking-tight">{notif.title}</h3>
                        <p className="text-secondary-text mb-4 max-w-xl">{notif.message}</p>
                        <div className="flex items-center gap-4 text-xs font-bold text-secondary-text uppercase tracking-widest">
                          <span>{notif.recipients}</span>
                          <span>•</span>
                          <span>{notif.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        notif.status === 'Delivered' ? 'bg-accent-green/10 text-accent-green' : 'bg-secondary-bg text-secondary-text'
                      }`}>
                        {notif.status}
                      </span>
                      <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-secondary-text hover:text-primary-text">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "System Settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <header className="mb-16">
                <h1 className="text-5xl font-semibold tracking-tighter text-primary-text">System Settings</h1>
                <p className="text-xl text-secondary-text mt-2">Configure platform-wide preferences.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section className="apple-card p-10 border-none bg-white/60 backdrop-blur-sm shadow-xl">
                  <h2 className="text-2xl font-bold text-primary-text mb-8 tracking-tight">General Configuration</h2>
                  <div className="space-y-8">
                    {[
                      { label: "Platform Name", value: "CampusHealth Unified", icon: <Globe /> },
                      { label: "Admin Email", value: "admin@campushealth.edu", icon: <Mail /> },
                      { label: "Timezone", value: "UTC -5 (Eastern Time)", icon: <Clock /> },
                    ].map((setting, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-secondary-bg flex items-center justify-center text-secondary-text group-hover:bg-accent-primary/10 group-hover:text-accent-primary transition-colors">
                            {setting.icon}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">{setting.label}</p>
                            <p className="font-bold text-primary-text">{setting.value}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-secondary-text opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="apple-card p-10 border-none bg-white/60 backdrop-blur-sm shadow-xl">
                  <h2 className="text-2xl font-bold text-primary-text mb-8 tracking-tight">Security & Access</h2>
                  <div className="space-y-6">
                    {[
                      { label: "Two-Factor Authentication", desc: "Require 2FA for all staff accounts", enabled: true },
                      { label: "Automatic Session Timeout", desc: "Log out users after 30 mins of inactivity", enabled: true },
                      { label: "Public Registration", desc: "Allow new students to create accounts", enabled: false },
                    ].map((toggle, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-secondary-bg/30 transition-colors">
                        <div>
                          <p className="font-bold text-primary-text">{toggle.label}</p>
                          <p className="text-xs text-secondary-text">{toggle.desc}</p>
                        </div>
                        <button className={`w-12 h-6 rounded-full transition-colors relative ${toggle.enabled ? 'bg-accent-green' : 'bg-secondary-bg'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${toggle.enabled ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="md:col-span-2 apple-card p-10 border-none bg-primary-text text-white shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Database className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight">System Backup</h3>
                        <p className="text-white/60">Last backup completed 4 hours ago. Automatic backups are enabled.</p>
                      </div>
                    </div>
                    <button className="bg-white text-primary-text px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                      Run Manual Backup
                    </button>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}