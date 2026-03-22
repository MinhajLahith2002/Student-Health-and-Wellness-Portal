import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff, 
  MessageSquare, 
  Send, 
  FileText, 
  MoreVertical,
  User,
  X,
  Maximize2
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_APPOINTMENTS } from '../../../constants/mockAppointmentData';
import { cn } from '../../../lib/utils';

const Consultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const appointment = MOCK_APPOINTMENTS.find(a => a.id === id);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'doctor', text: 'Hello John, how are you feeling today?', time: '10:30 AM' },
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const newMessage = {
      id: chatMessages.length + 1,
      sender: 'student',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setMessage('');
  };

  if (!appointment) return <div>Appointment not found</div>;

  return (
    <div className="h-screen bg-[#18181B] flex flex-col md:flex-row overflow-hidden">
      {/* Main Video Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 md:p-8">
        {/* Doctor Video (Main) */}
        <div className="w-full h-full rounded-[40px] bg-slate-800 overflow-hidden relative shadow-2xl border border-slate-700">
          <img 
            src={appointment.doctorImage} 
            alt={appointment.doctorName}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute bottom-10 left-10">
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <p className="text-white font-bold text-lg">{appointment.doctorName}</p>
              <p className="text-white/60 text-xs uppercase tracking-widest font-bold">{appointment.doctorSpecialty}</p>
            </div>
          </div>
        </div>

        {/* Self Video (PiP) */}
        <div className="absolute top-12 right-12 w-48 h-64 rounded-3xl bg-slate-900 border-2 border-white/20 shadow-2xl overflow-hidden z-10">
          {isVideoOff ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <User className="w-12 h-12 text-slate-700" />
            </div>
          ) : (
            <img 
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200" 
              alt="Self"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute bottom-3 left-3">
            <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
              <p className="text-white text-[10px] font-bold">You</p>
            </div>
          </div>
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl",
              isMuted ? "bg-rose-500 text-white" : "bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 border border-white/10"
            )}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl",
              isVideoOff ? "bg-rose-500 text-white" : "bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 border border-white/10"
            )}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
          </button>
          <button 
            onClick={() => navigate('/student/appointments')}
            className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
          <button 
            onClick={() => setShowChat(!showChat)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl",
              showChat ? "bg-[#2563EB] text-white" : "bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 border border-white/10"
            )}
          >
            <MessageSquare className="w-6 h-6" />
          </button>
          <button className="w-14 h-14 bg-white/10 backdrop-blur-xl text-white rounded-full flex items-center justify-center hover:bg-white/20 border border-white/10 transition-all shadow-xl">
            <Maximize2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Side Panel (Chat) */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="w-full md:w-[400px] h-full bg-white flex flex-col shadow-2xl z-30"
          >
            <div className="p-6 border-b border-[#F0F0F3] flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#18181B]">Consultation Chat</h3>
              <button onClick={() => setShowChat(false)} className="p-2 hover:bg-[#F4F4F8] rounded-full transition-all">
                <X className="w-5 h-5 text-[#71717A]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.sender === 'student' ? "ml-auto items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm font-medium leading-relaxed",
                    msg.sender === 'student' ? "bg-[#2563EB] text-white rounded-tr-none" : "bg-[#F4F4F8] text-[#18181B] rounded-tl-none"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] font-bold text-[#71717A] uppercase mt-1">{msg.time}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 border-t border-[#F0F0F3]">
              <form onSubmit={handleSendMessage} className="relative">
                <input 
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full pl-6 pr-14 py-4 bg-[#F4F4F8] border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#2563EB] text-white rounded-xl flex items-center justify-center hover:bg-[#1D4ED8] transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Consultation;