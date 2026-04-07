const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
const API_ORIGIN_OVERRIDE_KEY = 'campushealth_api_origin_override';
const DEV_DISCOVERY_TIMEOUT_MS = 15000;
const DEV_DISCOVERY_RETRY_DELAY_MS = 700;
const CONFIGURED_DEV_API_URL = `${viteEnv.VITE_API_URL || ''}`.trim();
const CONFIGURED_DEV_PROXY_TARGET = `${viteEnv.VITE_API_PROXY_TARGET || ''}`.trim();

function parseAbsoluteUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isLocalhostUrl(value) {
  const parsed = parseAbsoluteUrl(value);
  return Boolean(parsed && ['localhost', '127.0.0.1'].includes(parsed.hostname));
}

function resolveApiBase() {
  const configuredBase = viteEnv.VITE_API_URL?.trim();

  if (viteEnv.DEV) {
    if (configuredBase && !isLocalhostUrl(configuredBase)) {
      return configuredBase.replace(/\/$/, '');
    }

    return '/api';
  }

  return '/api';
}

const API_BASE = resolveApiBase();
const DEV_LOCAL_API = resolveDevLocalApi();
let apiOriginOverride = readApiOriginOverride();
let discoveryPromise = null;

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function resolveDevLocalApi() {
  if (!viteEnv.DEV) {
    return null;
  }

  const localSource = [CONFIGURED_DEV_API_URL, CONFIGURED_DEV_PROXY_TARGET].find((value) => isLocalhostUrl(value));
  if (!localSource) return null;

  try {
    const parsed = new URL(localSource);
    const basePath = CONFIGURED_DEV_API_URL && isLocalhostUrl(CONFIGURED_DEV_API_URL)
      ? new URL(CONFIGURED_DEV_API_URL).pathname.replace(/\/$/, '') || '/api'
      : '/api';

    return {
      origin: parsed.origin,
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80)),
      basePath
    };
  } catch {
    return null;
  }
}

function readApiOriginOverride() {
  if (!DEV_LOCAL_API || !canUseSessionStorage()) return '';

  try {
    window.sessionStorage.removeItem(API_ORIGIN_OVERRIDE_KEY);
  } catch {
    // Ignore storage failures.
  }

  return '';
}

function persistApiOriginOverride(origin) {
  apiOriginOverride = origin || '';
  if (!canUseSessionStorage()) return;

  try {
    if (origin) {
      window.sessionStorage.setItem(API_ORIGIN_OVERRIDE_KEY, origin);
    } else {
      window.sessionStorage.removeItem(API_ORIGIN_OVERRIDE_KEY);
    }
  } catch {
    // Ignore storage failures.
  }
}

function getActiveApiOrigin() {
  if (!DEV_LOCAL_API) return '';
  return DEV_LOCAL_API.origin;
}

function buildApiBase(origin = '') {
  if (origin && DEV_LOCAL_API) {
    return `${origin}${DEV_LOCAL_API.basePath}`;
  }

  return API_BASE;
}

function buildApiUrl(path, origin = '') {
  if (path.startsWith('http')) {
    return path;
  }

  const base = buildApiBase(origin);
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildHealthUrl(origin) {
  if (!origin || !DEV_LOCAL_API) return '';
  return `${origin}${DEV_LOCAL_API.basePath}/health`;
}

function isRecoverableNetworkError(error) {
  return !error?.status && error instanceof Error;
}

function buildLocalApiCandidates() {
  if (!DEV_LOCAL_API) return [];

  const candidates = [`${DEV_LOCAL_API.protocol}//${DEV_LOCAL_API.hostname}:${DEV_LOCAL_API.port}`];

  return apiOriginOverride
    ? [apiOriginOverride, ...candidates.filter((candidate) => candidate !== apiOriginOverride)]
    : candidates;
}

async function probeApiOrigin(origin) {
  const healthUrl = buildHealthUrl(origin);
  if (!healthUrl) return false;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), 800)
    : null;

  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      signal: controller?.signal
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function discoverDevApiOrigin() {
  if (!DEV_LOCAL_API) return '';
  if (discoveryPromise) return discoveryPromise;

  discoveryPromise = (async () => {
    for (const origin of buildLocalApiCandidates()) {
      if (await probeApiOrigin(origin)) {
        persistApiOriginOverride(origin === DEV_LOCAL_API.origin ? '' : origin);
        return origin;
      }
    }

    return '';
  })();

  try {
    return await discoveryPromise;
  } finally {
    discoveryPromise = null;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDevApiOrigin(timeoutMs = DEV_DISCOVERY_TIMEOUT_MS) {
  if (!DEV_LOCAL_API) return '';

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const discoveredOrigin = await discoverDevApiOrigin();
    if (discoveredOrigin) {
      return discoveredOrigin;
    }

    await wait(DEV_DISCOVERY_RETRY_DELAY_MS);
  }

  return '';
}

function getBackendOrigin() {
  if (DEV_LOCAL_API) {
    return getActiveApiOrigin() || DEV_LOCAL_API.origin;
  }

  if (/^https?:\/\//i.test(API_BASE)) {
    return new URL(API_BASE).origin;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export { getBackendOrigin };

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

async function parseApiResponse(res) {
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

async function executeApiRequest(path, options, origin) {
  const res = await fetch(buildApiUrl(path, origin), options);
  return parseApiResponse(res);
}

export async function apiFetch(path, options = {}) {
  const headers = { ...options.headers };
  
  // Only set application/json if not sending FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const requestOptions = {
    ...options,
    headers,
    cache: 'no-store',
    credentials: 'omit',
  };

  try {
    return await executeApiRequest(path, requestOptions);
  } catch (error) {
    const canRecoverLocally = (
      viteEnv.DEV
      && DEV_LOCAL_API
      && !path.startsWith('http')
      && isRecoverableNetworkError(error)
    );

    if (canRecoverLocally) {
      const discoveredOrigin = await waitForDevApiOrigin();
      if (discoveredOrigin) {
        return executeApiRequest(path, requestOptions, discoveredOrigin);
      }
    }

    if (isRecoverableNetworkError(error)) {
      const devHint = DEV_LOCAL_API
        ? ` Unable to reach the backend API. Make sure the backend is running on ${DEV_LOCAL_API.origin}.`
        : '';
      throw new Error(`${error.message || 'Network request failed.'}${devHint}`.trim());
    }

    throw error;
  }
}

export { API_BASE };
