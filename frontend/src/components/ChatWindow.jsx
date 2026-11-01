import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { getSocket } from '../services/socket';

export default function ChatWindow({ conversation, onMessageSent }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;
    setLoading(true);
    chatService
      .getMessages(conversation._id)
      .then((data) => setMessages(data.messages))
      .catch(() => {})
      .finally(() => setLoading(false));

    const socket = getSocket();
    if (!socket) return;

    socket.emit('conversation:join', conversation._id);

    const handleNewMessage = (message) => {
      if (message.conversation !== conversation._id) return;
      if (message.sender === user._id) return; // we already appended our own optimistically
      setMessages((prev) => [...prev, message]);
    };
    socket.on('message:new', handleNewMessage);

    return () => {
      socket.emit('conversation:leave', conversation._id);
      socket.off('message:new', handleNewMessage);
    };
  }, [conversation, user._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const { message } = await chatService.sendMessage(conversation._id, text.trim());
      setMessages((prev) => [...prev, message]);
      setText('');
      onMessageSent?.(message);
    } catch {
      // Let the user retry; the input keeps their unsent text
    } finally {
      setBusy(false);
    }
  };

  if (!conversation) return null;

  const otherParty = user.role === 'farmer' ? conversation.buyer : conversation.farmer;

  return (
    <div className="chat-window">
      <div className="chat-window-heading">
        <strong>{otherParty?.name}</strong>
        <span>{conversation.product?.title}</span>
      </div>

      <div className="chat-messages">
        {loading ? (
          <p>Loading...</p>
        ) : messages.length === 0 ? (
          <p className="empty-card">Say hello — start the conversation below.</p>
        ) : (
          messages.map((m) => (
            <div key={m._id} className={m.sender === user._id ? 'message-bubble mine' : 'message-bubble'}>
              <p>{m.text}</p>
              <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input" onSubmit={send}>
        <input
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
        />
        <button className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
