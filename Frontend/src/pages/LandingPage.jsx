import { motion } from 'motion/react';
import {
  ArrowRight,
  ShieldCheck,
  Pill,
  Stethoscope,
  HeartPulse,
  Clock3,
  Building2,
  Truck,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  Activity,
  CalendarClock,
  Files,
  Globe,
  ScanHeart,
  PackageCheck,
  BadgePlus
} from 'lucide-react';
import { Link } from 'react-router-dom';

const heroStats = [
  { value: '24/7', label: 'clinical access' },
  { value: '15k+', label: 'students supported' },
  { value: '2 min', label: 'average request flow' }
];

const serviceCards = [
  {
    icon: Stethoscope,
    title: 'Hospital Appointments',
    text: 'Book consultations, follow queue progress, and keep every visit organized in one secure timeline.'
  },
  {
    icon: Pill,
    title: 'Campus Pharmacy',
    text: 'Search medicines, upload prescriptions, place orders, and track pharmacist processing with live updates.'
  },
  {
    icon: HeartPulse,
    title: 'Student Wellness',
    text: 'Support mental health, preventive care, and day-to-day wellbeing with services designed for campus life.'
  }
];

const workflow = [
  {
    icon: CalendarClock,
    title: 'Request Care Quickly',
    text: 'Students can move from symptom to appointment or medicine order without jumping between systems.'
  },
  {
    icon: Files,
    title: 'Keep Records Connected',
    text: 'Prescriptions, consultations, and pharmacy activity stay aligned for staff and students.'
  },
  {
    icon: Truck,
    title: 'Track Delivery and Review',
    text: 'Orders and prescription verification stay visible with clear status changes and handoff points.'
  }
];

const trustPoints = [
  'Secure patient profile and prescription handling',
  'Faster coordination between clinicians and pharmacists',
  'Designed for real university hospital and pharmacy workflows',
  'Clear student experience from request to fulfillment'
];

const faqs = [
  {
    q: 'Is the platform only for pharmacy orders?',
    a: 'No. It connects appointments, pharmacy operations, prescriptions, and student wellness support in one campus system.'
  },
  {
    q: 'Can students track prescription and order status live?',
    a: 'Yes. Students can follow uploads, verification, order progress, and pharmacy updates from their own dashboard.'
  },
  {
    q: 'Is the experience suitable for hospital staff too?',
    a: 'Yes. The interface supports doctors, pharmacists, counselors, and administrators with role-based views and workflows.'
  }
];

function BrandMark({ className = 'w-12 h-12' }) {
  return (
    <div className={`${className} rounded-2xl bg-[linear-gradient(135deg,#0f2942_0%,#14748b_100%)] shadow-[0_14px_30px_rgba(15,41,66,0.22)] flex items-center justify-center relative overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_40%)]" />
      <div className="relative flex items-center justify-center text-white">
        <BadgePlus className="w-6 h-6" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f4f8fb] text-slate-900">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0d2237_0%,#133b5b_52%,#176f7d_100%)] text-white pt-24 sm:pt-28 pb-16 sm:pb-20">
        <div className="absolute inset-0 opacity-35">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.20),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.22),transparent_28%)]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '46px 46px' }} />
        </div>

        <motion.div
          animate={{ y: [0, -14, 0], x: [0, 8, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-[-7rem] h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 16, 0], x: [0, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-4rem] left-[-6rem] h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs sm:text-sm font-semibold tracking-wide text-cyan-100 mb-6 sm:mb-8"
              >
                <Sparkles className="w-4 h-4" />
                Professional hospital and pharmacy coordination for campus care
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.05 }}
                className="mb-7"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <BrandMark className="w-14 h-14" />
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-cyan-100 font-bold">SLIIT MediBridge Care</p>
                    <p className="text-sm text-slate-200/80">University hospital and pharmacy platform</p>
                  </div>
                </div>
                <h1 className="text-[2.5rem] sm:text-[3.2rem] md:text-[4.5rem] leading-[0.98] md:leading-[0.93] font-black tracking-[-0.05em]">
                  Modern campus healthcare,
                  <span className="block text-cyan-200">built for trust, speed, and professional care delivery.</span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.12 }}
                className="text-base sm:text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed mb-8 sm:mb-10"
              >
                SLIIT MediBridge Care connects student appointments, clinical records, prescriptions, pharmacy orders, and wellness support into one dependable digital care experience.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.18 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10 sm:mb-12"
              >
                <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-900 px-6 sm:px-7 py-3.5 sm:py-4 font-bold hover:bg-cyan-50 transition-colors shadow-xl shadow-slate-950/10">
                  Open Platform <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/pharmacy" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 sm:px-7 py-3.5 sm:py-4 font-bold text-white hover:bg-white/15 transition-colors backdrop-blur-sm">
                  Visit Pharmacy <Pill className="w-5 h-5" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.24 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
              >
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/12 bg-white/8 px-4 sm:px-5 py-4 sm:py-5 backdrop-blur-sm">
                    <p className="text-2xl sm:text-3xl font-black tracking-tight">{stat.value}</p>
                    <p className="text-sm text-slate-200 mt-1 uppercase tracking-[0.18em]">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="relative"
            >
              <div className="grid gap-5">
                <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_34px_80px_rgba(7,18,32,0.35)] min-h-[360px] bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1400"
                    alt="Hospital command and patient care environment"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081420]/90 via-[#0a2031]/25 to-transparent" />
                  <div className="absolute inset-x-4 sm:inset-x-7 bottom-4 sm:bottom-7 flex flex-col md:flex-row gap-3 sm:gap-4">
                    <div className="rounded-2xl bg-white/92 text-slate-900 p-5 shadow-xl backdrop-blur-sm flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold">Hospital Operations</p>
                          <p className="text-sm text-slate-500">Appointments, records, and triage</p>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600">A cleaner front door for clinical care and better coordination across the campus health team.</p>
                    </div>
                    <div className="rounded-2xl bg-[#0f2f4b]/90 border border-cyan-200/10 p-5 shadow-xl backdrop-blur-sm flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-400/15 text-emerald-200 flex items-center justify-center">
                          <PackageCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-white">Pharmacy Fulfillment</p>
                          <p className="text-sm text-cyan-100/70">Verification, stock, and delivery</p>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-cyan-50/80">Give pharmacists clearer oversight of orders, prescription checks, and medicine availability.</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-[1.6rem] bg-white/10 border border-white/12 backdrop-blur-sm p-5">
                    <ScanHeart className="w-8 h-8 text-cyan-200 mb-4" />
                    <p className="font-bold text-white mb-1">Clinical Confidence</p>
                    <p className="text-sm text-slate-200/80">A hero area that now feels like a healthcare platform, not a generic startup page.</p>
                  </div>
                  <div className="rounded-[1.6rem] bg-white/10 border border-white/12 backdrop-blur-sm p-5">
                    <ShieldCheck className="w-8 h-8 text-cyan-200 mb-4" />
                    <p className="font-bold text-white mb-1">Trusted Presentation</p>
                    <p className="text-sm text-slate-200/80">Professional visual language for hospital, pharmacy, and student wellness services.</p>
                  </div>
                  <div className="rounded-[1.6rem] bg-white/10 border border-white/12 backdrop-blur-sm p-5">
                    <Clock3 className="w-8 h-8 text-cyan-200 mb-4" />
                    <p className="font-bold text-white mb-1">Clearer Entry Point</p>
                    <p className="text-sm text-slate-200/80">Students immediately understand appointments, prescriptions, and pharmacy access.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-5">
          {serviceCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="rounded-[1.75rem] bg-white border border-slate-200 shadow-[0_20px_50px_rgba(15,41,66,0.08)] p-8"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#e9f7fb] text-[#125f78] flex items-center justify-center mb-6">
                <card.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight mb-3">{card.title}</h3>
              <p className="text-slate-600 leading-relaxed text-lg">{card.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-10 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[2rem] overflow-hidden min-h-[540px] relative"
          >
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200"
              alt="Professional hospital environment"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071625]/85 via-[#071625]/20 to-transparent" />
            <div className="absolute inset-x-8 bottom-8 text-white">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200 mb-4">Clinical Environment</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] max-w-xl">A calmer, more professional first impression for hospital and pharmacy services.</h2>
            </div>
          </motion.div>

          <div className="grid gap-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-[2rem] bg-white border border-slate-200 p-8 md:p-10 shadow-[0_18px_45px_rgba(14,34,56,0.06)]"
            >
              <p className="text-sm uppercase tracking-[0.25em] text-[#14748b] font-bold mb-5">Why This Platform</p>
              <h2 className="text-[34px] md:text-[46px] font-black tracking-[-0.04em] leading-[1.02] mb-6">Healthcare operations should feel trustworthy, coordinated, and easy to use.</h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                The redesigned landing page now speaks clearly to hospital-grade care, campus pharmacy efficiency, and a more polished student experience. It uses stronger contrast, healthcare-focused imagery, and calmer motion to match a professional medical brand.
              </p>
              <div className="grid gap-4">
                {trustPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3 rounded-2xl bg-[#f1f8fa] border border-[#d7ecf1] px-4 py-4">
                    <CheckCircle2 className="w-5 h-5 text-[#14748b] shrink-0 mt-0.5" />
                    <p className="text-slate-700 font-medium">{point}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {workflow.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -5 }}
                  className="rounded-[1.6rem] bg-[#0f2942] text-white p-6 shadow-[0_18px_42px_rgba(15,41,66,0.18)]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-cyan-200 mb-5">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-extrabold tracking-tight mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-200 leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[linear-gradient(135deg,#eef7fa_0%,#f9fcfd_45%,#edf4f8_100%)] border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-[2rem] overflow-hidden bg-white border border-slate-200 shadow-[0_18px_45px_rgba(14,34,56,0.06)]"
            >
              <img
                src="https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&q=80&w=1400"
                alt="Hospital care and consultation"
                className="w-full h-80 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-8">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#14748b] mb-3">Hospital Services</p>
                <h3 className="text-3xl font-black tracking-[-0.03em] mb-4">A digital front door for appointments, consultations, and records.</h3>
                <p className="text-slate-600 text-lg leading-relaxed">Present hospital care with the clarity and confidence patients expect from a modern medical institution.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-[2rem] overflow-hidden bg-white border border-slate-200 shadow-[0_18px_45px_rgba(14,34,56,0.06)]"
            >
              <img
                src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=1400"
                alt="Professional pharmacy service"
                className="w-full h-80 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-8">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#0f766e] mb-3">Pharmacy Services</p>
                <h3 className="text-3xl font-black tracking-[-0.03em] mb-4">A stronger pharmacy experience built around trust, accuracy, and visibility.</h3>
                <p className="text-slate-600 text-lg leading-relaxed">Showcase medicine search, prescription review, and order fulfillment in a way that feels dependable and clinically organized.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-sm uppercase tracking-[0.28em] text-[#14748b] font-bold mb-4">Common Questions</p>
          <h2 className="text-[36px] md:text-[52px] font-black tracking-[-0.04em] mb-4">Professional care should also be easy to understand.</h2>
          <p className="text-lg text-slate-600">A clearer homepage helps students and staff understand exactly what the platform offers.</p>
        </div>
        <div className="space-y-5">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-[1.6rem] bg-white border border-slate-200 p-7 shadow-[0_14px_35px_rgba(14,34,56,0.05)]"
            >
              <h3 className="text-xl font-extrabold tracking-tight mb-3">{faq.q}</h3>
              <p className="text-slate-600 leading-relaxed text-lg">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto rounded-[2.5rem] overflow-hidden bg-[linear-gradient(135deg,#0f2942_0%,#134b63_55%,#14748b_100%)] text-white p-10 md:p-16 shadow-[0_35px_80px_rgba(15,41,66,0.28)] relative"
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_30%)]" />
          <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-100 font-bold mb-4">SLIIT MediBridge Care Platform</p>
              <h2 className="text-[34px] md:text-[52px] font-black tracking-[-0.04em] mb-5">Present your hospital and pharmacy services with the professionalism they deserve.</h2>
              <p className="text-lg text-slate-200 max-w-2xl leading-relaxed">A stronger homepage builds trust immediately and gives students a clearer path into appointments, prescriptions, and pharmacy care.</p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
              <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-900 px-7 py-4 font-bold hover:bg-cyan-50 transition-colors">
                Enter Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/pharmacy" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white hover:bg-white/15 transition-colors">
                Visit Pharmacy <PhoneCall className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10 items-start">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <BrandMark className="w-11 h-11" />
              <div>
                <p className="text-xl font-black tracking-tight">SLIIT MediBridge Care</p>
                <p className="text-sm text-slate-500">Hospital and pharmacy platform</p>
              </div>
            </div>
            <p className="text-slate-600 text-lg max-w-md leading-relaxed">A more professional digital healthcare experience for modern campus communities.</p>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Explore</p>
            <div className="space-y-3 text-slate-700 font-medium">
              <Link to="/dashboard" className="block hover:text-[#14748b] transition-colors">Dashboard</Link>
              <Link to="/mental-health" className="block hover:text-[#14748b] transition-colors">Mental Health</Link>
              <Link to="/pharmacy" className="block hover:text-[#14748b] transition-colors">Pharmacy</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Standards</p>
            <div className="space-y-3 text-slate-700 font-medium">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#14748b]" /> Secure records</span>
              <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-[#14748b]" /> Clinical workflow</span>
              <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-[#14748b]" /> Campus-wide access</span>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row gap-3 justify-between text-sm text-slate-500">
            <p>© 2026 SLIIT MediBridge Care. All rights reserved.</p>
            <p>Professional hospital and pharmacy experience for university care.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
