import { apiFetch } from './api';

const STORAGE_PREFIX = 'campushealth_mh';
const SESSION_CACHE_PREFIX = 'campushealth_mh_session_cache';
const resourceDetailCache = new Map();
const resourceDetailRequestCache = new Map();
const requestCache = new Map();
const moodCacheConfig = {
  stats: { key: 'mood-stats', ttlMs: 60 * 1000 },
  logs: { key: 'mood-logs', ttlMs: 30 * 1000 },
  resources: { key: 'mental-health-resources', ttlMs: 60 * 1000 },
  resourceCatalog: { key: 'resource-catalog', ttlMs: 60 * 1000 },
  resourceRecommendations: { key: 'resource-recommendations', ttlMs: 60 * 1000 },
  forumBootstrap: { key: 'forum-bootstrap', ttlMs: 20 * 1000 }
};
const FORUM_ALIAS_ADJECTIVES = ['Quiet', 'Kind', 'Brave', 'Calm', 'Soft', 'Bright', 'Gentle', 'Steady', 'Silver', 'Sunny'];
const FORUM_ALIAS_NOUNS = ['Comet', 'River', 'Notebook', 'Lantern', 'Feather', 'Echo', 'Harbor', 'Sky', 'Willow', 'Star'];
const MOOD_RESOURCE_KEYWORDS = {
  Anxious: ['anxiety', 'grounding', 'stress', 'panic', 'calm', 'breathing'],
  Stressed: ['stress', 'grounding', 'burnout', 'panic', 'focus', 'reset'],
  Down: ['emotional recovery', 'motivation', 'gentle reset', 'peer support', 'support'],
  Sad: ['emotional recovery', 'motivation', 'gentle reset', 'peer support', 'support'],
  Tired: ['sleep', 'recovery', 'low-energy', 'rest', 'study break'],
  Okay: ['focus', 'habit', 'resilience', 'wellness', 'routine'],
  Great: ['focus', 'habit', 'resilience', 'wellness', 'routine'],
  Happy: ['focus', 'habit', 'resilience', 'wellness', 'routine'],
  Energetic: ['focus', 'habit', 'resilience', 'wellness', 'routine']
};
const FACTOR_RESOURCE_KEYWORDS = {
  Sleep: ['sleep', 'recovery', 'night routine', 'body scan'],
  Exams: ['stress', 'focus', 'burnout', 'study', 'exam'],
  Work: ['stress', 'focus', 'burnout', 'study', 'reset'],
  Relationships: ['peer support', 'boundaries', 'emotional recovery', 'conversation'],
  Social: ['peer support', 'boundaries', 'emotional recovery', 'friendship'],
  Health: ['recovery', 'gentle', 'self-care', 'wellness'],
  Exercise: ['routine', 'wellness', 'stretch', 'movement'],
  Diet: ['routine', 'wellness', 'energy', 'recovery']
};

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

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function getUserKey(suffix) {
  const rawUser = localStorage.getItem('campushealth_user');
  const user = rawUser ? JSON.parse(rawUser) : null;
  return `${STORAGE_PREFIX}:${user?.id || 'guest'}:${suffix}`;
}

function getSessionUserKey(suffix) {
  const rawUser = localStorage.getItem('campushealth_user');
  const user = rawUser ? JSON.parse(rawUser) : null;
  return `${SESSION_CACHE_PREFIX}:${user?.id || 'guest'}:${suffix}`;
}

const sampleForumThreads = [
  {
    id: 'seed-thread-1',
    author: 'QuietComet',
    title: 'How do you handle burnout during exam week?',
    body: 'I feel like I am always behind whenever deadlines stack up. What actually helps you reset without losing momentum?',
    supportType: 'Burnout',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    isOwned: false,
    replies: [
      {
        id: 'seed-reply-1',
        author: 'KindRiver',
        body: 'I break the day into two must-do tasks and one rest block. It helps me feel less trapped.',
        createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
        isOwned: false
      },
      {
        id: 'seed-reply-2',
        author: 'NorthStar',
        body: 'A 10 minute walk between study sessions helps me stop spiraling when I am exhausted.',
        createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        isOwned: false
      }
    ]
  },
  {
    id: 'seed-thread-2',
    author: 'BlueNotebook',
    title: 'Looking for small routines that reduce anxiety',
    body: 'I have tried journaling on and off. Curious what tiny habits make the biggest difference for you.',
    supportType: 'Anxiety',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    isOwned: false,
    replies: [
      {
        id: 'seed-reply-3',
        author: 'SoftEcho',
        body: 'I keep a super short grounding list on my phone: water, breathing, one message to a friend, then one small task.',
        createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
        isOwned: false
      }
    ]
  },
  {
    id: 'seed-thread-3',
    author: 'SunnyInk',
    title: 'Anyone have calm bedtime routines that actually work?',
    body: 'My sleep has been inconsistent lately and my brain feels loud at night. I would love simple ideas that help you wind down.',
    supportType: 'Sleep',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    isOwned: false,
    replies: [
      {
        id: 'seed-reply-4',
        author: 'SlowRiver',
        body: 'Dim lights, no laptop in bed, and a short breathing video has helped me a lot more than trying to force sleep.',
        createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        isOwned: false
      }
    ]
  }
];

function getForumStorageKey() {
  return getUserKey('forum');
}

function getForumReportsKey() {
  return getUserKey('forum-reports');
}

function getForumAliasKey() {
  return getUserKey('forum-alias');
}

function buildRandomForumAlias() {
  const adjective = FORUM_ALIAS_ADJECTIVES[Math.floor(Math.random() * FORUM_ALIAS_ADJECTIVES.length)];
  const noun = FORUM_ALIAS_NOUNS[Math.floor(Math.random() * FORUM_ALIAS_NOUNS.length)];
  return `${adjective}${noun}`;
}

function normalizeForumAlias(alias) {
  return `${alias || ''}`.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
}

function normalizeForumThreads(threads = []) {
  return threads.map((thread) => ({
    ...thread,
    supportType: thread.supportType || 'General Support',
    isOwned: Boolean(thread.isOwned),
    replies: Array.isArray(thread.replies)
      ? thread.replies.map((reply) => ({
        ...reply,
        isOwned: Boolean(reply.isOwned)
      }))
      : []
  }));
}

function persistForumThreads(threads) {
  const normalized = normalizeForumThreads(threads);
  writeLocal(getForumStorageKey(), normalized);
  return normalized;
}

function buildMoodCacheKey(baseKey, params = {}) {
  const sortedEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right));

  return sortedEntries.length ? `${baseKey}:${JSON.stringify(sortedEntries)}` : baseKey;
}

function getResourceTimestamp(resource) {
  const value = resource?.createdAt ? new Date(resource.createdAt).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

function buildRecommendationText(resource = {}) {
  return [
    resource.title,
    resource.description,
    resource.content,
    resource.subCategory,
    resource.type,
    resource.category,
    ...(Array.isArray(resource.tags) ? resource.tags : [])
  ].join(' ').toLowerCase();
}

function countKeywordMatches(text, keywords = []) {
  return keywords.reduce((score, keyword) => (
    text.includes(`${keyword}`.toLowerCase()) ? score + 1 : score
  ), 0);
}

function buildMoodContext(stats) {
  const logs = Array.isArray(stats?.logs) ? [...stats.logs] : [];
  const moodDistribution = stats?.moodDistribution && typeof stats.moodDistribution === 'object'
    ? stats.moodDistribution
    : {};

  const latestMood = logs[logs.length - 1]?.mood || '';
  const frequentMood = Object.entries(moodDistribution)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] || '';

  const factorCounts = new Map();
  logs.forEach((log) => {
    (Array.isArray(log?.factors) ? log.factors : []).forEach((factor) => {
      if (factor) {
        factorCounts.set(factor, (factorCounts.get(factor) || 0) + 1);
      }
    });
  });

  const topFactors = [...factorCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([factor]) => factor);

  return {
    latestMood,
    frequentMood,
    topFactors
  };
}

function buildMoodKeywords(moodContext) {
  const keywordSet = new Set();

  [moodContext.latestMood, moodContext.frequentMood].forEach((mood) => {
    (MOOD_RESOURCE_KEYWORDS[mood] || []).forEach((keyword) => keywordSet.add(keyword));
  });

  (moodContext.topFactors || []).forEach((factor) => {
    (FACTOR_RESOURCE_KEYWORDS[factor] || []).forEach((keyword) => keywordSet.add(keyword));
  });

  return [...keywordSet];
}

function pickFallbackSuggestions(resources = [], limit = 4) {
  const groups = new Map();

  resources.forEach((resource) => {
    const typeKey = resource?.type || 'Other';
    if (!groups.has(typeKey)) {
      groups.set(typeKey, []);
    }
    groups.get(typeKey).push(resource);
  });

  groups.forEach((items) => {
    items.sort((left, right) => (
      Number(right?.views || 0) - Number(left?.views || 0)
      || getResourceTimestamp(right) - getResourceTimestamp(left)
    ));
  });

  const orderedTypes = [...groups.keys()].sort((left, right) => left.localeCompare(right));
  const selected = [];

  while (selected.length < limit) {
    let addedInRound = false;

    orderedTypes.forEach((type) => {
      const nextItem = groups.get(type)?.shift();
      if (nextItem && selected.length < limit) {
        selected.push(nextItem);
        addedInRound = true;
      }
    });

    if (!addedInRound) break;
  }

  return selected;
}

function readSessionCacheValue(cacheKey, fallback = null) {
  if (!canUseSessionStorage()) {
    return fallback;
  }

  try {
    const raw = window.sessionStorage.getItem(getSessionUserKey(cacheKey));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeSessionCacheValue(cacheKey, value) {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(getSessionUserKey(cacheKey), JSON.stringify(value));
  } catch {
    // Ignore transient cache write failures.
  }
}

function readFreshMoodCache(cacheKey, ttlMs) {
  const cached = readSessionCacheValue(cacheKey, null);
  if (!cached || typeof cached !== 'object') return null;
  if (typeof cached.timestamp !== 'number') return null;
  if (Date.now() - cached.timestamp > ttlMs) return null;
  return cached.data;
}

function writeMoodCache(cacheKey, data) {
  writeSessionCacheValue(cacheKey, {
    timestamp: Date.now(),
    data
  });
}

function invalidateMoodCaches() {
  requestCache.clear();

  if (!canUseSessionStorage()) {
    return;
  }

  try {
    const userPrefix = getSessionUserKey('');
    const keysToDelete = [];

    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key && key.startsWith(userPrefix) && key.includes('mood-')) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignore cache invalidation failures.
  }
}

function invalidateForumCaches() {
  requestCache.clear();

  if (!canUseSessionStorage()) {
    return;
  }

  try {
    const userPrefix = getSessionUserKey('');
    const keysToDelete = [];

    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key && key.startsWith(userPrefix) && key.includes('forum-')) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignore cache invalidation failures.
  }
}

function invalidateResourceCaches() {
  requestCache.clear();
  resourceDetailCache.clear();
  resourceDetailRequestCache.clear();

  if (!canUseSessionStorage()) {
    return;
  }

  try {
    const userPrefix = getSessionUserKey('');
    const keysToDelete = [];

    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key && key.startsWith(userPrefix) && key.includes('resource')) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignore cache invalidation failures.
  }
}

function emitForumUpdated(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('campushealth:forum-updated', { detail }));
  }
}

async function getOrFetchMoodData({ cacheKey, ttlMs, requestKey, forceRefresh = false, fetcher }) {
  if (!forceRefresh) {
    const cached = readFreshMoodCache(cacheKey, ttlMs);
    if (cached !== null) {
      return cached;
    }
  }

  if (requestCache.has(requestKey)) {
    return requestCache.get(requestKey);
  }

  const request = fetcher()
    .then((data) => {
      writeMoodCache(cacheKey, data);
      return data;
    })
    .finally(() => {
      requestCache.delete(requestKey);
    });

  requestCache.set(requestKey, request);
  return request;
}

export function getCachedMoodLogs(params = {}) {
  return readFreshMoodCache(
    buildMoodCacheKey(moodCacheConfig.logs.key, params),
    moodCacheConfig.logs.ttlMs
  );
}

export function getCachedMoodStats() {
  return readFreshMoodCache(moodCacheConfig.stats.key, moodCacheConfig.stats.ttlMs);
}

export function getCachedMentalHealthResources(params = {}) {
  return readFreshMoodCache(
    buildMoodCacheKey(moodCacheConfig.resources.key, params),
    moodCacheConfig.resources.ttlMs
  );
}

export function getCachedResources(params = {}) {
  return readFreshMoodCache(
    buildMoodCacheKey(moodCacheConfig.resourceCatalog.key, params),
    moodCacheConfig.resourceCatalog.ttlMs
  );
}

export function getCachedResourceRecommendations(resourceId) {
  if (!resourceId) return null;
  return readFreshMoodCache(
    buildMoodCacheKey(moodCacheConfig.resourceRecommendations.key, { resourceId }),
    moodCacheConfig.resourceRecommendations.ttlMs
  );
}

export function getCachedForumBootstrap() {
  return readFreshMoodCache(moodCacheConfig.forumBootstrap.key, moodCacheConfig.forumBootstrap.ttlMs);
}

export function getMoodLogs(params = {}, options = {}) {
  const cacheKey = buildMoodCacheKey(moodCacheConfig.logs.key, params);
  return getOrFetchMoodData({
    cacheKey,
    ttlMs: moodCacheConfig.logs.ttlMs,
    requestKey: `logs:${cacheKey}`,
    forceRefresh: options.forceRefresh,
    fetcher: () => apiFetch(`/mental-health/moods${buildQuery(params)}`)
  });
}

export function createMoodLog(payload) {
  return apiFetch('/mental-health/moods', {
    method: 'POST',
    body: JSON.stringify(payload)
  }).then((response) => {
    invalidateMoodCaches();
    return response;
  });
}

export function updateMoodLog(id, payload) {
  return apiFetch(`/mental-health/moods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }).then((response) => {
    invalidateMoodCaches();
    return response;
  });
}

export function deleteMoodLog(id) {
  return apiFetch(`/mental-health/moods/${id}`, {
    method: 'DELETE'
  }).then((response) => {
    invalidateMoodCaches();
    return response;
  });
}

export function getMoodStats(options = {}) {
  const cacheKey = moodCacheConfig.stats.key;
  return getOrFetchMoodData({
    cacheKey,
    ttlMs: moodCacheConfig.stats.ttlMs,
    requestKey: `stats:${cacheKey}`,
    forceRefresh: options.forceRefresh,
    fetcher: () => apiFetch('/mental-health/moods/stats')
  });
}

export function getMentalHealthResources(params = {}, options = {}) {
  const cacheKey = buildMoodCacheKey(moodCacheConfig.resources.key, params);
  return getOrFetchMoodData({
    cacheKey,
    ttlMs: moodCacheConfig.resources.ttlMs,
    requestKey: `resources:${cacheKey}`,
    forceRefresh: options.forceRefresh,
    fetcher: () => apiFetch(`/mental-health/resources${buildQuery(params)}`)
  });
}

export function getResources(params = {}) {
  const cacheKey = buildMoodCacheKey(moodCacheConfig.resourceCatalog.key, params);
  return getOrFetchMoodData({
    cacheKey,
    ttlMs: moodCacheConfig.resourceCatalog.ttlMs,
    requestKey: `resource-catalog:${cacheKey}`,
    fetcher: () => apiFetch(`/resources${buildQuery(params)}`)
  });
}

export function prefetchResources(params = {}) {
  return getResources(params).catch(() => null);
}

export function getManagedResources(params = {}) {
  return apiFetch(`/resources/manage/mine${buildQuery(params)}`);
}

export function getCachedResourceCollection(key, fallback = []) {
  if (!canUseSessionStorage()) {
    return fallback;
  }

  try {
    const raw = window.sessionStorage.getItem(getSessionUserKey(key));
    const parsed = raw ? JSON.parse(raw) : fallback;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function setCachedResourceCollection(key, resources) {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      getSessionUserKey(key),
      JSON.stringify(Array.isArray(resources) ? resources : [])
    );
  } catch {
    // Ignore transient cache write failures.
  }
}

export function primeResourceDetailCache(resource) {
  if (!resource?._id) return;
  resourceDetailCache.set(resource._id, resource);
}

export function getCachedResourceById(id) {
  if (!id) return null;
  return resourceDetailCache.get(id) || null;
}

export function prefetchResourceById(id) {
  if (!id) return Promise.resolve(null);

  if (resourceDetailCache.has(id)) {
    return Promise.resolve(resourceDetailCache.get(id));
  }

  if (resourceDetailRequestCache.has(id)) {
    return resourceDetailRequestCache.get(id);
  }

  const request = apiFetch(`/resources/${id}`)
    .then((resource) => {
      resourceDetailCache.set(id, resource);
      return resource;
    })
    .finally(() => {
      resourceDetailRequestCache.delete(id);
    });

  resourceDetailRequestCache.set(id, request);
  return request;
}

export function getResourceById(id) {
  return prefetchResourceById(id);
}

export function getResourceRecommendations(resourceId, options = {}) {
  const cacheKey = buildMoodCacheKey(moodCacheConfig.resourceRecommendations.key, { resourceId });
  return getOrFetchMoodData({
    cacheKey,
    ttlMs: moodCacheConfig.resourceRecommendations.ttlMs,
    requestKey: `resource-recommendations:${cacheKey}`,
    forceRefresh: options.forceRefresh,
    fetcher: () => apiFetch(`/resources/${resourceId}/recommendations`)
  });
}

export function prefetchResourceRecommendations(resourceId) {
  if (!resourceId) return Promise.resolve(null);
  return getResourceRecommendations(resourceId).catch(() => null);
}

export function createManagedResource(payload) {
  return apiFetch('/resources', {
    method: 'POST',
    body: JSON.stringify(payload)
  }).then((response) => {
    invalidateResourceCaches();
    return response;
  });
}

export function updateManagedResource(id, payload) {
  return apiFetch(`/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }).then((response) => {
    invalidateResourceCaches();
    return response;
  });
}

