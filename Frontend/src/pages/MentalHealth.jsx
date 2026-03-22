import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  Heart, 
  Smile, 
  Meh,
  Frown,
  Zap,
  Coffee,
  Moon, 
  BookOpen, 
  Video, 
  Users,
  Sparkles
} from "lucide-react";

export default function MentalHealthHub() {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState(null);

  const resources = [
    { title: "Managing Exam Stress", category: "Academic", time: "5 min read", icon: <BookOpen className="text-accent-primary" /> },
    { title: "Better Sleep Habits", category: "Wellness", time: "8 min read", icon: <Moon className="text-indigo-500" /> },
    { title: "Mindfulness for Beginners", category: "Meditation", time: "10 min audio", icon: <Sparkles className="text-amber-500" /> },
  ];

  return (
    <div className="pt-28 pb-12 px-6 max-w-7xl mx-auto min-h-screen bg-primary-bg">
      <header className="mb-20 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-purple/10 text-accent-purple text-[10px] font-bold uppercase tracking-widest mb-8"
        >
          <Heart className="w-3 h-3 fill-current" /> Mental Health Hub
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-semibold mb-8 tracking-tight text-primary-text text-balance">How are you feeling today?</h1>
        <p className="text-xl text-secondary-text leading-relaxed text-balance">
          A safe space for your mind. Access resources, talk to professionals, or connect with peers anonymously.
        </p>
      </header>

      {/* Mood Selector */}
      <section className="mb-24">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {[
            { icon: <Smile className="w-12 h-12" />, label: "Great", color: "text-accent-green" },
            { icon: <Meh className="w-12 h-12" />, label: "Okay", color: "text-accent-primary" },
            { icon: <Frown className="w-12 h-12" />, label: "Down", color: "text-accent-purple" },
            { icon: <Zap className="w-12 h-12" />, label: "Stressed", color: "text-error" },
            { icon: <Coffee className="w-12 h-12" />, label: "Tired", color: "text-warning" },
          ].map((mood, idx) => (
            <motion.button
              key={idx}
              onClick={() => setSelectedMood(mood.label)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.95 }}
              className={`apple-card p-10 flex flex-col items-center gap-4 group border-none backdrop-blur-sm transition-all ${
                selectedMood === mood.label ? "bg-accent-purple/20 ring-2 ring-accent-purple/50" : "bg-white/60"
              }`}
            >
              <span className={`${mood.color} group-hover:scale-125 transition-transform duration-500`}>{mood.icon}</span>
              <span className="font-semibold text-secondary-text tracking-tight">{mood.label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Services */}
        <div className="lg:col-span-2 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              whileHover={{ y: -8 }}
              className="apple-card p-10 bg-gradient-to-br from-accent-purple to-purple-700 text-white border-none shadow-xl shadow-accent-purple/20"
            >
              <Users className="w-12 h-12 mb-8" />
              <h3 className="text-3xl font-semibold mb-4 tracking-tight">Peer Support</h3>
              <p className="text-white/80 mb-8 leading-relaxed">Connect with fellow students anonymously. Share your journey and support others.</p>
              <button onClick={() => navigate("/mental-health/discussion")} className="bg-white text-accent-purple px-8 py-3 rounded-full font-bold text-sm transition-transform hover:scale-105 active:scale-95">Join Discussion</button>
            </motion.div>

            <motion.div 
              whileHover={{ y: -8 }}
              className="apple-card p-10 bg-gradient-to-br from-accent-green to-emerald-700 text-white border-none shadow-xl shadow-accent-green/20"
            >
              <Video className="w-12 h-12 mb-8" />
              <h3 className="text-3xl font-semibold mb-4 tracking-tight">1-on-1 Care</h3>
              <p className="text-white/80 mb-8 leading-relaxed">Private, confidential sessions with professional campus counselors.</p>
              <button onClick={() => navigate("/student/appointments/find")} className="bg-white text-accent-green px-8 py-3 rounded-full font-bold text-sm transition-transform hover:scale-105 active:scale-95">Book Session</button>
            </motion.div>
          </div>

          <section>
            <h2 className="text-2xl font-semibold mb-8 text-primary-text tracking-tight">Recommended for you</h2>
            <div className="space-y-5">
              {resources.map((res, idx) => (
                <motion.div 
                  key={idx} 
                  whileHover={{ x: 8 }}
                  className="apple-card p-6 flex items-center justify-between group cursor-pointer border-none bg-white/60 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-secondary-bg flex items-center justify-center">
                      {res.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold group-hover:text-accent-primary transition-colors text-primary-text text-lg tracking-tight">{res.title}</h4>
                      <p className="text-sm text-secondary-text font-medium">{res.category} • {res.time}</p>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-border-gray group-hover:text-warning transition-colors" />
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          <div className="apple-card p-10 bg-error text-white border-none shadow-xl shadow-error/20">
            <h3 className="text-2xl font-semibold mb-5 tracking-tight">Emergency Support</h3>
            <p className="text-white/80 text-sm mb-8 leading-relaxed">
              If you are in immediate distress or need urgent help, our 24/7 crisis line is always available.
            </p>
            <a href="tel:988" className="block w-full bg-white text-error py-4 rounded-2xl font-bold text-lg text-center transition-transform hover:scale-[1.02] active:scale-95">Call Now: 988</a>
          </div>

          <div className="apple-card p-10 border-none bg-white/60 backdrop-blur-sm">
            <h3 className="font-semibold mb-8 text-primary-text text-xl tracking-tight">Daily Mindfulness</h3>
            <div className="flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-full bg-secondary-bg flex items-center justify-center overflow-hidden border-2 border-surface shadow-sm">
                <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=200" alt="Meditation" referrerPolicy="no-referrer" />
              </div>
              <div>
                <p className="font-semibold text-primary-text text-lg tracking-tight">Morning Calm</p>
                <p className="text-sm text-secondary-text font-medium">3:45 remaining</p>
              </div>
            </div>
            <div className="h-2 bg-secondary-bg rounded-full overflow-hidden">
              <div className="h-full bg-accent-purple w-2/3 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}