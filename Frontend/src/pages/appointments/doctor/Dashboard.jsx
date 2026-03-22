import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Calendar, 
  Clock, 
  Video, 
  Plus, 
  ChevronRight, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_APPOINTMENTS } from '../../../constants/mockAppointmentData';
import { cn } from '../../../lib/utils';

const DoctorDashboard = () => {
  const todayAppointments = MOCK_APPOINTMENTS.filter(a => a.status === "CONFIRMED");
  const pendingPrescriptions = 3;

  return (
    <div className="min-h-screen bg-[#FCFCFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[#F0F0F3] pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold text-[#18181B] tracking-tight">Doctor Portal</h1>
            <p className="text-[#71717A] mt-2 text-lg">Good morning, Dr. Sarah Smith. Here's your schedule for today.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4"
          >
            <Link 
              to="/doctor/availability"
              className="px-8 py-4 bg-white border border-[#F0F0F3] text-[#18181B] rounded-full font-bold hover:bg-[#F4F4F8] transition-all shadow-sm flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Manage Availability
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 space-y-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Today\'s Appointments', value: todayAppointments.length, icon: Calendar, color: 'bg-blue-50 text-blue-600' },
            { label: 'Patients in Queue', value: '4', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Pending Prescriptions', value: pendingPrescriptions, icon: FileText, color: 'bg-amber-50 text-amber-600' },
            { label: 'Avg. Rating', value: '4.8', icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -4 }}
              className="bg-white p-8 rounded-[32px] border border-[#F0F0F3] shadow-sm"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-bold text-[#18181B] mt-1">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Today's Schedule */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#18181B]">Today's Schedule</h2>
              <span className="text-sm font-bold text-[#2563EB] bg-blue-50 px-4 py-1.5 rounded-full">March 5, 2026</span>
            </div>

            <div className="bg-white rounded-[40px] border border-[#F0F0F3] shadow-sm overflow-hidden">
              <div className="divide-y divide-[#F0F0F3]">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[#F4F4F8]/30 transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-[#F4F4F8] rounded-2xl flex flex-col items-center justify-center text-[#71717A]">
                        <span className="text-[10px] font-bold uppercase">{appointment.time.split(' ')[1]}</span>
                        <span className="text-xl font-bold text-[#18181B]">{appointment.time.split(' ')[0]}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#18181B]">{appointment.studentName}</h3>
                        <p className="text-sm text-[#71717A] font-medium flex items-center gap-2 mt-1">
                          <Video className="w-4 h-4" /> Video Consultation
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link 
                        to={`/doctor/consultation/${appointment.id}`}
                        className="px-6 py-3 bg-[#2563EB] text-white rounded-2xl font-bold text-sm hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-100"
                      >
                        Start Consultation
                      </Link>
                      <button className="p-3 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F8] rounded-xl transition-all">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Queue Management */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-2xl font-bold text-[#18181B]">Live Queue</h2>
            <div className="bg-white p-8 rounded-[40px] border border-[#F0F0F3] shadow-sm space-y-6">
              {[
                { name: 'Alice Johnson', wait: '12 min', status: 'Waiting' },
                { name: 'Robert Miller', wait: '5 min', status: 'Waiting' },
                { name: 'Emma Davis', wait: 'Just arrived', status: 'Waiting' },
              ].map((patient, idx) => (
                <div key={idx} className="flex items-center justify-between pb-6 border-b border-[#F0F0F3] last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-[#2563EB] rounded-xl flex items-center justify-center font-bold">
                      {patient.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-[#18181B]">{patient.name}</p>
                      <p className="text-[10px] text-[#71717A] font-bold uppercase tracking-widest">{patient.wait}</p>
                    </div>
                  </div>
                  <button className="p-2 text-[#2563EB] hover:bg-blue-50 rounded-lg transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <Link 
                to="/doctor/queue"
                className="w-full py-4 bg-[#F4F4F8] text-[#18181B] rounded-2xl font-bold text-sm text-center hover:bg-[#EBEBEF] transition-all block"
              >
                View Full Queue
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;