export function deleteManagedResource(id) {
  return apiFetch(`/resources/${id}`, {
    method: 'DELETE'
  }).then((response) => {
    invalidateResourceCaches();
    return response;
  });
}

export function getSavedResources() {
  return readLocal(getUserKey('saved-resources'), []);
}

export function toggleSavedResource(resource) {
  const key = getUserKey('saved-resources');
  const current = getSavedResources();
  const exists = current.some((entry) => entry._id === resource._id);
  const next = exists
    ? current.filter((entry) => entry._id !== resource._id)
    : [...current, resource];

  writeLocal(key, next);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('campushealth:saved-resources-updated', {
      detail: next
    }));
  }

  return next;
}

export function getPreferredCounselors() {
  return readLocal(getUserKey('preferred-counselors'), []);
}

export function togglePreferredCounselor(counselor) {
  const key = getUserKey('preferred-counselors');
  const current = getPreferredCounselors();
  const exists = current.some((entry) => entry._id === counselor._id);
  const next = exists
    ? current.filter((entry) => entry._id !== counselor._id)
    : [...current, counselor];

  writeLocal(key, next);
  return next;
}

export function getForumBootstrap(options = {}) {
  const cacheKey = moodCacheConfig.forumBootstrap.key;
  return getOrFetchMoodData({
    cacheKey,
    ttlMs: moodCacheConfig.forumBootstrap.ttlMs,
    requestKey: `forum:${cacheKey}`,
    forceRefresh: options.forceRefresh,
    fetcher: () => apiFetch('/mental-health/forum/bootstrap')
  });
}

export function prefetchForumBootstrap(options = {}) {
  return getForumBootstrap(options).catch(() => null);
}

export async function getForumThreads(options = {}) {
  const payload = await getForumBootstrap(options);
  return Array.isArray(payload?.threads) ? payload.threads : [];
}

export async function getForumAlias(options = {}) {
  const payload = await getForumBootstrap(options);
  return `${payload?.alias || ''}`.trim();
}

