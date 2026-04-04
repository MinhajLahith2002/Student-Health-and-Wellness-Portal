const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};

function resolveApiBase() {
  const configuredBase = viteEnv.VITE_API_URL?.trim();

  if (viteEnv.DEV && configuredBase) {
    return configuredBase.replace(/\/$/, '');
  }

  if (viteEnv.DEV) {
    return '/api';
  }

  return '/api';
}

const API_BASE = resolveApiBase();

function getBackendOrigin() {
  if (/^https?:\/\//i.test(API_BASE)) {
    return new URL(API_BASE).origin;
  }

  if (typeof window !== 'undefined') {
    return viteEnv.DEV ? 'http://localhost:5000' : window.location.origin;
  }

  return 'http://localhost:5000';
}

export function resolveAssetUrl(path) {
  if (!path || typeof path !== 'string') return '';
  if (/^(data:|blob:|https?:\/\/)/i.test(path)) return path;

  const backendOrigin = getBackendOrigin();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${backendOrigin}${normalizedPath}`;
}

function getToken() {
  return localStorage.getItem('token');
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = { ...options.headers };
  
  // Only set application/json if not sending FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'omit',
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text || 'Invalid response' };
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed (${res.status})`;
    const err = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export { API_BASE };
