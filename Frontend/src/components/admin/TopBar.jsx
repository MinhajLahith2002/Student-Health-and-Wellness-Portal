import React from 'react';
import { 
  Search, 
  Bell, 
  User, 
  ChevronDown, 
  Globe,
  HelpCircle,
  Settings,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TopBar = () => {
  const [showProfile, setShowProfile] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-8 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text"
            placeholder="Search users, reports, or settings..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-full transition-all relative">
          <Globe className="w-5 h-5" />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-full transition-all relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 p-2 overflow-hidden"
              >
                <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Notifications</h3>
                  <button className="text-xs text-blue-600 font-bold hover:underline">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto py-2">
                  {[1, 2, 3].map((i) => (
                    <button key={i} className="w-full p-4 hover:bg-slate-50 rounded-xl text-left transition-colors flex gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">New User Signup</p>
                        <p className="text-xs text-slate-500 mt-0.5">A new student has just registered on the platform.</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">2 minutes ago</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-50 text-center">
                  <button className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">View All Notifications</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-slate-100 mx-2"></div>

        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-full transition-all"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100">
              AD
            </div>
            <div className="hidden md:block text-left pr-2">
              <p className="text-sm font-bold text-slate-900 leading-none">Admin User</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Super Admin</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 p-2"
              >
                <div className="p-3 border-b border-slate-50 mb-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account</p>
                </div>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-slate-900 transition-all">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">My Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-slate-900 transition-all">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Settings</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-slate-900 transition-all">
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Help Center</span>
                </button>
                <div className="h-px bg-slate-50 my-1"></div>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-rose-50 rounded-xl text-rose-600 transition-all">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopBar;