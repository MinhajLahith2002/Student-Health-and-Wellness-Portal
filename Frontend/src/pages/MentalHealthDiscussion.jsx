import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Clock3, Edit3, Flag, MessageCircle, Plus, RefreshCw, Search, SendHorizontal, Shield, Trash2, X } from 'lucide-react';
import {
  createForumReply,
  createForumThread,
  deleteForumReply,
  deleteForumThread,
  getCachedForumBootstrap,
  getForumBootstrap,
  reportForumContent,
  refreshForumAlias,
  setForumAlias,
  updateForumReply,
  updateForumThread
} from '../lib/mentalHealth';

const SUPPORT_TYPES = ['All Topics', 'General Support', 'Anxiety', 'Burnout', 'Sleep', 'Motivation'];
const MIN_THREAD_TITLE = 3;
const MIN_THREAD_BODY = 10;
const MIN_REPLY_BODY = 2;
const MIN_ALIAS_LENGTH = 3;
const MAX_ALIAS_LENGTH = 24;
const POST_COOLDOWN_MS = 3000;
const THREAD_SAMPLES = [
  {
    label: 'Sample 1',
    supportType: 'Burnout',
    title: 'Feeling worn out during exam week',
    body: 'I have been studying for hours but still feel behind. If you have a simple reset routine that helps during burnout, I would really appreciate it.'
  },
  {
    label: 'Sample 2',
    supportType: 'Anxiety',
    title: 'Looking for ways to calm down before class',
    body: 'My mind starts racing right before lectures and presentations. What small habits or grounding tricks help you settle your thoughts quickly?'
  },
  {
    label: 'Sample 3',
    supportType: 'Sleep',
    title: 'Need ideas for a better sleep routine',
    body: 'My sleep has been inconsistent lately and it is making everything harder the next day. I would love simple bedtime ideas that actually work for students.'
  }
];
const SUPPORT_TYPE_STYLES = {
  'General Support': {
    badge: 'bg-sky-50 text-sky-700',
    iconWrap: 'bg-sky-50 text-sky-700'
  },
  Anxiety: {
    badge: 'bg-violet-50 text-violet-700',
    iconWrap: 'bg-violet-50 text-violet-700'
  },
  Burnout: {
    badge: 'bg-amber-50 text-amber-700',
    iconWrap: 'bg-amber-50 text-amber-700'
  },
  Sleep: {
    badge: 'bg-indigo-50 text-indigo-700',
    iconWrap: 'bg-indigo-50 text-indigo-700'
  },
  Motivation: {
    badge: 'bg-emerald-50 text-emerald-700',
    iconWrap: 'bg-emerald-50 text-emerald-700'
  }
};