export async function setForumAlias(alias) {
  const response = await apiFetch('/mental-health/forum/alias', {
    method: 'PUT',
    body: JSON.stringify({ alias })
  });
  invalidateForumCaches();
  emitForumUpdated({ alias: response?.alias || '' });
  return `${response?.alias || ''}`.trim();
}

export async function refreshForumAlias() {
  const response = await apiFetch('/mental-health/forum/alias/refresh', {
    method: 'POST'
  });
  invalidateForumCaches();
  emitForumUpdated({ alias: response?.alias || '' });
  return `${response?.alias || ''}`.trim();
}

export async function createForumThread(payload) {
  const response = await apiFetch('/mental-health/forum/threads', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  invalidateForumCaches();
  emitForumUpdated({ type: 'thread-created', thread: response });
  return response;
}

export async function createForumReply(threadId, payload) {
  const response = await apiFetch(`/mental-health/forum/threads/${threadId}/replies`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  invalidateForumCaches();
  emitForumUpdated({ type: 'reply-created', threadId, reply: response });
  return response;
}

export async function updateForumThread(threadId, payload) {
  const response = await apiFetch(`/mental-health/forum/threads/${threadId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  invalidateForumCaches();
  emitForumUpdated({ type: 'thread-updated', thread: response });
  return response;
}

export async function deleteForumThread(threadId) {
  const response = await apiFetch(`/mental-health/forum/threads/${threadId}`, {
    method: 'DELETE'
  });
  invalidateForumCaches();
  emitForumUpdated({ type: 'thread-deleted', threadId });
  return response;
}

export async function updateForumReply(threadId, replyId, payload) {
  const response = await apiFetch(`/mental-health/forum/threads/${threadId}/replies/${replyId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  invalidateForumCaches();
  emitForumUpdated({ type: 'reply-updated', threadId, reply: response });
  return response;
}

export async function deleteForumReply(threadId, replyId) {
  const response = await apiFetch(`/mental-health/forum/threads/${threadId}/replies/${replyId}`, {
    method: 'DELETE'
  });
  invalidateForumCaches();
  emitForumUpdated({ type: 'reply-deleted', threadId, replyId });
  return response;
}

export async function getForumReports(options = {}) {
  const payload = await getForumBootstrap(options);
  return Number(payload?.reportCount || 0);
}

export async function reportForumContent(payload) {
  const response = await apiFetch('/mental-health/forum/reports', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  invalidateForumCaches();
  emitForumUpdated({ type: 'report-created', reportCount: Number(response?.reportCount || 0) });
  return {
    reportCount: Number(response?.reportCount || 0),
    message: response?.message || 'The content was reported for moderator review.'
  };
}

export function buildMoodSuggestions({ stats, resources = [] }) {
  const normalizedResources = Array.isArray(resources) ? resources.filter(Boolean) : [];
  if (!normalizedResources.length) return [];

  const moodContext = buildMoodContext(stats);
  const keywords = buildMoodKeywords(moodContext);

  if (!keywords.length) {
    return pickFallbackSuggestions(normalizedResources, 4);
  }

  const ranked = normalizedResources
    .map((resource) => {
      const searchableText = buildRecommendationText(resource);
      return {
        resource,
        keywordMatches: countKeywordMatches(searchableText, keywords),
        factorMatches: countKeywordMatches(
          searchableText,
          (moodContext.topFactors || []).map((factor) => factor.toLowerCase())
        ),
        views: Number(resource?.views || 0),
        createdAt: getResourceTimestamp(resource)
      };
    })
    .filter((entry) => entry.keywordMatches > 0 || entry.factorMatches > 0)
    .sort((left, right) => (
      right.keywordMatches - left.keywordMatches
      || right.factorMatches - left.factorMatches
      || right.views - left.views
      || right.createdAt - left.createdAt
    ))
    .map((entry) => entry.resource);

  if (ranked.length >= 4) {
    return ranked.slice(0, 4);
  }

  const usedIds = new Set(ranked.map((resource) => `${resource._id || resource.id || ''}`));
  const fallbackFill = pickFallbackSuggestions(
    normalizedResources.filter((resource) => !usedIds.has(`${resource._id || resource.id || ''}`)),
    4 - ranked.length
  );

  return [...ranked, ...fallbackFill];
}
