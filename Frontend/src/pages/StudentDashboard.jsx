import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  Pill, 
  Activity, 
  Plus, 
  ChevronRight,
  TrendingUp,
  MessageCircle,
  ShieldCheck,
  Bell,
  Search,
  ArrowUpRight,
  Heart,
  X,
  CheckCircle2,
  Video,
  Users,
  Smile,
  Frown,
  Meh,
  Zap,
  Coffee
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const moodData = [
  { day: 'Mon', mood: 4 },
  { day: 'Tue', mood: 3 },
  { day: 'Wed', mood: 5 },
  { day: 'Thu', mood: 4 },
  { day: 'Fri', mood: 6 },
  { day: 'Sat', mood: 7 },
  { day: 'Sun', mood: 6 },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedMood, setSelectedMood] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const quickActions = [
    { label: "Book Appointment", icon: <Calendar className="w-5 h-5" />, color: "bg-accent-primary", shadow: "shadow-accent-primary/20", action: () => setIsBookingModalOpen(true) },
    { label: "Mood Check", icon: <Activity className="w-5 h-5" />, color: "bg-accent-purple", shadow: "shadow-accent-purple/20", action: () => setIsMoodModalOpen(true) },
    { label: "Order Medicine", icon: <Pill className="w-5 h-5" />, color: "bg-accent-green", shadow: "shadow-accent-green/20", action: () => navigate('/pharmacy') },
    { label: "Track Order", icon: <Clock className="w-5 h-5" />, color: "bg-warning", shadow: "shadow-warning/20", action: () => navigate('/pharmacy') },
  ];

  const appointments = [
    { doctor: "Dr. Sarah Wilson", specialty: "General Physician", time: "Today, 2:30 PM", type: "Video Call", status: "Upcoming" },
    { doctor: "Dr. Michael Chen", specialty: "Counselor", time: "Tomorrow, 10:00 AM", type: "In-person", status: "Confirmed" },
  ];

  const handleBooking = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsBookingModalOpen(false);
      setBookingStep(1);
    }, 2000);
  };

  const handleMoodSubmit = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsMoodModalOpen(false);
      setSelectedMood(null);
    }, 2000);
  };

  return (
    <div className="pt-36 pb-12 px-6 max-w-7xl mx-auto min-h-screen bg-primary-bg">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-widest mb-4"
          >
            <ShieldCheck className="w-3 h-3" /> Verified Student Profile
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl font-semibold mb-2 tracking-tight text-primary-text"
          >
            Hello, Alex
          </motion.h1>
          <p className="text-xl text-secondary-text">Your health summary for February 28, 2026.</p>
        </div>
        <div className="flex gap-3">
          <button className="w-12 h-12 glass-card flex items-center justify-center text-secondary-text hover:text-accent-primary transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 glass-card flex items-center justify-center text-secondary-text hover:text-accent-primary relative transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
          </button>
        </div>
      </header>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {quickActions.map((action, idx) => (
          <motion.button
            key={idx}
            onClick={action.action}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -5 }}
            className="apple-card p-8 flex flex-col items-center text-center gap-5 group border-none bg-white/60 backdrop-blur-sm"
          >
            <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center text-white shadow-xl ${action.shadow} transition-transform group-hover:scale-110`}>
              {action.icon}
            </div>
            <span className="font-semibold text-lg text-primary-text">{action.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content: Bento Style */}
        <div className="lg:col-span-8 space-y-8">
          {/* Appointments Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-primary-text">Upcoming Appointments</h2>
              <button className="text-accent-primary font-semibold flex items-center gap-1 hover:underline text-sm">
                View Schedule <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appointments.map((apt, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="apple-card p-6 flex flex-col justify-between min-h-[180px] border-none bg-white/80 backdrop-blur-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary-bg overflow-hidden border-2 border-surface shadow-sm">
                        <img src={`https://i.pravatar.cc/150?u=${apt.doctor}`} alt={apt.doctor} referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary-text text-base">{apt.doctor}</h3>
                        <p className="text-[10px] text-secondary-text font-bold uppercase tracking-widest">{apt.specialty}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-accent-green/10 text-accent-green text-[10px] font-bold uppercase tracking-widest">
                      {apt.status}
                    </span>
                  </div>
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary-text">{apt.time}</p>
                      <p className="text-xs text-accent-primary font-medium">{apt.type}</p>
                    </div>
                    <button className="text-accent-primary p-2 hover:bg-accent-primary/5 rounded-full transition-colors">
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Health Score Widget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="apple-card p-8 bg-gradient-to-br from-accent-primary to-indigo-700 text-white border-none shadow-xl shadow-accent-primary/20">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Health Score</h3>
                  <p className="text-white/60 text-sm">Based on your recent activity</p>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center font-bold text-xl">
                  85
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span>Physical Activity</span>
                  <span>90%</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-[90%]"></div>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Mental Wellness</span>
                  <span>75%</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-[75%]"></div>
                </div>
              </div>
            </section>

            <section className="apple-card p-8 flex flex-col justify-center border-none bg-white/60 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-accent-purple/10 rounded-2xl flex items-center justify-center text-accent-purple">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <h3 className="text-xl font-semibold text-primary-text">Daily Quote</h3>
              </div>
              <p className="text-lg text-primary-text/80 italic leading-relaxed">
                "Small steps every day lead to big changes over time. You're doing great, Alex."
              </p>
            </section>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-8">
          {/* Mood Tracker */}
          <section className="apple-card p-8 border-none bg-white/60 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-primary-text">Mood Trends</h2>
              <TrendingUp className="w-5 h-5 text-accent-primary" />
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={moodData}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5856D6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#5856D6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#5856D6" 
                    fillOpacity={1} 
                    fill="url(#colorMood)" 
                    strokeWidth={4}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: '12px' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 flex justify-between items-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-text">6.2</p>
                <p className="text-[10px] text-secondary-text font-bold uppercase tracking-widest">Avg Mood</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-green">+15%</p>
                <p className="text-[10px] text-secondary-text font-bold uppercase tracking-widest">Growth</p>
              </div>
              <button 
                onClick={() => setIsMoodModalOpen(true)}
                className="apple-button-primary py-2 px-5 text-xs"
              >
                Log Today
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="apple-card p-8 border-none bg-white/60 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-primary-text mb-6">Recent Activity</h2>
            <div className="space-y-6">
              {[
                { title: "Prescription Ordered", time: "2 hours ago", icon: <Pill className="text-accent-green" /> },
                { title: "Appointment Booked", time: "Yesterday", icon: <Calendar className="text-accent-primary" /> },
                { title: "Mood Logged", time: "2 days ago", icon: <Activity className="text-accent-purple" /> },
              ].map((act, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary-bg flex items-center justify-center">
                    {act.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-primary-text">{act.title}</p>
                    <p className="text-xs text-secondary-text">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-10"
            >
              <button 
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-secondary-bg rounded-full flex items-center justify-center hover:bg-border-gray/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              {isSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent-green">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-semibold mb-2 tracking-tight">Booking Confirmed!</h2>
                  <p className="text-secondary-text">You'll receive a confirmation email shortly.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-semibold mb-8 tracking-tight">Book Appointment</h2>
                  
                  {bookingStep === 1 && (
                    <div className="space-y-6">
                      <p className="text-secondary-text mb-4">Select the type of care you need:</p>
                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { title: "General Physician", icon: <Heart className="text-accent-primary" />, desc: "Routine checkups and common illnesses" },
                          { title: "Mental Health Support", icon: <Activity className="text-accent-purple" />, desc: "Counseling and emotional wellness" },
                          { title: "Specialist Consultation", icon: <ShieldCheck className="text-accent-green" />, desc: "Dermatology, Nutrition, etc." },
                        ].map((type, i) => (
                          <button 
                            key={i}
                            onClick={() => setBookingStep(2)}
                            className="flex items-center gap-5 p-5 rounded-2xl border border-border-gray/30 hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-left"
                          >
                            <div className="w-12 h-12 bg-secondary-bg rounded-xl flex items-center justify-center">
                              {type.icon}
                            </div>
                            <div>
                              <p className="font-bold text-primary-text">{type.title}</p>
                              <p className="text-xs text-secondary-text">{type.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {bookingStep === 2 && (
                    <div className="space-y-6">
                      <p className="text-secondary-text mb-4">Select a preferred time slot:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {["9:00 AM", "10:30 AM", "1:00 PM", "2:30 PM", "4:00 PM", "5:30 PM"].map((time, i) => (
                          <button 
                            key={i}
                            onClick={handleBooking}
                            className="p-4 rounded-xl border border-border-gray/30 hover:border-accent-primary hover:bg-accent-primary/5 transition-all font-bold text-sm"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => setBookingStep(1)}
                        className="w-full text-secondary-text text-sm font-bold hover:underline"
                      >
                        Go Back
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mood Check Modal */}
      <AnimatePresence>
        {isMoodModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoodModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-10"
            >
              <button 
                onClick={() => setIsMoodModalOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-secondary-bg rounded-full flex items-center justify-center hover:bg-border-gray/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              {isSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-accent-purple/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent-purple">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-semibold mb-2 tracking-tight">Mood Logged!</h2>
                  <p className="text-secondary-text">Keep going, Alex. You're doing great.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-semibold mb-4 tracking-tight">How are you feeling?</h2>
                  <p className="text-secondary-text mb-10">Tracking your mood helps us provide better support.</p>
                  
                  <div className="grid grid-cols-5 gap-4 mb-10">
                    {[
                      { emoji: <Smile className="w-8 h-8" />, label: "Great", color: "text-accent-green" },
                      { emoji: <Meh className="w-8 h-8" />, label: "Okay", color: "text-accent-primary" },
                      { emoji: <Frown className="w-8 h-8" />, label: "Down", color: "text-accent-purple" },
                      { emoji: <Zap className="w-8 h-8" />, label: "Stressed", color: "text-error" },
                      { emoji: <Coffee className="w-8 h-8" />, label: "Tired", color: "text-warning" },
                    ].map((mood, i) => (
                      <button 
                        key={i}
                        onClick={() => setSelectedMood(mood.label)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${
                          selectedMood === mood.label ? 'bg-secondary-bg scale-110 shadow-lg' : 'hover:bg-secondary-bg/50'
                        }`}
                      >
                        <div className={`${mood.color}`}>{mood.emoji}</div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-primary-text">Any specific notes? (Optional)</p>
                    <textarea 
                      placeholder="I'm feeling a bit overwhelmed with exams..." 
                      className="apple-input w-full h-32 resize-none p-4"
                    ></textarea>
                  </div>
                  
                  <button 
                    onClick={handleMoodSubmit}
                    disabled={!selectedMood}
                    className="w-full apple-button-primary bg-accent-purple py-5 mt-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Log Mood
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}