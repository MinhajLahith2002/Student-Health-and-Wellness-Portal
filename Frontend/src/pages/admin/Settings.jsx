import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Mail, 
  Database, 
  Smartphone, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Smartphone as PhoneIcon,
  Cloud,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../../components/admin/AdminLayout';
import { cn } from '../../lib/utils';

const SystemSettings = () => {
  const [activeSection, setActiveSection] = useState("General");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const sections = [
    { id: "General", icon: Globe, label: "General Settings", description: "Platform name, timezone, and language." },
    { id: "Security", icon: Shield, label: "Security & Auth", description: "Password policies, 2FA, and session management." },
    { id: "Notifications", icon: Bell, label: "Notification Config", description: "Email templates, push settings, and SMS gateway." },
    { id: "Database", icon: Database, label: "Data & Storage", description: "Backup schedules, retention policies, and storage limits." },
    { id: "API", icon: Key, label: "API & Integrations", description: "Third-party keys, webhooks, and external services." },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">System Settings</h1>
            <p className="text-slate-500 mt-2 text-lg">Configure global platform parameters and security policies.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? 'Saving Changes...' : 'Save All Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Navigation */}
          <div className="lg:col-span-4 space-y-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full p-6 rounded-[32px] border-2 text-left transition-all flex items-center gap-6 group",
                  activeSection === section.id 
                    ? "border-blue-600 bg-blue-50/30" 
                    : "border-white bg-white hover:border-blue-100 shadow-sm"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                  activeSection === section.id ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-slate-50 text-slate-400 group-hover:text-blue-600"
                )}>
                  <section.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className={cn("text-sm font-bold", activeSection === section.id ? "text-blue-900" : "text-slate-900")}>{section.label}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{section.description}</p>
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 ml-auto transition-transform",
                  activeSection === section.id ? "text-blue-600 translate-x-1" : "text-slate-300"
                )} />
              </button>
            ))}
          </div>

          {/* Right: Content */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-slate-50">
                <h3 className="text-2xl font-bold text-slate-900">{activeSection} Settings</h3>
              </div>
              
              <div className="p-10 space-y-10">
                {activeSection === 'General' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Name</label>
                        <input type="text" defaultValue="CampusHealth" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Email</label>
                        <input type="email" defaultValue="support@campushealth.edu" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-900" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Default Language</label>
                      <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-600">
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>

                    <div className="p-8 bg-blue-50 rounded-[32px] border border-blue-100">
                      <div className="flex items-center gap-4 mb-4">
                        <Globe className="w-6 h-6 text-blue-600" />
                        <h4 className="text-sm font-bold text-blue-900 uppercase tracking-widest">Timezone & Locale</h4>
                      </div>
                      <p className="text-xs text-blue-700 font-medium mb-6">Set the global timezone for all system events and notifications.</p>
                      <select className="w-full px-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-bold text-slate-600 shadow-sm">
                        <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                        <option>(GMT-08:00) Pacific Time (US & Canada)</option>
                        <option>(GMT+00:00) UTC</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeSection === 'Security' && (
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password Policy</h4>
                      <div className="space-y-4">
                        {[
                          "Require at least 10 characters",
                          "Require special characters",
                          "Require numbers",
                          "Require uppercase letters"
                        ].map(policy => (
                          <label key={policy} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                            <span className="text-sm font-bold text-slate-700">{policy}</span>
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600 focus:ring-blue-600 border-slate-300" />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="p-8 bg-rose-50 rounded-[32px] border border-rose-100">
                      <div className="flex items-center gap-4 mb-4">
                        <Lock className="w-6 h-6 text-rose-600" />
                        <h4 className="text-sm font-bold text-rose-900 uppercase tracking-widest">Two-Factor Authentication</h4>
                      </div>
                      <p className="text-xs text-rose-700 font-medium mb-6">Enforce 2FA for all administrative accounts to enhance security.</p>
                      <button className="px-6 py-3 bg-rose-600 text-white rounded-full font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">
                        Enforce 2FA Globally
                      </button>
                    </div>
                  </div>
                )}

                {/* Other sections would follow a similar pattern */}
                {activeSection !== 'General' && activeSection !== 'Security' && (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Settings className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{activeSection} Configuration</h3>
                    <p className="text-slate-500">This section is currently being updated with new parameters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast Placeholder */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="bg-emerald-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold">Settings saved successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default SystemSettings;