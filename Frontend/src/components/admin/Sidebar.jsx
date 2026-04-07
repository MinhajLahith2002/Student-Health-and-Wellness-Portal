import React from 'react';
import {
  LayoutDashboard,
  Users,
  Bell,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calendar,
  HelpCircle,
  BookOpen,
  LogOut,
  Package,
  ClipboardList,
  ShoppingCart,
  Pill,
  FileText,
  UserRound,
  Stethoscope,
  Activity,
  HeartHandshake,
  Clock,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/api';
import {
  getCachedNotifications,
  getUnreadNotificationCount,
  subscribeNotificationsRefresh
} from '../../lib/notifications';

const SidebarItem = ({ icon, label, to, isCollapsed, isActive, badge, hasDot }) => {
  return (
    <div className="px-3 py-1">
      <Link
        to={to}
        className={cn(
          'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative',
          isActive
            ? 'bg-blue-50 text-blue-600'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        )}
      >
        <span className="relative shrink-0">
          {React.createElement(icon, {
            className: cn('w-5 h-5', isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'),
          })}
          {hasDot && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
          )}
        </span>
        {!isCollapsed && (
          <span className="font-medium text-sm flex-1 truncate">{label}</span>
        )}
        {!isCollapsed && badge && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full">
            {badge}
          </span>
        )}
        {isActive && (
          <motion.div
            layoutId="active-nav"
            className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
          />
        )}
      </Link>
    </div>
  );
};

// ─── Menu definitions per role ─────────────────────────────────────────────
const ADMIN_MENUS = [
  {
    title: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', to: '/admin/dashboard' },
      { icon: Users, label: 'User Management', to: '/admin/users' },
    ],
  },
  {
    title: 'Content',
    items: [
      { icon: BookOpen, label: 'Resources', to: '/admin/resources' },
      { icon: HelpCircle, label: 'FAQ Manager', to: '/admin/faq' },
      { icon: Calendar, label: 'Events', to: '/admin/events' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { icon: Bell, label: 'Notifications', to: '/admin/notifications' },
      { icon: MessageSquare, label: 'Feedback', to: '/admin/feedback' },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: BarChart3, label: 'Reports', to: '/admin/reports' },
      { icon: ShieldCheck, label: 'Audit Logs', to: '/admin/audit' },
      { icon: Settings, label: 'Settings', to: '/admin/settings' },
    ],
  },
];

const PHARMACIST_MENUS = [
  {
    title: 'Pharmacy',
    items: [
      { icon: Activity, label: 'Dashboard', to: '/pharmacist/dashboard' },
      { icon: ClipboardList, label: 'Prescriptions', to: '/pharmacist/prescriptions' },
      { icon: ShoppingCart, label: 'Orders', to: '/pharmacist/orders' },
      { icon: Package, label: 'Inventory', to: '/pharmacist/inventory' },
    ],
  },
  {
    title: 'Medicines',
    items: [
      { icon: Pill, label: 'Add Medicine', to: '/pharmacist/medicines/new' },
    ],
  },
];

const DOCTOR_MENUS = [
  {
    title: 'Doctor Portal',
    items: [
      { icon: Stethoscope, label: 'Dashboard', to: '/doctor/dashboard' },
      { icon: Calendar, label: 'Appointments', to: '/doctor/appointments' },
      { icon: Clock, label: 'Availability', to: '/doctor/availability' },
      { icon: UserRound, label: 'Patient Records', to: '/doctor/patients' },
      { icon: FileText, label: 'Prescriptions', to: '/doctor/prescriptions' },
    ],
  },
];

const COUNSELOR_MENUS = [
  {
    title: 'Counselor Portal',
    items: [
      { icon: HeartHandshake, label: 'Dashboard', to: '/counselor/dashboard' },
      { icon: Calendar, label: 'Sessions', to: '/counselor/sessions' },
      { icon: FileText, label: 'Notes', to: '/counselor/notes' },
      { icon: BookOpen, label: 'Resources', to: '/counselor/resources' },
      { icon: Bell, label: 'Notifications', to: '/counselor/notifications' },
      { icon: UserRound, label: 'Profile Settings', to: '/counselor/profile' },
      { icon: HelpCircle, label: 'Help Center', to: '/counselor/help-center' },
    ],
  },
];

