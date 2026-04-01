import { apiFetch } from './api';

const COUNSELOR_DASHBOARD_CACHE_KEY = 'campushealth_counselor_dashboard_cache_v1';
const COUNSELOR_DASHBOARD_CACHE_TTL = 30 * 1000;

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function writeCounselorDashboardCache(data) {
  if (!canUseSessionStorage() || !data) return;

  try {
    window.sessionStorage.setItem(
      COUNSELOR_DASHBOARD_CACHE_KEY,
      JSON.stringify({
        createdAt: Date.now(),
        data
      })
    );
  } catch {
    // Ignore cache write failures.
  }
}

export function getCachedCounselorDashboard() {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(COUNSELOR_DASHBOARD_CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached?.data || !cached?.createdAt) return null;
    if (Date.now() - cached.createdAt > COUNSELOR_DASHBOARD_CACHE_TTL) return null;
    return cached.data;
  } catch {
    return null;
  }
}

export function invalidateCounselorDashboardCache() {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(COUNSELOR_DASHBOARD_CACHE_KEY);
  } catch {
    // Ignore cache removal failures.
  }
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'All') {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export function getCounselingSessions(params = {}) {
  return apiFetch(`/counseling/sessions${buildQuery(params)}`);
}

export function getCounselingSessionById(id) {
  return apiFetch(`/counseling/sessions/${id}`);
}

export function bookCounselingSession(payload) {
  return apiFetch('/counseling/sessions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function rescheduleCounselingSession(id, payload) {
  return apiFetch(`/counseling/sessions/${id}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }).then((data) => {
    invalidateCounselorDashboardCache();
    return data;
  });
}

export function updateCounselingSessionStatus(id, payload) {
  return apiFetch(`/counseling/sessions/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }).then((data) => {
    invalidateCounselorDashboardCache();
    return data;
  });
}

export function updateCounselingSessionNotes(id, payload) {
  return apiFetch(`/counseling/sessions/${id}/notes`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }).then((data) => {
    invalidateCounselorDashboardCache();
    return data;
  });
}

export function getCounselorDashboard() {
  return apiFetch('/dashboard/counselor').then((data) => {
    writeCounselorDashboardCache(data);
    return data;
  });
}
