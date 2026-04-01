import { apiFetch } from './api';

const STORAGE_PREFIX = 'campushealth_mh';
const FORUM_ALIAS_ADJECTIVES = ['Quiet', 'Kind', 'Brave', 'Calm', 'Soft', 'Bright', 'Gentle', 'Steady', 'Silver', 'Sunny'];
const FORUM_ALIAS_NOUNS = ['Comet', 'River', 'Notebook', 'Lantern', 'Feather', 'Echo', 'Harbor', 'Sky', 'Willow', 'Star'];

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

function getUserKey(suffix) {
  const rawUser = localStorage.getItem('campushealth_user');
  const user = rawUser ? JSON.parse(rawUser) : null;
  return `${STORAGE_PREFIX}:${user?.id || 'guest'}:${suffix}`;
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

export function getMoodLogs(params = {}) {
  return apiFetch(`/mental-health/moods${buildQuery(params)}`);
}

export function createMoodLog(payload) {
  return apiFetch('/mental-health/moods', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateMoodLog(id, payload) {
  return apiFetch(`/mental-health/moods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function deleteMoodLog(id) {
  return apiFetch(`/mental-health/moods/${id}`, {
    method: 'DELETE'
  });
}

export function getMoodStats() {
  return apiFetch('/mental-health/moods/stats');
}

export function getMentalHealthResources(params = {}) {
  return apiFetch(`/mental-health/resources${buildQuery(params)}`);
}

export function getResources(params = {}) {
  return apiFetch(`/resources${buildQuery(params)}`);
}

export function getResourceById(id) {
  return apiFetch(`/resources/${id}`);
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

export function getForumThreads() {
  const current = readLocal(getForumStorageKey(), null);
  if (!Array.isArray(current) || current.length === 0) {
    return persistForumThreads(sampleForumThreads);
  }

  return normalizeForumThreads(current);
}

export function getForumAlias() {
  const current = normalizeForumAlias(readLocal(getForumAliasKey(), ''));
  if (current) return current;

  const next = buildRandomForumAlias();
  writeLocal(getForumAliasKey(), next);
  return next;
}

export function setForumAlias(alias) {
  const normalized = normalizeForumAlias(alias);
  const next = normalized || buildRandomForumAlias();
  writeLocal(getForumAliasKey(), next);
  return next;
}

export function refreshForumAlias() {
  const next = buildRandomForumAlias();
  writeLocal(getForumAliasKey(), next);
  return next;
}

export function createForumThread(payload) {
  const current = getForumThreads();
  const thread = {
    id: `thread-${Date.now()}`,
    author: payload.author || 'AnonymousStudent',
    title: payload.title.trim(),
    body: payload.body.trim(),
    supportType: payload.supportType || 'General Support',
    createdAt: new Date().toISOString(),
    updatedAt: null,
    isOwned: true,
    replies: []
  };
  persistForumThreads([thread, ...current]);
  return thread;
}

export function createForumReply(threadId, payload) {
  const current = getForumThreads();
  const next = current.map((thread) => {
    if (thread.id !== threadId) return thread;
    return {
      ...thread,
      replies: [
        ...thread.replies,
        {
          id: `reply-${Date.now()}`,
          author: payload.author || 'AnonymousPeer',
          body: payload.body.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: null,
          isOwned: true
        }
      ]
    };
  });
  persistForumThreads(next);
  return next.find((thread) => thread.id === threadId);
}

export function updateForumThread(threadId, payload) {
  const next = getForumThreads().map((thread) => (
    thread.id === threadId
      ? {
        ...thread,
        title: payload.title.trim(),
        body: payload.body.trim(),
        supportType: payload.supportType || thread.supportType,
        updatedAt: new Date().toISOString()
      }
      : thread
  ));

  persistForumThreads(next);
  return next.find((thread) => thread.id === threadId);
}

export function deleteForumThread(threadId) {
  const next = getForumThreads().filter((thread) => thread.id !== threadId);
  return persistForumThreads(next);
}

export function updateForumReply(threadId, replyId, payload) {
  const next = getForumThreads().map((thread) => {
    if (thread.id !== threadId) return thread;

    return {
      ...thread,
      replies: thread.replies.map((reply) => (
        reply.id === replyId
          ? {
            ...reply,
            body: payload.body.trim(),
            updatedAt: new Date().toISOString()
          }
          : reply
      ))
    };
  });

  persistForumThreads(next);
  return next.find((thread) => thread.id === threadId);
}

export function deleteForumReply(threadId, replyId) {
  const next = getForumThreads().map((thread) => {
    if (thread.id !== threadId) return thread;

    return {
      ...thread,
      replies: thread.replies.filter((reply) => reply.id !== replyId)
    };
  });

  persistForumThreads(next);
  return next.find((thread) => thread.id === threadId);
}

export function getForumReports() {
  return readLocal(getForumReportsKey(), []);
}

export function reportForumContent(payload) {
  const current = getForumReports();
  const next = [{
    id: `report-${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString()
  }, ...current];

  writeLocal(getForumReportsKey(), next);
  return next;
}

export function buildMoodSuggestions({ stats, resources = [] }) {
  const averageMood = Number(stats?.averageMood || 0);

  if (averageMood && averageMood < 4.5) {
    return resources.filter((resource) =>
      ['Mental Health', 'Wellness'].includes(resource.category)
    ).slice(0, 4);
  }

  return resources.slice(0, 4);
}
