import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/api';
import DismissibleBanner from '../../components/DismissibleBanner';
import {
  emitNotificationsRefresh,
  getCachedNotifications,
  getUnreadNotificationCount,
  isNotificationRead,
  markNotificationListRead,
  setCachedNotifications,
  subscribeNotificationsRefresh
} from '../../lib/notifications';

const READ_FILTER_OPTIONS = ['all', 'unread', 'read'];
const TYPE_FILTER_OPTIONS = ['all', 'appointment', 'system', 'alert'];

function getTypeLabel(type) {
  if (!type || type === 'all') return 'All counseling types';
  if (type === 'appointment') return 'Counseling updates';
  if (type === 'system') return 'System notices';
  if (type === 'alert') return 'Alerts';
  return `${type}`.charAt(0).toUpperCase() + `${type}`.slice(1);
}

export default function CounselorNotifications() {
  const { user } = useAuth();
  const userId = user?.id || '';
  const cachedNotifications = useMemo(() => getCachedNotifications(userId, 'mine'), [userId]);
  const [notificationState, setNotificationState] = useState(() => ({
    ownerId: user?.id || '',
    items: getCachedNotifications(user?.id, 'mine')
  }));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [readFilter, setReadFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const notifications = notificationState.ownerId === userId ? notificationState.items : cachedNotifications;

  const loadNotifications = useCallback(async (options = {}) => {
    try {
      const data = await apiFetch('/notifications?limit=50');
      const nextNotifications = Array.isArray(data?.notifications) ? data.notifications : [];
      setNotificationState({ ownerId: userId, items: nextNotifications });
      setCachedNotifications(userId, nextNotifications, 'mine');
      if (!options.suppressError) {
        setError('');
      }
      return nextNotifications;
    } catch (err) {
      if (options.suppressError) {
        return null;
      }
      setError(err.message || 'Failed to load notifications');
      return null;
    }
  }, [userId]);

  useEffect(() => {
    let active = true;

    const initialLoadTimer = window.setTimeout(() => {
      if (!active) return;
      loadNotifications();
    }, 0);

    const refreshNotifications = () => {
      if (!active) return;
      loadNotifications({ suppressError: true });
    };

    const intervalId = window.setInterval(refreshNotifications, 15000);
    const handleFocus = () => refreshNotifications();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshNotifications();
      }
    };
    const unsubscribe = subscribeNotificationsRefresh((detail) => {
      if (!active) return;

      if (detail?.type === 'mark-all-read' && detail?.userId === userId) {
        setNotificationState((currentState) => {
          const nextItems = markNotificationListRead(
            currentState.ownerId === userId ? currentState.items : cachedNotifications,
            userId
          );
          setCachedNotifications(userId, nextItems, 'mine');
          return {
            ownerId: userId,
            items: nextItems
          };
        });
        return;
      }

      if (detail?.type === 'notification-read' && detail?.userId === userId && detail?.notificationId) {
        setNotificationState((currentState) => {
          const baseNotifications = currentState.ownerId === userId ? currentState.items : cachedNotifications;
          const nextItems = baseNotifications.map((notification) => (
            notification._id === detail.notificationId
              ? markNotificationListRead([notification], userId)[0]
              : notification
          ));
          setCachedNotifications(userId, nextItems, 'mine');
          return {
            ownerId: userId,
            items: nextItems
          };
        });
        return;
      }

      refreshNotifications();
    });

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      window.clearTimeout(initialLoadTimer);
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribe();
    };
  }, [cachedNotifications, loadNotifications, userId]);

  async function markAllRead() {
    try {
      const unreadCount = getUnreadNotificationCount(notifications, userId);
      if (!unreadCount) {
        setMessage('All counselor notifications are already read.');
        return;
      }

      setNotificationState((currentState) => {
        const nextItems = markNotificationListRead(
          currentState.ownerId === userId ? currentState.items : cachedNotifications,
          userId
        );
        setCachedNotifications(userId, nextItems, 'mine');
        return {
          ownerId: userId,
          items: nextItems
        };
      });
      setMessage('All counselor notifications were marked as read.');
      setError('');
      emitNotificationsRefresh({ type: 'mark-all-read', userId });
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      await loadNotifications({ suppressError: true });
    } catch (err) {
      setError(err.message || 'Failed to mark notifications as read');
      setMessage('');
      await loadNotifications({ suppressError: true });
    }
  }

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch = !query
        || notification.title?.toLowerCase().includes(query)
        || notification.message?.toLowerCase().includes(query)
        || getTypeLabel(notification.type).toLowerCase().includes(query);

      const readState = isNotificationRead(notification, userId) ? 'read' : 'unread';
      const matchesReadFilter = readFilter === 'all' || readFilter === readState;
      const matchesTypeFilter = typeFilter === 'all' || notification.type === typeFilter;

      return matchesSearch && matchesReadFilter && matchesTypeFilter;
    });
  }, [notifications, readFilter, searchQuery, typeFilter, userId]);

  return (
    <div className="pharmacy-shell min-h-screen pb-16">
      <div className="max-w-5xl mx-auto px-8 pt-4 space-y-6">
        <section className="pharmacy-hero">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr),300px] xl:items-center">
            <div className="min-w-0">
              <span className="pharmacy-pill bg-emerald-50 text-emerald-700">Counselor Notifications</span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-primary-text">Review session updates and booking changes.</h1>
              <p className="mt-4 text-base leading-7 text-secondary-text">
                Keep track of new reservations, cancellations, and follow-up alerts without losing the full counseling timeline.
              </p>
            </div>

            <div className="w-full rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm xl:justify-self-end">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Quick action</p>
              <p className="mt-3 text-sm leading-6 text-secondary-text">
                Clear unread alerts once you have reviewed the latest counseling activity.
              </p>
              <button type="button" onClick={markAllRead} className="pharmacy-secondary mt-4 w-full justify-center">
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            </div>
          </div>
        </section>

        <DismissibleBanner
          message={message}
          tone="success"
          onClose={() => setMessage('')}
        />

        <DismissibleBanner
          message={error}
          tone="error"
          onClose={() => setError('')}
          autoHideMs={0}
        />

        <section className="pharmacy-panel overflow-hidden p-0">
          <div className="border-b border-white/70 px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <label className="space-y-2 xl:min-w-0 xl:flex-[1.45]">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Search</span>
                <span className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-text" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="student-field pl-11"
                    placeholder="Search title, type, or message"
                  />
                </span>
              </label>

              <label className="space-y-2 xl:w-[220px] xl:shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Read state</span>
                <select
                  value={readFilter}
                  onChange={(event) => setReadFilter(event.target.value)}
                  className="student-field"
                >
                  {READ_FILTER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === 'all' ? 'All notifications' : option === 'unread' ? 'Unread only' : 'Read only'}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 xl:w-[200px] xl:shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Type</span>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="student-field"
                >
                  {TYPE_FILTER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {getTypeLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="mt-4 text-sm text-secondary-text">
              Showing {filteredNotifications.length} of {notifications.length} notification{notifications.length === 1 ? '' : 's'}.
            </p>
          </div>

          <div className="max-h-[42rem] overflow-y-auto rounded-[2rem]">
            {!notifications.length ? (
              <div className="p-8 text-secondary-text">No counselor notifications yet.</div>
            ) : filteredNotifications.length ? (
              filteredNotifications.map((notification, index) => (
                <article
                  key={notification._id}
                  className={index === 0 ? 'p-6' : 'border-t border-white/70 p-6'}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold text-primary-text">{notification.title}</h2>
                        <span className="pharmacy-pill bg-sky-50 text-sky-700">{getTypeLabel(notification.type)}</span>
                        <span className={isNotificationRead(notification, userId) ? 'pharmacy-pill bg-slate-100 text-slate-600' : 'pharmacy-pill bg-emerald-50 text-emerald-700'}>
                          {isNotificationRead(notification, userId) ? 'Read' : 'Unread'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-secondary-text">{notification.message}</p>
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="p-8 text-center text-secondary-text">
                No notifications match the current filters.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
