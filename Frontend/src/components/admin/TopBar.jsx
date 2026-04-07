import React from 'react';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  HelpCircle,
  LayoutDashboard,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import {
  emitNotificationsRefresh,
  getCachedNotifications,
  getUnreadNotificationCount,
  isNotificationRead,
  markNotificationListRead,
  setCachedNotifications,
  subscribeNotificationsRefresh
} from '../../lib/notifications';

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

const NOTIFICATION_ROUTE_BY_ROLE = {
  admin: '/admin/notifications',
  counselor: '/counselor/notifications'
};

const ACCOUNT_MENU_BY_ROLE = {
  admin: [
    { icon: LayoutDashboard, label: 'My Dashboard', to: '/admin/dashboard' },
    { icon: Settings, label: 'System Settings', to: '/admin/settings' },
    { icon: HelpCircle, label: 'Help Center', to: '/admin/faq' }
  ],
  counselor: [
    { icon: LayoutDashboard, label: 'My Dashboard', to: '/counselor/dashboard' },
    { icon: Settings, label: 'Profile Settings', to: '/counselor/profile-settings' },
    { icon: HelpCircle, label: 'Help Center', to: '/counselor/help-center' }
  ],
  doctor: [
    { icon: LayoutDashboard, label: 'My Dashboard', to: '/doctor/dashboard' },
    { icon: User, label: 'Appointments', to: '/doctor/appointments' },
    { icon: HelpCircle, label: 'Patient Records', to: '/doctor/patients' }
  ],
  pharmacist: [
    { icon: LayoutDashboard, label: 'My Dashboard', to: '/pharmacist/dashboard' },
    { icon: Settings, label: 'Inventory', to: '/pharmacist/inventory' },
    { icon: HelpCircle, label: 'Orders', to: '/pharmacist/orders' }
  ]
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState(() => (
    getCachedNotifications(user?.id, user?.role === 'admin' ? 'admin' : 'mine')
  ));
  const [notificationsLoading, setNotificationsLoading] = React.useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const roleLabel = ROLE_LABEL[user?.role] || 'Staff';
  const avatarColor = ROLE_COLOR[user?.role] || 'bg-blue-600';
  const displayName = getDisplayName(user);
  const unreadNotifications = notifications.filter((notification) => !isNotificationRead(notification, user?.id));
  const notificationsRoute = NOTIFICATION_ROUTE_BY_ROLE[user?.role] || '';
  const accountMenuItems = ACCOUNT_MENU_BY_ROLE[user?.role] || [];

  const loadNotifications = React.useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const scopeQuery = user?.role === 'admin' ? '&scope=admin' : '';
      const data = await apiFetch(`/notifications?limit=5${scopeQuery}`);
      const nextNotifications = Array.isArray(data?.notifications) ? data.notifications : [];
      setNotifications(nextNotifications);
      setCachedNotifications(user?.id, nextNotifications, user?.role === 'admin' ? 'admin' : 'mine');
    } finally {
      setNotificationsLoading(false);
    }
  }, [user?.id, user?.role]);

  React.useEffect(() => {
    if (!['admin', 'counselor'].includes(user?.role)) {
      setNotifications([]);
      return undefined;
    }

    let active = true;

    setNotifications(getCachedNotifications(user?.id, user?.role === 'admin' ? 'admin' : 'mine'));

    const refreshNotifications = async () => {
      try {
        await loadNotifications();
      } catch {
        if (active) {
          // Keep the current unread state visible during transient failures.
        }
      }
    };

    refreshNotifications();

    const intervalId = window.setInterval(refreshNotifications, 10000);
    const handleFocus = () => { refreshNotifications(); };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshNotifications();
      }
    };

    const unsubscribe = subscribeNotificationsRefresh((detail) => {
      if (detail?.type === 'mark-all-read' && detail?.userId === user?.id) {
        setNotifications((currentNotifications) => {
          const nextNotifications = markNotificationListRead(currentNotifications, user?.id);
          setCachedNotifications(user?.id, nextNotifications, user?.role === 'admin' ? 'admin' : 'mine');
          return nextNotifications;
        });
        return;
      }

      refreshNotifications();
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
  }, [loadNotifications, user?.id, user?.role]);

  React.useEffect(() => {
    if (!showNotifications) return undefined;
    loadNotifications().catch(() => {});
    return undefined;
  }, [showNotifications, loadNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openAccountRoute = (to) => {
    setShowProfile(false);
    navigate(to);
  };

  const markAllNotificationsRead = async () => {
    if (!getUnreadNotificationCount(notifications, user?.id)) {
      return;
    }

    setNotifications((currentNotifications) => {
      const nextNotifications = markNotificationListRead(currentNotifications, user?.id);
      setCachedNotifications(user?.id, nextNotifications, user?.role === 'admin' ? 'admin' : 'mine');
      return nextNotifications;
    });
    emitNotificationsRefresh({ type: 'mark-all-read', userId: user?.id });
    await apiFetch('/notifications/read-all', { method: 'PUT' });
    await loadNotifications();
  };

  const openNotification = async (notification) => {
    const alreadyRead = isNotificationRead(notification, user?.id);

    if (!alreadyRead) {
      setNotifications((currentNotifications) => {
        const nextNotifications = currentNotifications.map((currentNotification) => (
          currentNotification._id === notification._id
            ? markNotificationListRead([currentNotification], user?.id)[0]
            : currentNotification
        ));
        setCachedNotifications(user?.id, nextNotifications, user?.role === 'admin' ? 'admin' : 'mine');
        return nextNotifications;
      });
      emitNotificationsRefresh({ type: 'notification-read', userId: user?.id, notificationId: notification._id });
      await apiFetch(`/notifications/${notification._id}/read`, { method: 'PUT' });
      await loadNotifications();
    }

    setShowNotifications(false);
    navigate(notification.link || notificationsRoute || '/');
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
            {unreadNotifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-[min(23rem,calc(100vw-1rem))] overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl shadow-slate-200"
              >
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Notifications</h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {unreadNotifications.length > 0
                          ? `${unreadNotifications.length} unread update${unreadNotifications.length === 1 ? '' : 's'}`
                          : 'All caught up'}
                      </p>
                    </div>
                    <button
                      onClick={markAllNotificationsRead}
                      className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    >
                      Mark all read
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto px-3 py-3">
                  {notificationsLoading ? (
                    <div className="px-3 py-8 text-sm text-slate-500">Loading notifications...</div>
                  ) : notifications.length ? (
                    notifications.map((notification) => {
                      const isRead = isNotificationRead(notification, user?.id);

                      return (
                        <button
                          key={notification._id}
                          onClick={() => openNotification(notification)}
                          className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-slate-50"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                            <Bell className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-start gap-2">
                              <p className="line-clamp-1 text-base font-semibold leading-6 text-slate-900">
                                {notification.title}
                              </p>
                              {!isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{notification.message}</p>
                            <p className="mt-2 text-[11px] font-bold text-slate-400">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-8 text-sm text-slate-500">No notifications yet.</div>
                  )}
                </div>
                {notificationsRoute && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <button
                      onClick={() => { setShowNotifications(false); navigate(notificationsRoute); }}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      View All Notifications
                    </button>
                  </div>
                )}
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
                {accountMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.to}
                      onClick={() => openAccountRoute(item.to)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-slate-900 transition-all"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
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
