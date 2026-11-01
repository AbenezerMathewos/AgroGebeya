import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { getSocket } from '../services/socket';
import ProductThumb from '../components/ProductThumb';
import ChatWindow from '../components/ChatWindow';

export default function Messages() {
  const { user } = useAuth();
  const params = useParams();
  const conversationId = params.conversationId || params.id;
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(() => {
    chatService
      .getConversations()
      .then((data) => {
        setConversations(data.conversations || []);
        if (conversationId) {
          const match = (data.conversations || []).find((c) => c._id === conversationId);
          if (match) setActive(match);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Bump the conversation list to the top / refresh unread counts whenever any message arrives
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleNewMessage = () => loadConversations();
    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [loadConversations]);

  const selectConversation = (conversation) => {
    setActive(conversation);
    setConversations((prev) => prev.map((c) => (c._id === conversation._id ? { ...c, unreadCount: 0 } : c)));
    navigate(`/messages/${conversation._id}`);
  };

  return (
    <div className="messages-page">
      <div className="page-intro">
        <span className="eyebrow">Messages</span>
        <h1>Chat with {user?.role === 'farmer' ? 'buyers & partners' : 'farmers & cooperatives'}</h1>
        <p>Ask questions, arrange pickup or delivery, and settle details directly.</p>
      </div>

      <div className="messages-layout">
        <div className="conversation-list">
          {loading ? (
            <p>Loading...</p>
          ) : conversations.length === 0 ? (
            <div className="empty-card">
              No conversations yet. Open any harvest listing and tap "Message seller" to start one.
            </div>
          ) : (
            conversations.map((c) => {
              const currentUid = (user?._id || user?.id)?.toString();
              const otherParty = (c.buyer?._id || c.buyer)?.toString() === currentUid ? c.farmer : c.buyer;
              return (
                <button
                  key={c._id}
                  className={active?._id === c._id ? 'conversation-item active' : 'conversation-item'}
                  onClick={() => selectConversation(c)}
                >
                  <ProductThumb product={c.product} size={44} />
                  <div className="conversation-item-main">
                    <div className="conversation-item-heading">
                      <strong>{otherParty?.name}</strong>
                      {c.unreadCount > 0 && <span className="unread-badge">{c.unreadCount}</span>}
                    </div>
                    <p>{c.product?.title}</p>
                    {c.lastMessage && <p className="conversation-preview">{c.lastMessage}</p>}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="conversation-active">
          {active ? (
            <ChatWindow conversation={active} onMessageSent={loadConversations} />
          ) : (
            <div className="empty-card">Select a conversation to start chatting.</div>
          )}
        </div>
      </div>
    </div>
  );
}
