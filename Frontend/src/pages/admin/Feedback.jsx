import React, { useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  Filter, 
  Search, 
  MoreVertical, 
  CheckCircle2, 
  AlertCircle, 
  Flag, 
  Reply, 
  ChevronRight,
  TrendingUp,
  Users,
  ThumbsUp,
  ThumbsDown,
  XCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../../components/admin/AdminLayout';
import { cn } from '../../lib/utils';

const MOCK_FEEDBACK = [
  { id: 1, user: "John Doe", module: "Appointments", item: "Dr. Sarah Smith", rating: 5, comment: "Excellent service, very professional and caring.", date: "2026-02-27", status: "Reviewed" },
  { id: 2, user: "Anonymous", module: "Pharmacy", item: "Order #8294", rating: 2, comment: "Delivery was delayed by 3 hours without any notice.", date: "2026-02-26", status: "Pending" },
  { id: 3, user: "Michael Chen", module: "Mental Health", item: "Counseling Session", rating: 4, comment: "The session was helpful, but the booking process could be smoother.", date: "2026-02-25", status: "Reviewed" },
  { id: 4, user: "Emily Wilson", module: "Appointments", item: "Dr. Robert Brown", rating: 5, comment: "Very thorough checkup. Highly recommend.", date: "2026-02-24", status: "Flagged" },
  { id: 5, user: "Anonymous", module: "Pharmacy", item: "Order #8295", rating: 1, comment: "Received the wrong medicine. This is dangerous!", date: "2026-02-23", status: "Critical" },
];

const SENTIMENT_DATA = [
  { name: 'Positive', value: 65, color: '#10B981' },
  { name: 'Neutral', value: 20, color: '#F59E0B' },
  { name: 'Critical', value: 15, color: '#EF4444' },
];

const FeedbackManager = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const tabs = ["All", "Appointments", "Mental Health", "Pharmacy"];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Feedback Manager</h1>
            <p className="text-slate-500 mt-2 text-lg">Aggregate and analyze user feedback across all platform modules.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white border border-slate-100 rounded-xl flex items-center gap-2 shadow-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-slate-600">Avg. Rating: 4.2/5.0</span>
            </div>
          </div>
        </div>

        {/* Top Stats & Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Sentiment Distribution</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SENTIMENT_DATA}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {SENTIMENT_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-6">
              {SENTIMENT_DATA.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Reviews</p>
              <h3 className="text-4xl font-bold text-slate-900 mt-2">1,284</h3>
              <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12% from last month
              </p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <ThumbsUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Positive Feedback</p>
              <h3 className="text-4xl font-bold text-slate-900 mt-2">832</h3>
              <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +5% from last month
              </p>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
                    activeTab === tab ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="activeFeedbackTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search feedback..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {MOCK_FEEDBACK.map((feedback) => (
              <motion.div 
                layout
                key={feedback.id}
                className={cn(
                  "bg-white p-8 rounded-[32px] border transition-all group",
                  feedback.status === 'Critical' ? "border-rose-100 bg-rose-50/10" : "border-slate-100 shadow-sm"
                )}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-lg">
                      {feedback.user === 'Anonymous' ? '?' : feedback.user.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-bold text-slate-900">{feedback.user}</h4>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-widest">
                          {feedback.module}
                        </span>
                        {feedback.status === 'Critical' && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Critical
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        regarding {feedback.item} • {feedback.date}
                      </p>
                      <div className="flex items-center gap-1 mt-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={cn("w-4 h-4", star <= feedback.rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                        ))}
                      </div>
                      <p className="text-slate-600 mt-4 leading-relaxed font-medium">"{feedback.comment}"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setSelectedFeedback(feedback);
                        setShowReplyModal(true);
                      }}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-blue-100 transition-all"
                    >
                      <Reply className="w-4 h-4" /> Respond
                    </button>
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Flag className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Response Modal Placeholder */}
      <AnimatePresence>
        {showReplyModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReplyModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Respond to Feedback</h2>
                  <button onClick={() => setShowReplyModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <XCircle className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">User Comment</p>
                  <p className="text-slate-600 font-medium italic">"{selectedFeedback?.comment}"</p>
                </div>

                <form className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Response</label>
                    <textarea 
                      rows={5} 
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-medium text-slate-600 resize-none" 
                      placeholder="Type your reply to the user..." 
                    />
                    <p className="text-[10px] text-slate-400 font-medium">This response will be sent to the user via notification and email.</p>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setShowReplyModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-bold hover:bg-slate-200 transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3">
                      <Reply className="w-5 h-5" />
                      Send Response
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default FeedbackManager;