const NOTIFICATIONS_REFRESH_EVENT = 'campushealth:notifications-refresh';
const NOTIFICATIONS_CACHE_PREFIX = 'campushealth:notifications-cache';

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function buildNotificationsCacheKey(userId, scope = 'mine') {
  return `${NOTIFICATIONS_CACHE_PREFIX}:${scope}:${userId || 'guest'}`;
}

export function getCachedNotifications(userId, scope = 'mine') {
  if (!userId || !canUseSessionStorage()) {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(buildNotificationsCacheKey(userId, scope));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setCachedNotifications(userId, notifications, scope = 'mine') {
  if (!userId || !canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      buildNotificationsCacheKey(userId, scope),
      JSON.stringify(Array.isArray(notifications) ? notifications : [])
    );
  } catch {
    // Ignore cache write failures.
  }
}

function getNotificationUserId(entry) {
  return `${entry?.user?._id || entry?.user?.id || entry?.user || ''}`;
}

export function isNotificationRead(notification, userId) {
  if (!userId || !Array.isArray(notification?.readBy)) {
    return false;
  }

  return notification.readBy.some((entry) => getNotificationUserId(entry) === userId);
}

export function markNotificationListRead(notifications, userId) {
  if (!userId || !Array.isArray(notifications)) {
    return Array.isArray(notifications) ? notifications : [];
  }

  return notifications.map((notification) => {
    if (isNotificationRead(notification, userId)) {
      return notification;
    }

    return {
      ...notification,
      readBy: [
        ...(Array.isArray(notification?.readBy) ? notification.readBy : []),
        { user: userId, readAt: new Date().toISOString() }
      ]
    };
  });
}

export function getUnreadNotificationCount(notifications, userId) {
  if (!Array.isArray(notifications)) {
    return 0;
  }

  return notifications.reduce((count, notification) => (
    count + (isNotificationRead(notification, userId) ? 0 : 1)
  ), 0);
}

export function emitNotificationsRefresh(detail = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH_EVENT, { detail }));
}

export function subscribeNotificationsRefresh(handler) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const listener = (event) => {
    handler(event?.detail || {});
  };

  window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, listener);
  return () => window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, listener);
}
