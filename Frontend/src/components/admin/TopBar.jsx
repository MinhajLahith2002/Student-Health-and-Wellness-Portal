import React from 'react';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  HelpCircle,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ROLE_LABEL = {
  admin: 'Super Admin',
  doctor: 'Doctor',
  pharmacist: 'Chief Pharmacist',
  counselor: 'Counselor',
  student: 'Student',
};

const ROLE_COLOR = {
  admin: 'bg-blue-600',
  doctor: 'bg-indigo-600',
  pharmacist: 'bg-emerald-600',
  counselor: 'bg-purple-600',
  student: 'bg-slate-600',
};

function getDisplayName(user) {
  const rawName = (user?.name || '').trim();
  if (!rawName) return 'Staff User';

  if (user?.role === 'doctor') {
    return rawName;
  }

  return rawName.replace(/^dr\.?\s+/i, '');
}

const TopBar = ({ onMenuToggle }) => {
  const [showProfile, setShowProfile] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const roleLabel = ROLE_LABEL[user?.role] || 'Staff';
  const avatarColor = ROLE_COLOR[user?.role] || 'bg-blue-600';
  const displayName = getDisplayName(user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="min-h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2.5 text-slate-500 hover:bg-slate-50 rounded-full transition-all shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            placeholder="Search users, reports, or settings..."
            className="w-full min-w-0 pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-full transition-all relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 p-2 overflow-hidden"
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
                        <p className="text-sm font-bold text-slate-900">New Activity</p>
                        <p className="text-xs text-slate-500 mt-0.5">System notification #{i}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">{i * 5} minutes ago</p>
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

        <div className="hidden sm:block h-8 w-px bg-slate-100 mx-2" />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-full transition-all"
          >
            <div className={`w-9 h-9 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
              {initials}
            </div>
            <div className="hidden md:block text-left pr-2">
              <p className="text-sm font-bold text-slate-900 leading-none">{displayName}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{roleLabel}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-[min(14rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 p-2"
              >
                <div className="p-3 border-b border-slate-50 mb-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account</p>
                  <p className="text-sm font-bold text-slate-900 mt-1 truncate">{user?.email}</p>
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
                <div className="h-px bg-slate-50 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-rose-50 rounded-xl text-rose-600 transition-all"
                >
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
