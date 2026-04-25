import { useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle, MessageCircleMore, Send, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  getCounselingSessionChat,
  markCounselingSessionChatRead,
  sendCounselingSessionChatMessage
} from '../../lib/counseling';
import { getAuthenticatedSocket } from '../../lib/socket';

function mergeMessages(current, nextMessage) {
  const byId = new Map(current.map((message) => [message._id, message]));
  byId.set(nextMessage._id, nextMessage);

  return [...byId.values()].sort((left, right) => (
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  ));
}


function formatChatTimestamp(value) {
  try {
    return new Date(value).toLocaleString([], {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

export default function CounselingSessionChatPanel({
  sessionId,
  currentUser,
  token,
  sessionStatus,
  canJoin
}) {
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingName, setTypingName] = useState('');
  const scrollRef = useRef(null);

  const canSend = Boolean(canJoin && sessionStatus && !['Cancelled', 'Completed'].includes(sessionStatus));
  const currentUserId = currentUser?.id || currentUser?._id;

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const chat = await getCounselingSessionChat(sessionId);
        if (!active) return;
        setConversationId(chat.conversationId);
        setMessages(chat.messages);
        setError('');
        await markCounselingSessionChatRead(sessionId);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load chat conversation');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!conversationId || !token) return undefined;

    const socket = getAuthenticatedSocket(token);
    if (!socket) return undefined;

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit('join-conversation', conversationId);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleNewMessage = (payload) => {
      if (payload?.conversationId !== conversationId || !payload?.message) return;
      setMessages((current) => mergeMessages(current, payload.message));
      if (payload.message.sender?._id !== currentUserId) {
        void markCounselingSessionChatRead(sessionId);
      }
    };

    const handleMessagesRead = (payload) => {
      if (payload?.conversationId !== conversationId) return;
      setMessages((current) => current.map((message) => (
        message.sender?._id === payload.readBy
          ? message
          : { ...message, read: true, readAt: new Date().toISOString() }
      )));
    };

    const handleTyping = (payload) => {
      if (!payload || payload.userId === currentUserId) return;
      setTypingName(payload.isTyping ? payload.name : '');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new-message', handleNewMessage);
    socket.on('messages-read', handleMessagesRead);
    socket.on('user-typing', handleTyping);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new-message', handleNewMessage);
      socket.off('messages-read', handleMessagesRead);
      socket.off('user-typing', handleTyping);
      socket.emit('typing', { conversationId, isTyping: false });
    };
  }, [conversationId, currentUserId, sessionId, token]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typingName]);

  const otherParticipantTyping = useMemo(
    () => (typingName ? `${typingName} is typing...` : ''),
    [typingName]
  );

  async function handleSendMessage() {
    const text = draft.trim();
    if (!text || sending || !canSend) return;

    try {
      setSending(true);
      setError('');
      const response = await sendCounselingSessionChatMessage(sessionId, { text });
      if (response?.conversationId) {
        setConversationId(response.conversationId);
      }
      if (response?.message) {
        setMessages((current) => mergeMessages(current, response.message));
      }
      setDraft('');
      if (conversationId && token) {
        const socket = getAuthenticatedSocket(token);
        socket?.emit('typing', { conversationId, isTyping: false });
      }
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function handleDraftChange(value) {
    setDraft(value);
    if (!conversationId || !token) return;
    const socket = getAuthenticatedSocket(token);
    if (!socket) return;
    socket.emit('typing', { conversationId, isTyping: value.trim().length > 0 });
  }

  return (
    <section className="pharmacy-panel p-7">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MessageCircleMore className="h-5 w-5 text-accent-primary" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Live chat</p>
            <p className="mt-1 text-sm text-secondary-text">
              {canSend
                ? 'Counselor and student can message each other in real time during this chat session.'
                : `This chat is read-only because the session is ${sessionStatus?.toLowerCase()}.`}
            </p>
          </div>
        </div>

        <span className={cn(
          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
          socketConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
        )}>
          {socketConnected ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : <WifiOff className="h-3.5 w-3.5" />}
          {socketConnected ? 'Live' : 'Reconnecting'}
        </span>
      </div>

      {loading ? (
        <div className="mt-5 rounded-[1.5rem] bg-secondary-bg/70 px-5 py-6 text-sm text-secondary-text">Loading chat conversation...</div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="mt-5 max-h-[380px] space-y-3 overflow-y-auto rounded-[1.75rem] border border-[#d7e4ea] bg-white/80 p-4"
          >
            {messages.length ? messages.map((message) => {
              const isOwn = message.sender?._id === currentUserId;

              return (
                <div
                  key={message._id}
                  className={cn(
                    'flex',
                    isOwn ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-[1.35rem] px-4 py-3 shadow-sm',
                      isOwn ? 'bg-accent-primary text-white' : 'bg-secondary-bg/90 text-primary-text'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm font-semibold', isOwn ? 'text-white' : 'text-primary-text')}>
                        {message.sender?.name || 'Participant'}
                      </p>
                      <span className={cn('text-[11px]', isOwn ? 'text-white/75' : 'text-secondary-text')}>
                        {formatChatTimestamp(message.createdAt)}
                      </span>
                    </div>
                    <p className={cn('mt-2 text-sm leading-6', isOwn ? 'text-white/90' : 'text-secondary-text')}>
                      {message.text}
                    </p>
                    {isOwn && (
                      <p className="mt-2 text-[11px] text-white/70">
                        {message.read ? 'Read' : 'Sent'}
                      </p>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-[1.5rem] border border-dashed border-[#c9dde6] bg-white/70 px-5 py-6 text-sm leading-6 text-secondary-text">
                No messages yet. Start the counseling chat here once the session begins.
              </div>
            )}
          </div>

          <div className="mt-3 min-h-6 text-sm text-secondary-text">
            {otherParticipantTyping || error}
          </div>

          <div className="mt-2 flex gap-3">
            <textarea
              rows={3}
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              disabled={!canSend || sending}
              className="student-field min-h-24 flex-1 resize-none"
              placeholder={canSend ? 'Type a message to the other participant...' : 'Chat is read-only for this session status.'}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!canSend || sending || !draft.trim()}
              className="pharmacy-primary self-end disabled:opacity-50"
            >
              {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
