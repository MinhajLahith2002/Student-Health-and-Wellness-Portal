import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Video, 
  FileText, 
  MoreVertical,
  Calendar as CalendarIcon,
  Search,
  Plus,
  Activity,
  ChevronRight,
  ArrowUpRight
} from "lucide-react";

export default function DoctorPortal() {
  const navigate = useNavigate();
  const stats = [
    { label: "Today's Appointments", value: "12", icon: <CalendarIcon className="w-5 h-5" />, color: "text-accent-primary", bg: "bg-accent-primary/10" },
    { label: "In Queue", value: "4", icon: <Clock className="w-5 h-5" />, color: "text-warning", bg: "bg-warning/10" },
    { label: "Completed", value: "8", icon: <CheckCircle className="w-5 h-5" />, color: "text-accent-green", bg: "bg-accent-green/10" },
    { label: "Total Patients", value: "1,240", icon: <Users className="w-5 h-5" />, color: "text-accent-purple", bg: "bg-accent-purple/10" },
  ];

  const queue = [
    { name: "John Doe", time: "2:30 PM", type: "Video Call", status: "Ready", id: "a1", displayId: "ST-204" },
    { name: "Jane Smith", time: "2:45 PM", type: "In-person", status: "Waiting", id: "a3", displayId: "ST-205" },
    { name: "Robert Brown", time: "3:00 PM", type: "Video Call", status: "Waiting", id: "a4", displayId: "ST-206" },
  ];
  const nextReadyPatient = queue.find(p => p.status === "Ready");

  return (
    <div className="pt-28 pb-12 px-6 max-w-7xl mx-auto min-h-screen bg-primary-bg">
      <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-widest mb-6"
          >
            <Activity className="w-3 h-3" /> Medical Staff Portal
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-semibold mb-2 tracking-tight text-primary-text text-balance">Welcome, Dr. Wilson</h1>
          <p className="text-xl text-secondary-text leading-relaxed text-balance">You have 4 patients waiting in your queue.</p>
        </div>
        <div className="flex gap-4">
          <button className="apple-button-secondary flex items-center gap-2 px-6">
            <Search className="w-5 h-5" /> Search Patients
          </button>
          <button onClick={() => nextReadyPatient && navigate(`/doctor/consultation/${nextReadyPatient.id}`)} className="apple-button-primary flex items-center gap-2 px-6 shadow-xl shadow-accent-primary/20">
            <Video className="w-5 h-5" /> Start Next Session
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -5 }}
            className="apple-card p-10 border-none bg-white/60 backdrop-blur-sm"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-8 shadow-sm`}>
              {stat.icon}
            </div>
            <p className="text-secondary-text text-[10px] font-bold uppercase tracking-widest mb-3">{stat.label}</p>
            <p className="text-5xl font-bold text-primary-text tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Patient Queue */}
        <div className="lg:col-span-8">
          <section className="apple-card overflow-hidden border-none bg-white/60 backdrop-blur-sm shadow-xl">
            <div className="p-10 border-b border-border-gray/10 flex justify-between items-center">
              <h2 className="text-3xl font-semibold text-primary-text tracking-tight">Patient Queue</h2>
              <div className="flex gap-3">
                <button className="p-2.5 hover:bg-secondary-bg rounded-xl transition-colors text-secondary-text"><Plus className="w-5 h-5" /></button>
                <button className="p-2.5 hover:bg-secondary-bg rounded-xl transition-colors text-secondary-text"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="divide-y divide-border-gray/10">
              {queue.map((patient, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="p-10 flex items-center justify-between hover:bg-secondary-bg/40 transition-all group"
                >
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-full bg-secondary-bg flex items-center justify-center font-bold text-2xl text-secondary-text border-2 border-surface shadow-sm">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-xl text-primary-text tracking-tight">{patient.name}</p>
                        <span className="text-[10px] font-bold text-secondary-text bg-secondary-bg px-2 py-1 rounded-md uppercase tracking-widest">{patient.displayId}</span>
                      </div>
                      <p className="text-sm text-secondary-text font-medium">{patient.type} • {patient.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      patient.status === 'Ready' ? 'bg-accent-green/10 text-accent-green' : 'bg-warning/10 text-warning'
                    }`}>
                      {patient.status}
                    </span>
                    <button onClick={() => navigate(`/doctor/consultation/${patient.id}`)} className="apple-button-primary py-2.5 px-8 text-[11px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95">
                      Start
                    </button>
                    <button className="p-2 text-secondary-text hover:text-primary-text transition-colors">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-8 bg-secondary-bg/20 text-center">
              <button className="text-accent-primary font-semibold text-sm hover:underline tracking-tight">View Full Schedule</button>
            </div>
          </section>
        </div>

        {/* Sidebar: Schedule & Tools */}
        <div className="lg:col-span-4 space-y-10">
          <section className="apple-card p-10 border-none bg-white/60 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-primary-text mb-10 tracking-tight">Today's Timeline</h2>
            <div className="space-y-12 relative before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border-gray/20">
              {[
                { time: "09:00 AM", event: "Staff Briefing", type: "internal", desc: "Conference Room B" },
                { time: "10:30 AM", event: "Clinical Rounds", type: "internal", desc: "Main Ward" },
                { time: "02:30 PM", event: "Patient Consultations", type: "patient", desc: "Room 402" },
                { time: "04:30 PM", event: "Review Records", type: "internal", desc: "Office" },
              ].map((item, idx) => (
                <div key={idx} className="relative pl-12">
                  <div className={`absolute left-0 top-1.5 w-[28px] h-[28px] rounded-full border-4 border-surface shadow-sm transition-transform hover:scale-125 ${
                    item.type === 'patient' ? 'bg-accent-primary' : 'bg-secondary-text'
                  }`}></div>
                  <p className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mb-2">{item.time}</p>
                  <p className="font-semibold text-primary-text text-lg tracking-tight">{item.event}</p>
                  <p className="text-sm text-secondary-text font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="apple-card p-10 bg-primary-text text-white border-none shadow-2xl shadow-black/10">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">Quick Records</h3>
            </div>
            <p className="text-base text-white/60 mb-10 leading-relaxed">
              Access and update patient history, digital prescriptions, and lab results instantly.
            </p>
            <div className="space-y-4">
              <button className="w-full bg-surface text-primary-text py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-98">
                Search Records <ArrowUpRight className="w-5 h-5" />
              </button>
              <button className="w-full bg-white/10 text-white py-4 rounded-2xl font-bold text-base transition-transform hover:scale-[1.02] active:scale-98">
                Issue Prescription
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}