// ─── Role meta (logo label & accent) ───────────────────────────────────────
const ROLE_META = {
  admin: { label: 'Admin', accent: 'CampusAdmin' },
  pharmacist: { label: 'Pharmacist', accent: 'PharmPortal' },
  doctor: { label: 'Doctor', accent: 'DocPortal' },
  counselor: { label: 'Counselor', accent: 'CarePortal' },
};

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [hasUnreadNotifications, setHasUnreadNotifications] = React.useState(false);

  const role = user?.role || 'admin';
  const menuGroups =
    role === 'pharmacist' ? PHARMACIST_MENUS :
    role === 'counselor'  ? COUNSELOR_MENUS :
    role === 'doctor'     ? DOCTOR_MENUS :
                            ADMIN_MENUS;

  const meta = ROLE_META[role] || ROLE_META.admin;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  React.useEffect(() => {
    if (!['admin', 'counselor'].includes(role) || !user?.id) {
      setHasUnreadNotifications(false);
      return undefined;
    }

    let active = true;
    setHasUnreadNotifications(
      getUnreadNotificationCount(
        getCachedNotifications(user.id, role === 'admin' ? 'admin' : 'mine'),
        user.id
      ) > 0
    );

    const loadUnreadState = async () => {
      try {
        const scopeQuery = role === 'admin' ? '&scope=admin' : '';
        const data = await apiFetch(`/notifications?limit=20${scopeQuery}`);
        if (!active) return;

        const notifications = Array.isArray(data?.notifications) ? data.notifications : [];
        const unreadExists = getUnreadNotificationCount(notifications, user.id) > 0;

        setHasUnreadNotifications(unreadExists);
      } catch {
        if (active) setHasUnreadNotifications(false);
      }
    };

    loadUnreadState();

    const intervalId = window.setInterval(loadUnreadState, 10000);
    const handleFocus = () => { loadUnreadState(); };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadUnreadState();
      }
    };
    const unsubscribe = subscribeNotificationsRefresh((detail) => {
      if (detail?.type === 'mark-all-read' && detail?.userId === user?.id) {
        setHasUnreadNotifications(false);
        return;
      }

      loadUnreadState();
    });

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribe();
    };
  }, [role, user?.id]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 88 : 280 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 top-0 bottom-0 bg-white border-r border-slate-100 z-50 flex flex-col"
    >
      {/* Logo Area */}
      <div className={cn(
        'h-20 border-b border-slate-50',
        isCollapsed ? 'flex items-center justify-center px-4' : 'flex items-center px-6'
      )}>
        <div className={cn(
          'flex items-center',
          isCollapsed ? 'justify-center' : 'gap-3 overflow-hidden'
        )}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="min-w-0 truncate font-bold text-xl text-slate-900 tracking-tight"
            >
              Campus<span className="text-blue-600">{meta.accent.replace('Campus', '')}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Role badge */}
      {!isCollapsed && (
        <div className="px-6 pt-4 pb-2">
          <span className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest',
            role === 'admin' ? 'bg-blue-50 text-blue-600' :
            role === 'pharmacist' ? 'bg-emerald-50 text-emerald-600' :
            role === 'counselor' ? 'bg-purple-50 text-purple-600' :
            'bg-indigo-50 text-indigo-600'
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {meta.label}
          </span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="mb-6">
            {!isCollapsed && (
              <p className="px-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {group.title}
              </p>
            )}
            {group.items.map((item, i) => (
              <SidebarItem
                key={i}
                {...item}
                isCollapsed={isCollapsed}
                isActive={location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)}
                hasDot={item.label === 'Notifications' && hasUnreadNotifications}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-50">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150 group"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse Sidebar</span>
            </>
          )}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 mt-1 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors duration-150 group"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