function formatRelativeDate(value) {
  if (!value) return 'Just now';

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Just now';

  const diffMs = Math.abs(timestamp - Date.now());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) {
    const minutes = Math.round(diffMs / minute);
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  }
  if (diffMs < day) {
    const hours = Math.round(diffMs / hour);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.round(diffMs / day);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function validateAliasDraft(value) {
  const normalized = `${value || ''}`.trim();

  if (!normalized) return 'Alias is required.';
  if (!/^[a-zA-Z0-9]+$/.test(normalized)) return 'Use letters and numbers only.';
  if (normalized.length < MIN_ALIAS_LENGTH) return `Alias must be at least ${MIN_ALIAS_LENGTH} characters.`;
  if (normalized.length > MAX_ALIAS_LENGTH) return `Alias must stay within ${MAX_ALIAS_LENGTH} characters.`;
  return '';
}

function validateThreadTitle(value) {
  const normalized = `${value || ''}`.trim();
  if (!normalized) return 'Thread title is required.';
  if (normalized.length < MIN_THREAD_TITLE) return `Title must be at least ${MIN_THREAD_TITLE} characters.`;
  return '';
}

function validateThreadBody(value) {
  const normalized = `${value || ''}`.trim();
  if (!normalized) return 'Message is required.';
  if (normalized.length < MIN_THREAD_BODY) return `Message must be at least ${MIN_THREAD_BODY} characters.`;
  return '';
}

function validateReplyBody(value) {
  const normalized = `${value || ''}`.trim();
  if (!normalized) return 'Reply is required.';
  if (normalized.length < MIN_REPLY_BODY) return `Reply must be at least ${MIN_REPLY_BODY} characters.`;
  return '';
}

function validateSearchQuery(value) {
  const normalized = `${value || ''}`;
  const trimmed = normalized.trim();

  if (!trimmed) return '';
  if (trimmed.length < 2) return 'Search needs at least 2 characters.';
  if (!/^[a-zA-Z0-9\s\-&']+$/.test(trimmed)) {
    return 'Use letters, numbers, spaces, hyphens, apostrophes, or & only.';
  }

  return '';
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="apple-card p-6 border-none bg-white/70 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-2">{label}</p>
      <p className="text-3xl font-semibold text-primary-text">{value}</p>
      <p className="text-sm text-secondary-text mt-3">{hint}</p>
    </div>
  );
}


export default function MentalHealthDiscussion() {
  const cachedForumBootstrap = getCachedForumBootstrap();
  const [threads, setThreads] = useState(() => (
    Array.isArray(cachedForumBootstrap?.threads) ? cachedForumBootstrap.threads : []
  ));
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [supportType, setSupportType] = useState('General Support');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [editingThreadId, setEditingThreadId] = useState('');
  const [threadEditDraft, setThreadEditDraft] = useState({ title: '', body: '', supportType: 'General Support' });
  const [editingReplyId, setEditingReplyId] = useState('');
  const [replyEditDraft, setReplyEditDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Topics');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [reportCount, setReportCount] = useState(() => Number(cachedForumBootstrap?.reportCount || 0));
  const [forumAlias, setForumAliasState] = useState(() => `${cachedForumBootstrap?.alias || ''}`.trim());
  const [aliasDraft, setAliasDraft] = useState(() => `${cachedForumBootstrap?.alias || ''}`.trim());
  const [isLoading, setIsLoading] = useState(() => !cachedForumBootstrap);
  const [fieldTouched, setFieldTouched] = useState({
    alias: false,
    title: false,
    body: false
  });
  const [replyTouched, setReplyTouched] = useState({});
  const [searchTouched, setSearchTouched] = useState(false);
  const [replyErrors, setReplyErrors] = useState({});
  const [isSubmittingThread, setIsSubmittingThread] = useState(false);
  const [isThreadCoolingDown, setIsThreadCoolingDown] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState({});
  const [replyCoolingDown, setReplyCoolingDown] = useState({});
  const displayAlias = forumAlias || 'QuietComet';

  const sortedThreads = useMemo(
    () => [...threads].sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt)),
    [threads]
  );

  const filteredThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sortedThreads.filter((thread) => {
      const matchesSearch = !query
        || thread.title.toLowerCase().includes(query)
        || thread.body.toLowerCase().includes(query)
        || thread.author.toLowerCase().includes(query);
      const matchesFilter = activeFilter === 'All Topics' || thread.supportType === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, searchQuery, sortedThreads]);

  const totalReplies = useMemo(
    () => threads.reduce((count, thread) => count + thread.replies.length, 0),
    [threads]
  );
  const ownedThreads = threads.filter((thread) => thread.isOwned).length;
  const hasActiveFilters = searchQuery.trim().length > 0 || activeFilter !== 'All Topics';
  const aliasError = fieldTouched.alias ? validateAliasDraft(aliasDraft) : '';
  const titleError = fieldTouched.title ? validateThreadTitle(title) : '';
  const bodyError = fieldTouched.body ? validateThreadBody(body) : '';
  const searchError = searchTouched ? validateSearchQuery(searchQuery) : '';
  const canSaveAlias = !validateAliasDraft(aliasDraft);
  const canPostThread = !validateThreadTitle(title) && !validateThreadBody(body) && !isSubmittingThread && !isThreadCoolingDown;

  useEffect(() => {
    let active = true;

    const loadForum = async ({ forceRefresh = false, showLoader = false } = {}) => {
      if (showLoader && active) {
        setIsLoading(true);
      }

      try {
        const payload = await getForumBootstrap({ forceRefresh });
        if (!active) return;

        const nextThreads = Array.isArray(payload?.threads) ? payload.threads : [];
        const nextAlias = `${payload?.alias || ''}`.trim();
        setThreads(nextThreads);
        setReportCount(Number(payload?.reportCount || 0));
        setForumAliasState(nextAlias);
        setAliasDraft(nextAlias);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load the peer support forum');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadForum({ forceRefresh: false, showLoader: true });

    const handleForumUpdated = () => {
      loadForum();
    };

    window.addEventListener('campushealth:forum-updated', handleForumUpdated);

    return () => {
      active = false;
      window.removeEventListener('campushealth:forum-updated', handleForumUpdated);
    };
  }, []);

  function resetComposer() {
    setTitle('');
    setBody('');
    setSupportType('General Support');
    setFieldTouched((current) => ({ ...current, title: false, body: false }));
    setError('');
  }

  function applyThreadSample(sample) {
    setTitle(sample.title);
    setBody(sample.body);
    setSupportType(sample.supportType);
    setFieldTouched((current) => ({ ...current, title: true, body: true }));
    setError('');
    setStatusMessage(`Loaded ${sample.label.toLowerCase()} into the thread form.`);
  }

  async function handleCreateThread(event) {
    event.preventDefault();

    if (isSubmittingThread || isThreadCoolingDown) {
      setStatusMessage('');
      setError('Please wait a moment before posting again.');
      return;
    }

    const nextTitleError = validateThreadTitle(title);
    const nextBodyError = validateThreadBody(body);

    if (nextTitleError || nextBodyError) {
      setFieldTouched((current) => ({ ...current, title: true, body: true }));
      setStatusMessage('');
      return;
    }

    try {
      setIsSubmittingThread(true);
      const thread = await createForumThread({ title, body, supportType });
      setThreads((current) => [thread, ...current.filter((entry) => entry.id !== thread.id)]);
      resetComposer();
      setError('');
      setStatusMessage('Your anonymous thread was posted. You can start another one right away.');
      setIsThreadCoolingDown(true);
      window.setTimeout(() => setIsThreadCoolingDown(false), POST_COOLDOWN_MS);
    } catch (err) {
      setStatusMessage('');
      setError(err.message || 'Failed to post your thread.');
    } finally {
      setIsSubmittingThread(false);
    }
  }

  async function handleReply(threadId) {
    if (replySubmitting[threadId] || replyCoolingDown[threadId]) {
      setReplyTouched((current) => ({ ...current, [threadId]: true }));
      setReplyErrors((current) => ({ ...current, [threadId]: 'Please wait a moment before posting again.' }));
      setStatusMessage('');
      return;
    }

    const draft = replyDrafts[threadId] || '';
    const nextReplyError = validateReplyBody(draft);

    if (nextReplyError) {
      setReplyTouched((current) => ({ ...current, [threadId]: true }));
      setReplyErrors((current) => ({ ...current, [threadId]: nextReplyError }));
      setStatusMessage('');
      return;
    }

    try {
      setReplySubmitting((current) => ({ ...current, [threadId]: true }));
      const reply = await createForumReply(threadId, { body: draft });
      const now = new Date().toISOString();
      setThreads((current) => current.map((thread) => (
        thread.id === threadId
          ? { ...thread, replies: [...thread.replies, reply], updatedAt: now }
          : thread
      )));
      setReplyDrafts((current) => ({ ...current, [threadId]: '' }));
      setReplyTouched((current) => ({ ...current, [threadId]: false }));
      setReplyErrors((current) => ({ ...current, [threadId]: '' }));
      setError('');
      setStatusMessage('Reply posted successfully.');
      setReplyCoolingDown((current) => ({ ...current, [threadId]: true }));
      window.setTimeout(() => {
        setReplyCoolingDown((current) => ({ ...current, [threadId]: false }));
      }, POST_COOLDOWN_MS);
    } catch (err) {
      setStatusMessage('');
      setReplyTouched((current) => ({ ...current, [threadId]: true }));
      setReplyErrors((current) => ({ ...current, [threadId]: err.message || 'Failed to post your reply.' }));
    } finally {
      setReplySubmitting((current) => ({ ...current, [threadId]: false }));
    }
  }

  function startThreadEdit(thread) {
    setEditingThreadId(thread.id);
    setThreadEditDraft({
      title: thread.title,
      body: thread.body,
      supportType: thread.supportType || 'General Support'
    });
  }

  async function saveThreadEdit(threadId) {
    if (threadEditDraft.title.trim().length < MIN_THREAD_TITLE || threadEditDraft.body.trim().length < MIN_THREAD_BODY) {
      setStatusMessage('');
      setError(`Edited threads still need at least ${MIN_THREAD_TITLE} characters for the title and ${MIN_THREAD_BODY} characters for the message.`);
      return;
    }

    try {
      const updatedThread = await updateForumThread(threadId, threadEditDraft);
      setThreads((current) => current.map((thread) => (thread.id === threadId ? updatedThread : thread)));
      setEditingThreadId('');
      setError('');
      setStatusMessage('Thread updated successfully.');
    } catch (err) {
      setStatusMessage('');
      setError(err.message || 'Failed to update your thread.');
    }
  }

  async function removeThread(threadId) {
    try {
      await deleteForumThread(threadId);
      setThreads((current) => current.filter((thread) => thread.id !== threadId));
      setError('');
      setStatusMessage('Thread removed.');
    } catch (err) {
      setStatusMessage('');
      setError(err.message || 'Failed to remove your thread.');
    }
  }

  function startReplyEdit(reply) {
    setEditingReplyId(reply.id);
    setReplyEditDraft(reply.body);
  }

  async function saveReplyEdit(threadId, replyId) {
    if (replyEditDraft.trim().length < MIN_REPLY_BODY) {
      setStatusMessage('');
      setError(`Edited replies should still contain at least ${MIN_REPLY_BODY} characters.`);
      return;
    }

    try {
      const updatedReply = await updateForumReply(threadId, replyId, { body: replyEditDraft });
      setThreads((current) => current.map((thread) => (
        thread.id === threadId
          ? {
            ...thread,
            updatedAt: new Date().toISOString(),
            replies: thread.replies.map((reply) => (reply.id === replyId ? updatedReply : reply))
          }
          : thread
      )));
      setEditingReplyId('');
      setReplyEditDraft('');
      setError('');
      setStatusMessage('Reply updated successfully.');
    } catch (err) {
      setStatusMessage('');
      setError(err.message || 'Failed to update your reply.');
    }
  }

  async function removeReply(threadId, replyId) {
    try {
      await deleteForumReply(threadId, replyId);
      setThreads((current) => current.map((thread) => (
        thread.id === threadId
          ? {
            ...thread,
            updatedAt: new Date().toISOString(),
            replies: thread.replies.filter((reply) => reply.id !== replyId)
          }
          : thread
      )));
      setError('');
      setStatusMessage('Reply removed.');
    } catch (err) {
      setStatusMessage('');
      setError(err.message || 'Failed to remove your reply.');
    }
  }

  async function handleReport(payload) {
    try {
      const response = await reportForumContent(payload);
      setReportCount(Number(response?.reportCount || 0));
      setError('');
      setStatusMessage(response?.message || 'The content was reported for moderator review.');
    } catch (err) {
      setStatusMessage('');
      setError(err.message || 'Failed to report this content.');
    }
  }

  async function handleRefreshAlias() {
    try {
      const next = await refreshForumAlias();
      setForumAliasState(next);
      setAliasDraft(next);
      setFieldTouched((current) => ({ ...current, alias: false }));
      setError('');
      setStatusMessage('Anonymous alias refreshed.');
    } catch (err) {
      setStatusMessage('');
      setError(err.message || 'Failed to refresh your alias.');
    }
  }

  async function handleSaveAlias() {
    const nextAliasError = validateAliasDraft(aliasDraft);
    if (nextAliasError) {
      setFieldTouched((current) => ({ ...current, alias: true }));
      setStatusMessage('');
      return;
    }

    try {
      const next = await setForumAlias(aliasDraft);
      setForumAliasState(next);
      setAliasDraft(next);
      setFieldTouched((current) => ({ ...current, alias: false }));
      setError('');
      setStatusMessage('Anonymous alias updated.');
    } catch (err) {
      setStatusMessage('');
      setError(err.message || 'Failed to update your alias.');
    }
  }

  return (
    <div className="pt-36 pb-12 px-6 max-w-7xl mx-auto min-h-screen bg-primary-bg">
      <header className="mb-12">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-purple/10 text-accent-purple text-[10px] font-bold uppercase tracking-widest">
              <MessageCircle className="w-3 h-3" />
              Anonymous Peer Support
            </div>
            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-primary-text">Peer Support Forum</h1>
            <p className="mt-4 max-w-3xl text-lg text-secondary-text">
              Post anonymously, reply gently, edit your own messages, and keep the conversation grounded in supportive campus wellness care.
            </p>
          </div>

          <Link
            to="/mental-health"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/85 px-5 py-3 text-sm font-semibold text-primary-text shadow-[0_18px_40px_rgba(15,41,66,0.08)] backdrop-blur-sm lg:w-auto lg:shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to mental health
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <SummaryCard label="Active Threads" value={threads.length} hint="Seeded with sample peer-support discussions" />
        <SummaryCard label="Replies Shared" value={totalReplies} hint="Supportive responses visible in the thread feed" />
        <SummaryCard label="Your Posts" value={ownedThreads} hint={`Threads you can edit or remove anytime • ${reportCount} reports filed`} />
      </section>

      <section className="mb-10">
        <div className="apple-card border-none bg-white/70 p-6 backdrop-blur-sm mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Forum care rules</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-primary-text">Keep the space safe</h2>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] bg-violet-50 text-violet-600">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.3rem] bg-secondary-bg/80 px-4 py-4">
              <p className="text-sm font-semibold text-primary-text">Reply gently</p>
              <p className="mt-2 text-sm leading-6 text-secondary-text">Encourage, support, and avoid harsh or dismissive responses.</p>
            </div>
            <div className="rounded-[1.3rem] bg-secondary-bg/80 px-4 py-4">
              <p className="text-sm font-semibold text-primary-text">Skip identifying details</p>
              <p className="mt-2 text-sm leading-6 text-secondary-text">Do not share names, locations, contact info, or anything that exposes you or others.</p>
            </div>
            <div className="rounded-[1.3rem] bg-secondary-bg/80 px-4 py-4">
              <p className="text-sm font-semibold text-primary-text">Use urgent help for crises</p>
              <p className="mt-2 text-sm leading-6 text-secondary-text">The forum is not for immediate danger or crisis response. Use emergency support instead.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-8">
        <aside className="space-y-6">
          <div className="apple-card h-fit border-none bg-white/70 p-8 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Posting space</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-accent-purple/10 text-accent-purple">
                    <Plus className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-primary-text">Start a thread</h2>
                </div>
                <p className="mt-4 text-sm leading-6 text-secondary-text">
                  Ask for peer support, share a hard moment, or open a calm conversation without exposing your identity.
                </p>
              </div>
              <span className="inline-flex rounded-full bg-accent-purple/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-accent-purple">
                Anonymous
              </span>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.94)_0%,rgba(255,255,255,1)_100%)] p-5 shadow-[0_14px_28px_rgba(15,41,66,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Posting as</p>
                  <p className="mt-3 text-lg font-semibold text-primary-text">{displayAlias}</p>
                  <p className="mt-2 text-sm leading-6 text-secondary-text">
                    Change your alias any time to keep your forum identity private and low-pressure.
                  </p>
                </div>
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-violet-50 text-violet-600">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={aliasDraft}
                  onChange={(event) => {
                    setAliasDraft(event.target.value);
                    setFieldTouched((current) => ({ ...current, alias: true }));
                    setError('');
                    setStatusMessage('');
                  }}
                  className={`w-full rounded-2xl bg-white px-4 py-3 outline-none ring-1 ${aliasError ? 'ring-red-300' : 'ring-slate-100'}`}
                  placeholder="Change anonymous alias"
                />
                {aliasError ? (
                  <p className="text-sm text-red-600">{aliasError}</p>
                ) : (
                  <p className="text-xs text-secondary-text">Use 3-24 letters or numbers only.</p>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSaveAlias}
                    disabled={!canSaveAlias}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-white px-4 py-3 font-bold text-primary-text ring-1 ring-slate-100 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    Save alias
                  </button>
                  <button
                    type="button"
                    onClick={handleRefreshAlias}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent-purple px-4 py-3 font-bold text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh alias
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateThread} className="mt-6 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Quick samples</p>
                  {THREAD_SAMPLES.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => applyThreadSample(sample)}
                      className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-secondary-text">
                  Tap a sample to fill the thread title, support topic, and message instantly.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Thread title</p>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setFieldTouched((current) => ({ ...current, title: true }));
                    setError('');
                    setStatusMessage('');
                  }}
                  className={`mt-3 w-full rounded-2xl bg-secondary-bg px-5 py-4 outline-none ring-1 ${titleError ? 'ring-red-300' : 'ring-transparent'}`}
                  placeholder="What kind of support are you looking for?"
                />
                {titleError ? (
                  <p className="mt-2 text-sm text-red-600">{titleError}</p>
                ) : (
                  <p className="mt-2 text-xs text-secondary-text">
                    Title: {title.trim().length}/{MIN_THREAD_TITLE} minimum characters
                  </p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Support topic</p>
                <select
                  value={supportType}
                  onChange={(event) => {
                    setSupportType(event.target.value);
                    setError('');
                    setStatusMessage('');
                  }}
                  className="mt-3 w-full rounded-2xl bg-secondary-bg px-5 py-4 outline-none"
                >
                  {SUPPORT_TYPES.filter((option) => option !== 'All Topics').map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Your message</p>
                <textarea
                  rows={6}
                  value={body}
                  onChange={(event) => {
                    setBody(event.target.value);
                    setFieldTouched((current) => ({ ...current, body: true }));
                    setError('');
                    setStatusMessage('');
                  }}
                  className={`mt-3 w-full resize-none rounded-2xl bg-secondary-bg px-5 py-4 outline-none ring-1 ${bodyError ? 'ring-red-300' : 'ring-transparent'}`}
                  placeholder="Share what you are feeling, what feels stuck, or what kind of support would help today."
                />
                {bodyError ? (
                  <p className="mt-2 text-sm text-red-600">{bodyError}</p>
                ) : (
                  <p className="mt-2 text-xs text-secondary-text">
                    Message: {body.trim().length}/{MIN_THREAD_BODY} minimum characters
                  </p>
                )}
              </div>

              <div className="rounded-[1.4rem] bg-violet-50/70 px-4 py-4 text-sm leading-6 text-secondary-text">
                Keep it safe: skip names, phone numbers, room details, or urgent crisis situations. Use emergency support instead for immediate danger.
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {statusMessage && <p className="text-sm text-emerald-600">{statusMessage}</p>}
              <button
                type="submit"
                disabled={!canPostThread}
                className="w-full rounded-2xl bg-accent-purple py-4 font-bold text-white shadow-[0_18px_36px_rgba(124,58,237,0.2)] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSubmittingThread ? 'Posting...' : isThreadCoolingDown ? 'Please wait...' : 'Post Anonymously'}
              </button>
              {isThreadCoolingDown && !error && (
                <p className="text-xs text-secondary-text">Short posting pause active to prevent duplicate threads.</p>
              )}
            </form>
          </div>

          <div className="apple-card border-none bg-white/70 p-6 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Topic filters</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-primary-text">Find the right conversation</h2>
              </div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] bg-sky-50 text-sky-700">
                <Search className="h-4 w-4" />
              </div>
            </div>
            <div className="relative mt-5">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-text" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchTouched(true);
                }}
                className={`w-full rounded-2xl bg-secondary-bg py-4 pl-11 pr-4 outline-none ring-1 ${
                  searchError ? 'ring-red-300' : 'ring-transparent'
                }`}
                placeholder="Search titles, messages, or aliases like stress-relief"
              />
            </div>
            {searchError ? (
              <p className="mt-2 text-sm text-red-600">{searchError}</p>
            ) : (
              <p className="mt-2 text-xs text-secondary-text">Try searches like `stress-relief`, `exam anxiety`, or `QuietComet`.</p>
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-secondary-text">
                {filteredThreads.length} conversation{filteredThreads.length === 1 ? '' : 's'} showing
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchTouched(false);
                    setActiveFilter('All Topics');
                  }}
                  className="text-xs font-semibold text-accent-primary"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUPPORT_TYPES.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setActiveFilter(topic)}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    activeFilter === topic ? 'bg-accent-primary text-white shadow-[0_12px_24px_rgba(15,41,66,0.1)]' : 'bg-secondary-bg text-secondary-text'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="apple-card border-none bg-white/70 p-6 backdrop-blur-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Conversation flow</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary-text">Support threads that stay easy to scan</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary-text">
                  {hasActiveFilters
                    ? 'Your filter is narrowing the forum to the most relevant conversations right now.'
                    : 'Newest activity rises to the top so students can quickly continue the most active support conversations.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">Showing</p>
                  <p className="mt-2 text-xl font-semibold text-primary-text">{filteredThreads.length}</p>
                </div>
                <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">Posting as</p>
                  <p className="mt-2 text-base font-semibold text-primary-text">{displayAlias}</p>
                </div>
                <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">Reports filed</p>
                  <p className="mt-2 text-xl font-semibold text-primary-text">{reportCount}</p>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm text-secondary-text">
              Loading forum conversations...
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm text-secondary-text">
              No threads match this search yet.
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <article key={thread.id} className="apple-card flex max-h-[58rem] flex-col overflow-hidden border-none bg-white/75 backdrop-blur-sm">
                <div className="border-b border-slate-100/80 p-7">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] ${SUPPORT_TYPE_STYLES[thread.supportType]?.iconWrap || 'bg-accent-purple/10 text-accent-purple'}`}>
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2.5">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${SUPPORT_TYPE_STYLES[thread.supportType]?.badge || 'bg-accent-purple/10 text-accent-purple'}`}>
                            {thread.supportType}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">
                            {thread.replies.length} repl{thread.replies.length === 1 ? 'y' : 'ies'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatRelativeDate(thread.updatedAt || thread.createdAt)}
                          </span>
                          {thread.isOwned && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                              Your thread
                            </span>
                          )}
                        </div>

                        {editingThreadId === thread.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={threadEditDraft.title}
                              onChange={(event) => setThreadEditDraft((current) => ({ ...current, title: event.target.value }))}
                              className="w-full rounded-2xl bg-secondary-bg px-5 py-4 outline-none"
                            />
                            <select
                              value={threadEditDraft.supportType}
                              onChange={(event) => setThreadEditDraft((current) => ({ ...current, supportType: event.target.value }))}
                              className="w-full rounded-2xl bg-secondary-bg px-5 py-4 outline-none"
                            >
                              {SUPPORT_TYPES.filter((option) => option !== 'All Topics').map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                            <textarea
                              rows={5}
                              value={threadEditDraft.body}
                              onChange={(event) => setThreadEditDraft((current) => ({ ...current, body: event.target.value }))}
                              className="w-full resize-none rounded-2xl bg-secondary-bg px-5 py-4 outline-none"
                            />
                          </div>
                        ) : (
                          <>
                            <h2 className="text-[1.9rem] leading-tight font-semibold tracking-tight text-primary-text">{thread.title}</h2>
                            <p className="mt-2 text-sm text-secondary-text">
                              Shared by <span className="font-semibold text-primary-text">{thread.author}</span> • {new Date(thread.createdAt).toLocaleString()}
                              {thread.updatedAt ? ' • edited' : ''}
                            </p>
                            <p className="mt-4 max-w-3xl text-[15px] leading-8 text-primary-text/80">{thread.body}</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:max-w-[17rem] xl:justify-end">
                      {thread.isOwned ? (
                        editingThreadId === thread.id ? (
                          <>
                            <button type="button" onClick={() => saveThreadEdit(thread.id)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                              <Check className="h-4 w-4" />
                              Save changes
                            </button>
                            <button type="button" onClick={() => setEditingThreadId('')} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-secondary-text">
                              <X className="h-4 w-4" />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => startThreadEdit(thread)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-primary-text">
                              <Edit3 className="h-4 w-4" />
                              Edit thread
                            </button>
                            <button type="button" onClick={() => removeThread(thread.id)} className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReport({ targetType: 'thread', targetId: thread.id, reason: 'Student requested moderator review' })}
                          className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700"
                        >
                          <Flag className="h-4 w-4" />
                          Report thread
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    <div className="rounded-[1.35rem] bg-slate-50 px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">Started by</p>
                      <p className="mt-2 text-sm font-semibold text-primary-text">{thread.author}</p>
                    </div>
                    <div className="rounded-[1.35rem] bg-slate-50 px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">Latest activity</p>
                      <p className="mt-2 text-sm font-semibold text-primary-text">{formatRelativeDate(thread.updatedAt || thread.createdAt)}</p>
                    </div>
                    <div className="rounded-[1.35rem] bg-slate-50 px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">Support lane</p>
                      <p className="mt-2 text-sm font-semibold text-primary-text">{thread.supportType}</p>
                    </div>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col bg-slate-50/80 px-7 py-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Support replies</p>
                      <h3 className="mt-2 text-lg font-semibold text-primary-text">Keep the conversation gentle and useful</h3>
                    </div>
                    <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-secondary-text shadow-[0_10px_22px_rgba(15,41,66,0.06)]">
                      {thread.replies.length} shared response{thread.replies.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="mt-5 min-h-0 flex-1 overflow-hidden rounded-[1.8rem] border border-slate-100 bg-white shadow-[0_16px_32px_rgba(15,41,66,0.04)]">
                    <div className="flex h-full min-h-0 flex-col">
                      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                        <div className="space-y-3">
                          {thread.replies.length === 0 && (
                            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white px-5 py-5 text-sm leading-6 text-secondary-text">
                              No replies yet. A short supportive message can make this thread feel less lonely.
                            </div>
                          )}

                          {thread.replies.map((reply) => (
                            <div key={reply.id} className="rounded-[1.5rem] border border-slate-100 bg-white px-5 py-5 shadow-[0_12px_26px_rgba(15,41,66,0.04)]">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex min-w-0 flex-1 gap-4">
                                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-accent-purple/10 text-accent-purple">
                                    <span className="text-sm font-bold uppercase">{reply.author?.slice(0, 1) || 'A'}</span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold text-primary-text">{reply.author}</p>
                                      <span className="text-xs text-secondary-text">{formatRelativeDate(reply.updatedAt || reply.createdAt)}</span>
                                      {reply.isOwned && (
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                                          Your reply
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1 text-xs text-secondary-text">
                                      {new Date(reply.createdAt).toLocaleString()}
                                      {reply.updatedAt ? ' • edited' : ''}
                                    </p>
                                    {editingReplyId === reply.id ? (
                                      <textarea
                                        rows={3}
                                        value={replyEditDraft}
                                        onChange={(event) => setReplyEditDraft(event.target.value)}
                                        className="mt-3 w-full resize-none rounded-2xl bg-secondary-bg px-4 py-3 outline-none"
                                      />
                                    ) : (
                                      <p className="mt-3 text-sm leading-7 text-primary-text/80">{reply.body}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 lg:max-w-[16rem] lg:justify-end">
                                  {reply.isOwned ? (
                                    editingReplyId === reply.id ? (
                                      <>
                                        <button type="button" onClick={() => saveReplyEdit(thread.id, reply.id)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                                          <Check className="h-4 w-4" />
                                          Save
                                        </button>
                                        <button type="button" onClick={() => { setEditingReplyId(''); setReplyEditDraft(''); }} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-secondary-text">
                                          <X className="h-4 w-4" />
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button type="button" onClick={() => startReplyEdit(reply)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-primary-text">
                                          <Edit3 className="h-4 w-4" />
                                          Edit
                                        </button>
                                        <button type="button" onClick={() => removeReply(thread.id, reply.id)} className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                                          <Trash2 className="h-4 w-4" />
                                          Delete
                                        </button>
                                      </>
                                    )
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleReport({ targetType: 'reply', targetId: reply.id, parentThreadId: thread.id, reason: 'Student requested moderator review' })}
                                      className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700"
                                    >
                                      <Flag className="h-4 w-4" />
                                      Report reply
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 border-t border-slate-100 bg-white/95 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Add a reply</p>
                            <p className="mt-2 text-sm leading-6 text-secondary-text">
                              Reply as <span className="font-semibold text-primary-text">{displayAlias}</span> and keep it calm, short, and supportive.
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-text">
                            {(replyDrafts[thread.id] || '').trim().length}/{MIN_REPLY_BODY}+
                          </span>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <input
                            type="text"
                            value={replyDrafts[thread.id] || ''}
                            onChange={(event) => {
                              setReplyDrafts((current) => ({ ...current, [thread.id]: event.target.value }));
                              setReplyTouched((current) => ({ ...current, [thread.id]: true }));
                              setReplyErrors((current) => ({ ...current, [thread.id]: '' }));
                            }}
                            className={`flex-1 rounded-2xl bg-secondary-bg px-5 py-4 outline-none ring-1 ${
                              replyErrors[thread.id] || (replyTouched[thread.id] && validateReplyBody(replyDrafts[thread.id] || '')) ? 'ring-red-300' : 'ring-transparent'
                            }`}
                            placeholder={`Reply as ${displayAlias}...`}
                          />
                          <button
                            type="button"
                            onClick={() => handleReply(thread.id)}
                            disabled={(replyDrafts[thread.id] || '').trim().length < MIN_REPLY_BODY || replySubmitting[thread.id] || replyCoolingDown[thread.id]}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent-primary px-5 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            <SendHorizontal className="h-4 w-4" />
                            {replySubmitting[thread.id] ? 'Sharing...' : replyCoolingDown[thread.id] ? 'Please wait...' : 'Share reply'}
                          </button>
                        </div>
                        {replyErrors[thread.id] ? (
                          <p className="mt-2 text-sm text-red-600">{replyErrors[thread.id]}</p>
                        ) : replyTouched[thread.id] && validateReplyBody(replyDrafts[thread.id] || '') ? (
                          <p className="mt-2 text-sm text-red-600">{validateReplyBody(replyDrafts[thread.id] || '')}</p>
                        ) : null}
                        {replyCoolingDown[thread.id] && !replyErrors[thread.id] && (
                          <p className="mt-2 text-xs text-secondary-text">Short posting pause active to prevent duplicate replies.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
