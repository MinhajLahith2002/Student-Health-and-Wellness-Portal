import { useMemo, useState } from 'react';
import { Check, Edit3, MessageCircle, Plus, RefreshCw, Search, Shield, Trash2, X } from 'lucide-react';
import {
  createForumReply,
  createForumThread,
  deleteForumReply,
  deleteForumThread,
  getForumAlias,
  getForumReports,
  getForumThreads,
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
  const [threads, setThreads] = useState(() => getForumThreads());
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
  const [reportCount, setReportCount] = useState(() => getForumReports().length);
  const [forumAlias, setForumAliasState] = useState(() => getForumAlias());
  const [aliasDraft, setAliasDraft] = useState(() => getForumAlias());

  const sortedThreads = useMemo(
    () => [...threads].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
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

  function resetComposer() {
    setTitle('');
    setBody('');
    setSupportType('General Support');
  }

  function handleCreateThread(event) {
    event.preventDefault();
    if (title.trim().length < MIN_THREAD_TITLE || body.trim().length < MIN_THREAD_BODY) {
      setStatusMessage('');
      setError(`Please use at least ${MIN_THREAD_TITLE} characters for the title and ${MIN_THREAD_BODY} characters for the message.`);
      return;
    }

    createForumThread({ title, body, supportType, author: forumAlias });
    setThreads(getForumThreads());
    resetComposer();
    setError('');
    setStatusMessage('Your anonymous thread was posted. You can start another one right away.');
  }

  function handleReply(threadId) {
    const draft = replyDrafts[threadId] || '';
    if (draft.trim().length < MIN_REPLY_BODY) {
      setStatusMessage('');
      setError(`Replies should include at least ${MIN_REPLY_BODY} characters.`);
      return;
    }

    createForumReply(threadId, { body: draft, author: forumAlias });
    setThreads(getForumThreads());
    setReplyDrafts((current) => ({ ...current, [threadId]: '' }));
    setError('');
    setStatusMessage('Reply posted successfully.');
  }

  function startThreadEdit(thread) {
    setEditingThreadId(thread.id);
    setThreadEditDraft({
      title: thread.title,
      body: thread.body,
      supportType: thread.supportType || 'General Support'
    });
  }

  function saveThreadEdit(threadId) {
    if (threadEditDraft.title.trim().length < MIN_THREAD_TITLE || threadEditDraft.body.trim().length < MIN_THREAD_BODY) {
      setStatusMessage('');
      setError(`Edited threads still need at least ${MIN_THREAD_TITLE} characters for the title and ${MIN_THREAD_BODY} characters for the message.`);
      return;
    }

    updateForumThread(threadId, threadEditDraft);
    setThreads(getForumThreads());
    setEditingThreadId('');
    setError('');
    setStatusMessage('Thread updated successfully.');
  }

  function removeThread(threadId) {
    setThreads(deleteForumThread(threadId));
    setError('');
    setStatusMessage('Thread removed.');
  }

  function startReplyEdit(reply) {
    setEditingReplyId(reply.id);
    setReplyEditDraft(reply.body);
  }

  function saveReplyEdit(threadId, replyId) {
    if (replyEditDraft.trim().length < MIN_REPLY_BODY) {
      setStatusMessage('');
      setError(`Edited replies should still contain at least ${MIN_REPLY_BODY} characters.`);
      return;
    }

    updateForumReply(threadId, replyId, { body: replyEditDraft });
    setThreads(getForumThreads());
    setEditingReplyId('');
    setReplyEditDraft('');
    setError('');
    setStatusMessage('Reply updated successfully.');
  }

  function removeReply(threadId, replyId) {
    const updated = deleteForumReply(threadId, replyId);
    setThreads((current) => current.map((thread) => (thread.id === threadId ? updated : thread)));
    setError('');
    setStatusMessage('Reply removed.');
  }

  function handleReport(payload) {
    const reports = reportForumContent(payload);
    setReportCount(reports.length);
    setError('');
    setStatusMessage('The content was reported for moderator review.');
  }

  function handleRefreshAlias() {
    const next = refreshForumAlias();
    setForumAliasState(next);
    setAliasDraft(next);
    setError('');
    setStatusMessage('Anonymous alias refreshed.');
  }

  function handleSaveAlias() {
    const next = setForumAlias(aliasDraft);
    setForumAliasState(next);
    setAliasDraft(next);
    setError('');
    setStatusMessage('Anonymous alias updated.');
  }

  return (
    <div className="pt-36 pb-12 px-6 max-w-7xl mx-auto min-h-screen bg-primary-bg">
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-purple/10 text-accent-purple text-[10px] font-bold uppercase tracking-widest mb-6">
          <MessageCircle className="w-3 h-3" />
          Anonymous Peer Support
        </div>
        <h1 className="text-5xl font-semibold tracking-tight text-primary-text">Peer Support Forum</h1>
        <p className="text-lg text-secondary-text mt-4 max-w-3xl">
          Post anonymously, reply gently, edit your own messages, and keep the conversation grounded in supportive campus wellness care.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <SummaryCard label="Active Threads" value={threads.length} hint="Seeded with sample peer-support discussions" />
        <SummaryCard label="Replies Shared" value={totalReplies} hint="Supportive responses visible in the thread feed" />
        <SummaryCard label="Your Posts" value={ownedThreads} hint={`Threads you can edit or remove anytime • ${reportCount} reports filed`} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-8">
        <aside className="space-y-6">
          <div className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm h-fit">
            <div className="flex items-center gap-3 mb-6">
              <Plus className="w-5 h-5 text-accent-purple" />
              <h2 className="text-2xl font-semibold text-primary-text">Start a thread</h2>
            </div>
            <div className="rounded-2xl bg-secondary-bg/70 p-4 mb-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-2">Posting As</p>
              <p className="text-lg font-semibold text-primary-text">{forumAlias}</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <input
                  type="text"
                  value={aliasDraft}
                  onChange={(event) => {
                    setAliasDraft(event.target.value);
                    setError('');
                    setStatusMessage('');
                  }}
                  className="flex-1 px-4 py-3 bg-white rounded-2xl outline-none"
                  placeholder="Change anonymous alias"
                />
                <button
                  type="button"
                  onClick={handleSaveAlias}
                  className="px-4 py-3 bg-white rounded-2xl font-bold text-primary-text"
                >
                  Change Alias
                </button>
                <button
                  type="button"
                  onClick={handleRefreshAlias}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-accent-purple text-white rounded-2xl font-bold"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setError('');
                  setStatusMessage('');
                }}
                className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none"
                placeholder="Thread title"
              />
              <p className="text-xs text-secondary-text">
                Title: {title.trim().length}/{MIN_THREAD_TITLE} minimum characters
              </p>
              <select
                value={supportType}
                onChange={(event) => {
                  setSupportType(event.target.value);
                  setError('');
                  setStatusMessage('');
                }}
                className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none"
              >
                {SUPPORT_TYPES.filter((option) => option !== 'All Topics').map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <textarea
                rows={6}
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  setError('');
                  setStatusMessage('');
                }}
                className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none resize-none"
                placeholder="Share what you are feeling or ask for peer support."
              />
              <p className="text-xs text-secondary-text">
                Message: {body.trim().length}/{MIN_THREAD_BODY} minimum characters
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {statusMessage && <p className="text-sm text-emerald-600">{statusMessage}</p>}
              <button type="submit" className="w-full py-4 bg-accent-purple text-white rounded-2xl font-bold">
                Post Anonymously
              </button>
            </form>
          </div>

          <div className="apple-card p-6 border-none bg-white/70 backdrop-blur-sm">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-secondary-bg rounded-2xl outline-none"
                placeholder="Search threads"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {SUPPORT_TYPES.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setActiveFilter(topic)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${activeFilter === topic ? 'bg-accent-primary text-white' : 'bg-secondary-bg text-secondary-text'}`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="apple-card p-6 border-none bg-white/70 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-accent-purple mt-1" />
              <div>
                <p className="font-semibold text-primary-text">Forum care rules</p>
                <p className="text-sm text-secondary-text mt-2">Keep replies gentle, avoid identifying details, and use crisis support instead of the forum for urgent danger.</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {filteredThreads.length === 0 ? (
            <div className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm text-secondary-text">
              No threads match this search yet.
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <article key={thread.id} className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="px-3 py-1 rounded-full bg-accent-purple/10 text-accent-purple text-[10px] font-bold uppercase tracking-[0.2em]">
                        {thread.supportType}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-secondary-text">
                        {thread.replies.length} replies
                      </span>
                    </div>

                    {editingThreadId === thread.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={threadEditDraft.title}
                          onChange={(event) => setThreadEditDraft((current) => ({ ...current, title: event.target.value }))}
                          className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none"
                        />
                        <select
                          value={threadEditDraft.supportType}
                          onChange={(event) => setThreadEditDraft((current) => ({ ...current, supportType: event.target.value }))}
                          className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none"
                        >
                          {SUPPORT_TYPES.filter((option) => option !== 'All Topics').map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <textarea
                          rows={5}
                          value={threadEditDraft.body}
                          onChange={(event) => setThreadEditDraft((current) => ({ ...current, body: event.target.value }))}
                          className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none resize-none"
                        />
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-semibold text-primary-text">{thread.title}</h2>
                        <p className="text-sm text-secondary-text mt-1">
                          {thread.author} • {new Date(thread.createdAt).toLocaleString()}
                          {thread.updatedAt ? ' • edited' : ''}
                        </p>
                        <p className="text-primary-text/80 leading-relaxed mt-4">{thread.body}</p>
                      </>
                    )}
                  </div>

                  {thread.isOwned && (
                    <div className="flex gap-2">
                      {editingThreadId === thread.id ? (
                        <>
                          <button type="button" onClick={() => saveThreadEdit(thread.id)} className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                            <Check className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setEditingThreadId('')} className="p-3 rounded-2xl bg-secondary-bg text-secondary-text">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => startThreadEdit(thread)} className="p-3 rounded-2xl bg-secondary-bg text-secondary-text">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => removeThread(thread.id)} className="p-3 rounded-2xl bg-rose-50 text-rose-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {!thread.isOwned && (
                    <button
                      type="button"
                      onClick={() => handleReport({ targetType: 'thread', targetId: thread.id, reason: 'Student requested moderator review' })}
                      className="px-4 py-2 rounded-2xl bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider"
                    >
                      Report
                    </button>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  {thread.replies.map((reply) => (
                    <div key={reply.id} className="rounded-2xl bg-secondary-bg/70 px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-primary-text">{reply.author}</p>
                          <p className="text-xs text-secondary-text mt-1">
                            {new Date(reply.createdAt).toLocaleString()}
                            {reply.updatedAt ? ' • edited' : ''}
                          </p>
                          {editingReplyId === reply.id ? (
                            <textarea
                              rows={3}
                              value={replyEditDraft}
                              onChange={(event) => setReplyEditDraft(event.target.value)}
                              className="w-full mt-3 px-4 py-3 bg-white rounded-2xl outline-none resize-none"
                            />
                          ) : (
                            <p className="text-sm text-secondary-text mt-2">{reply.body}</p>
                          )}
                        </div>

                        {reply.isOwned && (
                          <div className="flex gap-2">
                            {editingReplyId === reply.id ? (
                              <>
                                <button type="button" onClick={() => saveReplyEdit(thread.id, reply.id)} className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => { setEditingReplyId(''); setReplyEditDraft(''); }} className="p-2 rounded-xl bg-white text-secondary-text">
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" onClick={() => startReplyEdit(reply)} className="p-2 rounded-xl bg-white text-secondary-text">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => removeReply(thread.id, reply.id)} className="p-2 rounded-xl bg-rose-50 text-rose-600">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {!reply.isOwned && (
                          <button
                            type="button"
                            onClick={() => handleReport({ targetType: 'reply', targetId: reply.id, parentThreadId: thread.id, reason: 'Student requested moderator review' })}
                            className="p-2 rounded-xl bg-amber-50 text-amber-700"
                          >
                            Report
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={replyDrafts[thread.id] || ''}
                    onChange={(event) => setReplyDrafts((current) => ({ ...current, [thread.id]: event.target.value }))}
                    className="flex-1 px-5 py-4 bg-secondary-bg rounded-2xl outline-none"
                    placeholder={`Reply as ${forumAlias}...`}
                  />
                  <button
                    type="button"
                    onClick={() => handleReply(thread.id)}
                    className="px-5 py-4 bg-accent-primary text-white rounded-2xl font-bold"
                  >
                    Reply
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
