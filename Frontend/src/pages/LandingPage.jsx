import { motion } from "motion/react";
import { 
  Calendar, 
  Heart, 
  Pill, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  ShieldCheck, 
  MessageSquare,
  Activity,
  Zap,
  Globe,
  Lock
} from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const features = [
    {
      title: "Medical Care",
      description: "Book physical or video consultations with campus doctors in seconds. Get the care you need, when you need it.",
      icon: <Calendar className="w-6 h-6 text-accent-primary" />,
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800",
      link: "/dashboard",
      color: "bg-accent-primary/10"
    },
    {
      title: "Mental Wellness",
      description: "Access counseling, mood tracking, and anonymous peer support. Your mental health is our priority.",
      icon: <Heart className="w-6 h-6 text-accent-purple" />,
      image: "https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?auto=format&fit=crop&q=80&w=800",
      link: "/mental-health",
      color: "bg-accent-purple/10"
    },
    {
      title: "Campus Pharmacy",
      description: "Order prescriptions and health products for campus delivery. Fast, secure, and convenient.",
      icon: <Pill className="w-6 h-6 text-accent-green" />,
      image: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=800",
      link: "/pharmacy",
      color: "bg-accent-green/10"
    }
  ];

  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-mesh opacity-40"></div>
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              x: [0, 20, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-15%] right-[-10%] w-[70%] h-[70%] bg-accent-primary/10 rounded-full blur-[140px]"
          ></motion.div>
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              x: [0, -30, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-15%] left-[-10%] w-[60%] h-[60%] bg-accent-green/10 rounded-full blur-[140px]"
          ></motion.div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-border-gray/30 text-secondary-text text-sm font-medium mb-10"
          >
            <span className="flex h-2 w-2 rounded-full bg-accent-primary animate-pulse"></span>
            <span>24/7 Mental Health Support Now Live</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 tracking-tight text-balance"
          >
            Your health, your campus, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-primary via-accent-purple to-accent-primary bg-[length:200%_auto] animate-gradient">unified in one place.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-2xl text-secondary-text mb-14 max-w-3xl mx-auto leading-relaxed text-balance"
          >
            The modern healthcare platform designed exclusively for university life. 
            Fast, secure, and always accessible.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-5 justify-center"
          >
            <Link to="/dashboard" className="apple-button-primary text-lg px-10">
              Get Started
            </Link>
            <button className="apple-button-secondary text-lg px-10">
              Watch the Film
            </button>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6"
          >
            Designed for your life.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-secondary-text max-w-2xl mx-auto text-balance"
          >
            Every feature is crafted to fit seamlessly into your busy campus schedule.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Large Feature 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className="md:col-span-8 apple-card overflow-hidden group relative min-h-[500px] border-none"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200" 
                alt="Students" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            </div>
            <div className="absolute bottom-0 left-0 p-12 text-white z-10">
              <h3 className="text-4xl font-semibold mb-4">Built for Students</h3>
              <p className="text-xl text-white/70 max-w-md leading-relaxed">
                Manage your health records, appointments, and prescriptions all with your university ID.
              </p>
            </div>
          </motion.div>

          {/* Small Feature 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -8 }}
            className="md:col-span-4 apple-card p-12 flex flex-col justify-center bg-secondary-bg border-none"
          >
            <div className="w-16 h-16 bg-accent-primary rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-accent-primary/20">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Privacy First</h3>
            <p className="text-secondary-text text-lg leading-relaxed">
              Your data is encrypted and only accessible by you and your healthcare providers.
            </p>
          </motion.div>

          {/* Small Feature 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -8 }}
            className="md:col-span-4 apple-card p-12 flex flex-col justify-center bg-white border border-border-gray/30"
          >
            <div className="w-16 h-16 bg-accent-green rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-accent-green/20">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Real-time Tracking</h3>
            <p className="text-secondary-text text-lg leading-relaxed">
              Track your pharmacy orders and queue status in real-time from your phone.
            </p>
          </motion.div>

          {/* Large Feature 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -8 }}
            className="md:col-span-8 apple-card overflow-hidden group relative min-h-[500px] border-none"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1516534775068-ba3e84529519?auto=format&fit=crop&q=80&w=1200" 
                alt="Doctor" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            </div>
            <div className="absolute bottom-0 left-0 p-12 text-white z-10">
              <h3 className="text-4xl font-semibold mb-4">Expert Care</h3>
              <p className="text-xl text-white/70 max-w-md leading-relaxed">
                Connect with the best campus doctors and counselors through high-quality video consultations.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-40 bg-primary-text text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-7xl font-bold mb-6 tracking-tighter">15k+</p>
              <p className="text-xl text-white/50 font-medium uppercase tracking-widest">Active Students</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-7xl font-bold mb-6 tracking-tighter">50+</p>
              <p className="text-xl text-white/50 font-medium uppercase tracking-widest">Campus Doctors</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-7xl font-bold mb-6 tracking-tighter">2min</p>
              <p className="text-xl text-white/50 font-medium uppercase tracking-widest">Avg Booking Time</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6 max-w-3xl mx-auto">
        <h2 className="mb-16 text-center">Questions? Answers.</h2>
        <div className="space-y-8">
          {[
            { q: "Is my health data secure?", a: "Yes, we use industry-standard end-to-end encryption for all patient records and communications." },
            { q: "Can I use this for emergencies?", a: "For life-threatening emergencies, always call 911. For urgent campus care, use our 24/7 crisis line." },
            { q: "How do I pay for pharmacy orders?", a: "You can pay using your student card, credit card, or insurance provider directly in the app." }
          ].map((faq, i) => (
            <div key={i} className="border-b border-border-gray pb-8">
              <h3 className="mb-4">{faq.q}</h3>
              <p className="text-secondary-text text-lg">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto apple-card p-16 md:p-24 text-center bg-mesh border-none relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="mb-8 tracking-tight">Ready to unify your health?</h2>
            <p className="text-xl text-secondary-text mb-12 max-w-2xl mx-auto">
              Join thousands of students who are already managing their health the modern way.
            </p>
            <Link to="/dashboard" className="apple-button-primary text-xl px-12 py-5">
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border-gray bg-secondary-bg/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-accent-primary/20">C</div>
                <span className="font-bold text-2xl tracking-tight">CampusHealth</span>
              </div>
              <p className="text-secondary-text text-lg max-w-sm">
                The unified healthcare platform for the next generation of campus life.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-secondary-text">Platform</h4>
              <ul className="space-y-4 font-medium">
                <li><Link to="/dashboard" className="hover:text-accent-primary transition-colors">Dashboard</Link></li>
                <li><Link to="/mental-health" className="hover:text-accent-purple transition-colors">Mental Health</Link></li>
                <li><Link to="/pharmacy" className="hover:text-accent-green transition-colors">Pharmacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-secondary-text">Company</h4>
              <ul className="space-y-4 font-medium">
                <li><a href="#" className="hover:text-accent-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-accent-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-accent-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-border-gray flex flex-col md:flex-row justify-between items-center gap-6 text-secondary-text text-sm">
            <p>© 2026 CampusHealth Unified Platform. All rights reserved.</p>
            <div className="flex gap-8">
              <Globe className="w-5 h-5 cursor-pointer hover:text-primary-text transition-colors" />
              <MessageSquare className="w-5 h-5 cursor-pointer hover:text-primary-text transition-colors" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}