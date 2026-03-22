import React, { useState } from 'react';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Loader2,
  Eye,
  TrendingUp,
  Users,
  ShoppingBag,
  Activity,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../../components/admin/AdminLayout';
import { cn } from '../../lib/utils';

const REPORT_TYPES = [
  { id: 'appointments', label: 'Appointments', icon: Calendar, description: 'Daily, weekly, and monthly appointment trends.' },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText, description: 'Prescription upload and verification statistics.' },
  { id: 'pharmacy', label: 'Pharmacy Orders', icon: ShoppingBag, description: 'Sales, inventory, and order fulfillment reports.' },
  { id: 'users', label: 'User Signups', icon: Users, description: 'New user registration and platform growth.' },
  { id: 'revenue', label: 'Revenue', icon: BarChart3, description: 'Financial reports and revenue distribution.' },
  { id: 'activity', label: 'System Activity', icon: Activity, description: 'Audit logs and system performance metrics.' },
];

const MOCK_SAVED_REPORTS = [
  { id: 1, name: "Monthly Pharmacy Sales - Feb 2026", type: "Pharmacy Orders", date: "2026-02-28", size: "2.4 MB", format: "PDF" },
  { id: 2, name: "Appointment Trends Q1", type: "Appointments", date: "2026-02-25", size: "1.1 MB", format: "CSV" },
  { id: 3, name: "User Growth Analysis", type: "User Signups", date: "2026-02-20", size: "850 KB", format: "PDF" },
  { id: 4, name: "Counseling Feedback Summary", type: "System Activity", date: "2026-02-15", size: "1.5 MB", format: "PDF" },
];

const ReportsGenerator = () => {
  const [selectedType, setSelectedType] = useState('appointments');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Reports Generator</h1>
            <p className="text-slate-500 mt-2 text-lg">Generate custom PDF or CSV reports on various platform metrics.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Configuration */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Report Type</label>
                <div className="grid grid-cols-1 gap-3">
                  {REPORT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type.id);
                        setShowPreview(false);
                      }}
                      className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 group",
                        selectedType === type.id 
                          ? "border-blue-600 bg-blue-50/30" 
                          : "border-slate-50 bg-slate-50 hover:border-blue-100 hover:bg-white"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        selectedType === type.id ? "bg-blue-600 text-white" : "bg-white text-slate-400 group-hover:text-blue-600 shadow-sm"
                      )}>
                        <type.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={cn("text-sm font-bold", selectedType === type.id ? "text-blue-900" : "text-slate-900")}>{type.label}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{type.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Today", "This Week", "This Month", "Custom"].map(r => (
                    <label key={r} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border-2 border-transparent has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                      <input type="radio" name="range" defaultChecked={r === 'This Month'} className="hidden" />
                      <span className="text-xs font-bold text-slate-600">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {["PDF Report", "CSV Data"].map(f => (
                    <label key={f} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border-2 border-transparent has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                      <input type="radio" name="format" defaultChecked={f === 'PDF Report'} className="hidden" />
                      <span className="text-xs font-bold text-slate-600">{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <BarChart3 className="w-6 h-6" />}
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {/* Right: Preview & Saved */}
          <div className="lg:col-span-8 space-y-10">
            <AnimatePresence mode="wait">
              {showPreview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden"
                >
                  <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">Report Preview</h3>
                      <p className="text-sm text-slate-500 mt-1">Generated for {REPORT_TYPES.find(t => t.id === selectedType)?.label}</p>
                    </div>
                    <button className="px-6 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>
                  <div className="p-10 bg-slate-50/50">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 max-w-2xl mx-auto min-h-[500px] flex flex-col">
                      <div className="flex justify-between items-start mb-12">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                          <BarChart3 className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">CampusHealth Report</p>
                          <p className="text-sm font-bold text-slate-900 mt-1">Ref: CH-2026-02-28</p>
                        </div>
                      </div>
                      
                      <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        {REPORT_TYPES.find(t => t.id === selectedType)?.label} Summary
                      </h2>
                      <p className="text-slate-500 font-medium mb-10">Period: Feb 1, 2026 - Feb 28, 2026</p>

                      <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Volume</p>
                          <p className="text-2xl font-bold text-slate-900 mt-1">1,284</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth Rate</p>
                          <p className="text-2xl font-bold text-emerald-600 mt-1">+12.5%</p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="h-2 bg-slate-100 rounded-full w-full"></div>
                        <div className="h-2 bg-slate-100 rounded-full w-3/4"></div>
                        <div className="h-2 bg-slate-100 rounded-full w-5/6"></div>
                        <div className="h-2 bg-slate-100 rounded-full w-1/2"></div>
                      </div>

                      <div className="mt-12 pt-8 border-t border-slate-50 flex justify-between items-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated by Admin User</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feb 28, 2026</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-[40px] border border-slate-100 border-dashed p-32 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <BarChart3 className="w-12 h-12 text-slate-200" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Generate</h2>
                  <p className="text-slate-500 max-w-sm mx-auto text-lg">
                    Configure your report on the left and click generate to see a preview.
                  </p>
                </div>
              )}
            </AnimatePresence>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-slate-900">Saved Reports</h3>
                <button className="text-sm font-bold text-blue-600 hover:underline">Manage All</button>
              </div>
              <div className="divide-y divide-slate-50">
                {MOCK_SAVED_REPORTS.map((report) => (
                  <div key={report.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{report.name}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {report.type} • {report.format} • {report.size} • {report.date}
                        </p>
                      </div>
                    </div>
                    <button className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReportsGenerator;