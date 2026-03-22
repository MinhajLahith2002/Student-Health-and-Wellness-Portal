import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  Plus, 
  Search, 
  FileText, 
  MessageSquare, 
  ChevronRight,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_APPOINTMENTS } from '../../../constants/mockAppointmentData';
import { cn } from '../../../lib/utils';

const AppointmentDashboard = () => {
  const upcomingAppointments = MOCK_APPOINTMENTS.filter(a => a.status === "CONFIRMED");
  const pastAppointments = MOCK_APPOINTMENTS.filter(a => a.status === "COMPLETED" || a.status === "CANCELLED");

  return (
    <div className="min-h-screen bg-[#FCFCFC] pb-20">
      {/* Hero Section */}
      <div className="bg-white border-b border-[#F0F0F3] pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold text-[#18181B] tracking-tight">My Appointments</h1>
            <p className="text-[#71717A] mt-2 text-lg">Manage your health consultations and bookings.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link 
              to="/student/appointments/find"
              className="px-8 py-4 bg-[#2563EB] text-white rounded-full font-bold hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Book New Appointment
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 space-y-12">
        {/* Upcoming Appointments */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#18181B]">Upcoming Appointments</h2>
            <Link to="/student/appointments/history" className="text-[#2563EB] font-bold text-sm hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="bg-white p-6 rounded-2xl border border-[#F0F0F3] shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <img 
                      src={appointment.doctorImage} 
                      alt={appointment.doctorName}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-[#18181B]">{appointment.doctorName}</h3>
                      <p className="text-sm text-[#71717A]">{appointment.doctorSpecialty}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="px-3 py-1 bg-blue-50 text-[#2563EB] text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {appointment.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-[#71717A]">
                      <Calendar className="w-4 h-4" />
                      {appointment.date}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#71717A]">
                      <Clock className="w-4 h-4" />
                      {appointment.time}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#71717A]">
                      {appointment.type === "VIDEO" ? (
                        <><Video className="w-4 h-4" /> Video Call</>
                      ) : (
                        <><MapPin className="w-4 h-4" /> In-Person</>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {appointment.type === "VIDEO" && (
                      <Link 
                        to={`/student/consultation/${appointment.id}`}
                        className="flex-1 py-3 bg-[#2563EB] text-white rounded-xl font-bold text-sm text-center hover:bg-[#1D4ED8] transition-all"
                      >
                        Join Call
                      </Link>
                    )}
                    <button className="flex-1 py-3 bg-[#F4F4F8] text-[#18181B] rounded-xl font-bold text-sm hover:bg-[#EBEBEF] transition-all">
                      Reschedule
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-[#F0F0F3]">
                <p className="text-[#71717A]">No upcoming appointments found.</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold text-[#18181B] mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { title: 'Find Doctor', icon: Search, link: '/student/appointments/find', color: 'bg-blue-50 text-blue-600' },
              { title: 'My Prescriptions', icon: FileText, link: '/student/prescriptions', color: 'bg-emerald-50 text-emerald-600' },
              { title: 'Feedback', icon: MessageSquare, link: '/student/appointments/feedback', color: 'bg-purple-50 text-purple-600' },
            ].map((action) => (
              <Link 
                key={action.title}
                to={action.link}
                className="bg-white p-6 rounded-2xl border border-[#F0F0F3] shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", action.color)}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#18181B] group-hover:text-[#2563EB] transition-colors">{action.title}</h3>
                  <p className="text-xs text-[#71717A] mt-1">Quick access to {action.title.toLowerCase()}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Past Appointments */}
        <section>
          <h2 className="text-2xl font-bold text-[#18181B] mb-6">Past Appointments</h2>
          <div className="bg-white rounded-2xl border border-[#F0F0F3] shadow-sm overflow-hidden">
            <div className="divide-y divide-[#F0F0F3]">
              {pastAppointments.map((appointment) => (
                <div key={appointment.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F4F4F8]/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <img 
                      src={appointment.doctorImage} 
                      alt={appointment.doctorName}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-[#18181B]">{appointment.doctorName}</h3>
                      <p className="text-xs text-[#71717A]">{appointment.doctorSpecialty} • {appointment.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                      appointment.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {appointment.status}
                    </span>
                    <Link 
                      to={`/student/appointments/${appointment.id}`}
                      className="p-2 text-[#71717A] hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AppointmentDashboard;