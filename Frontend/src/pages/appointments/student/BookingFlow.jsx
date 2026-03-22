import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  User, 
  Video, 
  MapPin,
  AlertCircle
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MOCK_DOCTORS } from '../../../constants/mockAppointmentData';
import { cn } from '../../../lib/utils';

const steps = ['Select Doctor', 'Date & Time', 'Confirm'];

const BookingFlow = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedDoctorId = searchParams.get('doctor');

  const [currentStep, setCurrentStep] = useState(preselectedDoctorId ? 1 : 0);
  const [selectedDoctor, setSelectedDoctor] = useState(MOCK_DOCTORS.find(d => d.id === preselectedDoctorId) || null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState('');

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final confirmation logic
      alert('Appointment Booked Successfully!');
      navigate('/student/appointments');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', 
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  return (
    <div className="min-h-screen bg-[#FCFCFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[#F0F0F3] pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#F4F4F8] rounded-full transition-all"
            >
              <ChevronLeft className="w-6 h-6 text-[#18181B]" />
            </button>
            <h1 className="text-3xl font-bold text-[#18181B]">Book Appointment</h1>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#F0F0F3] -translate-y-1/2 z-0" />
            {steps.map((step, index) => (
              <div key={step} className="relative z-10 flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-4",
                  currentStep === index ? "bg-[#2563EB] text-white border-blue-100" : 
                  currentStep > index ? "bg-emerald-500 text-white border-emerald-100" : 
                  "bg-white text-[#71717A] border-[#F0F0F3]"
                )}>
                  {currentStep > index ? <CheckCircle2 className="w-6 h-6" /> : index + 1}
                </div>
                <span className={cn(
                  "text-xs font-bold mt-2 uppercase tracking-widest",
                  currentStep === index ? "text-[#2563EB]" : "text-[#71717A]"
                )}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-12">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-[#18181B]">Select a Doctor</h2>
              <div className="grid grid-cols-1 gap-4">
                {MOCK_DOCTORS.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      handleNext();
                    }}
                    className={cn(
                      "p-6 rounded-2xl border-2 text-left transition-all flex items-center gap-6",
                      selectedDoctor?.id === doctor.id ? "border-[#2563EB] bg-blue-50/30" : "border-[#F0F0F3] bg-white hover:border-blue-200"
                    )}
                  >
                    <img src={doctor.image} alt={doctor.name} className="w-16 h-16 rounded-xl object-cover" />
                    <div>
                      <h3 className="font-bold text-[#18181B]">{doctor.name}</h3>
                      <p className="text-sm text-[#71717A]">{doctor.specialty}</p>
                    </div>
                    <ChevronRight className="ml-auto w-5 h-5 text-[#71717A]" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="bg-white p-8 rounded-[32px] border border-[#F0F0F3] shadow-sm">
                <h2 className="text-xl font-bold text-[#18181B] mb-6 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#2563EB]" />
                  Select Date
                </h2>
                {/* Simplified Calendar Placeholder */}
                <div className="grid grid-cols-7 gap-2 mb-8">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-[#71717A] uppercase py-2">{d}</div>
                  ))}
                  {Array.from({ length: 31 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(`2026-03-${i + 1}`)}
                      className={cn(
                        "aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                        selectedDate === `2026-03-${i + 1}` ? "bg-[#2563EB] text-white shadow-lg shadow-blue-100" : "hover:bg-[#F4F4F8] text-[#18181B]"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <h2 className="text-xl font-bold text-[#18181B] mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#2563EB]" />
                  Select Time
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        "py-3 rounded-full text-xs font-bold transition-all border-2",
                        selectedTime === time ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-white text-[#71717A] border-[#F0F0F3] hover:border-blue-200"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleBack}
                  className="flex-1 py-5 bg-[#F4F4F8] text-[#18181B] rounded-[24px] font-bold hover:bg-[#EBEBEF] transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleNext}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-[2] py-5 bg-[#2563EB] text-white rounded-[24px] font-bold hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-10 rounded-[40px] border border-[#F0F0F3] shadow-sm">
                <h2 className="text-2xl font-bold text-[#18181B] mb-8">Confirm Appointment</h2>
                
                <div className="flex items-center gap-6 p-6 bg-[#F4F4F8] rounded-3xl mb-8">
                  <img src={selectedDoctor?.image} alt={selectedDoctor?.name} className="w-20 h-20 rounded-2xl object-cover" />
                  <div>
                    <h3 className="text-xl font-bold text-[#18181B]">{selectedDoctor?.name}</h3>
                    <p className="text-[#71717A] font-medium">{selectedDoctor?.specialty}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 border border-[#F0F0F3] rounded-2xl">
                    <p className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest mb-2">Date & Time</p>
                    <div className="flex items-center gap-3 text-[#18181B] font-bold">
                      <CalendarIcon className="w-5 h-5 text-[#2563EB]" />
                      {selectedDate} at {selectedTime}
                    </div>
                  </div>
                  <div className="p-6 border border-[#F0F0F3] rounded-2xl">
                    <p className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest mb-2">Consultation Type</p>
                    <div className="flex items-center gap-3 text-[#18181B] font-bold">
                      <Video className="w-5 h-5 text-[#2563EB]" />
                      Video Consultation
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest">Notes for Doctor (Optional)</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-6 py-4 bg-[#F4F4F8] border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-medium text-[#18181B] resize-none"
                    placeholder="Briefly describe your symptoms or concerns..."
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleBack}
                  className="flex-1 py-5 bg-[#F4F4F8] text-[#18181B] rounded-[24px] font-bold hover:bg-[#EBEBEF] transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-[2] py-5 bg-[#2563EB] text-white rounded-[24px] font-bold hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-100"
                >
                  Confirm Booking
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BookingFlow;