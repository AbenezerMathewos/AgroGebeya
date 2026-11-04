import { useEffect, useState, useCallback, useMemo } from 'react';
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

  // Contacts Directory
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startingChatId, setStartingChatId] = useState(null);

  const loadConversations = useCallback(() => {
    chatService
      .getConversations()
      .then((data) => {
        const list = data.conversations || [];
        setConversations(list);
        if (conversationId) {
          const match = list.find((c) => c._id === conversationId);
          if (match) setActive(match);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversationId]);

  const loadContacts = useCallback(() => {
    setContactsLoading(true);
    chatService
      .getContacts()
      .then((data) => {
        setContacts(data.contacts || []);
      })
      .catch((err) => {
        console.warn('Could not load contacts:', err);
      })
      .finally(() => setContactsLoading(false));
  }, []);

  useEffect(() => {
    loadConversations();
    loadContacts();
  }, [loadConversations, loadContacts]);

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

  const handleStartChatWithContact = async (contact) => {
    try {
      setStartingChatId(contact._id);
      const isTransporter = user?.role === 'transporter';
      const roleGreeting = isTransporter
        ? `Hello ${contact.name}, I am a transporter on AgroGebeya. I have active truck capacity and would like to coordinate freight and cargo dispatch with you.`
        : `Hello ${contact.name}, I would like to coordinate agricultural trade and logistics with you on AgroGebeya.`;

      const res = await chatService.startDirectConversation(contact._id, roleGreeting);
      if (res?.conversation) {
        setConversations((prev) => {
          const exists = prev.some((c) => c._id === res.conversation._id);
          return exists ? prev : [res.conversation, ...prev];
        });
        setActive(res.conversation);
        navigate(`/messages/${res.conversation._id}`);
      }
    } catch (err) {
      console.error('Failed to initiate conversation:', err);
    } finally {
      setStartingChatId(null);
    }
  };

  const currentUid = (user?._id || user?.id)?.toString();

  const getOtherParty = (conv) => {
    const buyerId = (conv.buyer?._id || conv.buyer)?.toString();
    return buyerId === currentUid ? conv.farmer : conv.buyer;
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'farmer':
        return { label: '🧑‍🌾 Farmer', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
      case 'cooperative':
        return { label: '🤝 Cooperative', bg: 'rgba(56, 189, 248, 0.15)', color: '#0284c7' };
      case 'buyer':
        return { label: '🏢 Buyer', bg: 'rgba(245, 158, 11, 0.15)', color: '#d97706' };
      case 'transporter':
        return { label: '🚚 Transporter', bg: 'rgba(168, 85, 247, 0.15)', color: '#9333ea' };
      default:
        return { label: '👤 Member', bg: 'rgba(148, 163, 184, 0.15)', color: '#64748b' };
    }
  };

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (roleFilter !== 'all' && c.role !== roleFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.cooperativeName?.toLowerCase().includes(q) ||
        c.region?.toLowerCase().includes(q) ||
        c.zone?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
      );
    });
  }, [contacts, roleFilter, searchQuery]);

  return (
    <div className="messages-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.25rem' }}>
      <div className="page-intro" style={{ marginBottom: '1.25rem' }}>
        <span className="eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
          Direct Logistics & Trade Messaging
        </span>
        <h1 style={{ margin: '0.25rem 0 0.5rem', fontSize: '1.8rem', fontWeight: 800 }}>
          Chat with farmers, cooperatives, buyers & transporters
        </h1>
        <p style={{ color: 'var(--slate-400, #64748b)', margin: 0, fontSize: '0.95rem' }}>
          Ask cargo questions, arrange farmgate pickup or depot delivery, and settle freight details directly.
        </p>
      </div>

      <div className="messages-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', minHeight: '560px' }}>
        {/* Left Sidebar: Active Conversations */}
        <div className="conversation-list" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-color, #1e293b)' }}>
              💬 Active Chats ({conversations.length})
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', fontWeight: 600 }}
              onClick={() => {
                setActive(null);
                navigate('/messages');
              }}
              title="Browse contacts directory to start a new chat"
            >
              + Find Partners
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem 0' }}>Loading conversations...</p>
            ) : conversations.length === 0 ? (
              <div className="empty-card" style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>No conversations yet.</p>
                <p style={{ color: 'var(--slate-400, #64748b)', margin: '0 0 0.75rem', fontSize: '0.78rem' }}>
                  Pick any verified farmer, cooperative union, or buyer from the directory on the right to start direct logistics coordination.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                  onClick={() => setActive(null)}
                >
                  👥 Browse Directory
                </button>
              </div>
            ) : (
              conversations.map((c) => {
                const other = getOtherParty(c);
                const badge = getRoleBadge(other?.role);
                const isSelected = active?._id === c._id;

                return (
                  <button
                    key={c._id}
                    type="button"
                    className={isSelected ? 'conversation-item active' : 'conversation-item'}
                    onClick={() => selectConversation(c)}
                    style={{
                      display: 'flex',
                      gap: '0.65rem',
                      alignItems: 'center',
                      width: '100%',
                      padding: '0.65rem',
                      marginBottom: '0.35rem',
                      borderRadius: '8px',
                      border: isSelected ? '1.5px solid #10b981' : '1px solid transparent',
                      background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {c.product ? (
                      <ProductThumb product={c.product} size={42} />
                    ) : (
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          background: badge.bg,
                          color: badge.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          flexShrink: 0,
                          fontWeight: 700,
                        }}
                      >
                        {other?.role === 'farmer'
                          ? '🧑‍🌾'
                          : other?.role === 'cooperative'
                          ? '🤝'
                          : other?.role === 'transporter'
                          ? '🚚'
                          : other?.role === 'buyer'
                          ? '🏢'
                          : '💬'}
                      </div>
                    )}
                    <div className="conversation-item-main" style={{ flex: 1, minWidth: 0 }}>
                      <div className="conversation-item-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {other?.name || 'Partner'}
                        </strong>
                        {c.unreadCount > 0 && (
                          <span className="unread-badge" style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 700 }}>
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0.15rem 0', fontSize: '0.76rem', color: 'var(--slate-400, #64748b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.product?.title || other?.cooperativeName || badge.label}
                      </p>
                      {c.lastMessage && (
                        <p className="conversation-preview" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--slate-500, #94a3b8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.lastMessage}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Chat Window OR Directory View */}
        <div className="conversation-active" style={{ minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
          {active ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '0.5rem 1rem', background: 'var(--surface-subtle, rgba(0,0,0,0.02))', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--slate-400, #64748b)' }}>Active coordination thread</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                  onClick={() => {
                    setActive(null);
                    navigate('/messages');
                  }}
                >
                  👥 Open Directory
                </button>
              </div>
              <ChatWindow conversation={active} onMessageSent={loadConversations} />
            </div>
          ) : (
            <div style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem', fontWeight: 800 }}>
                      🌾 Verified Agricultural & Freight Directory
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--slate-400, #64748b)' }}>
                      Start direct 1-to-1 communication with smallholders, cooperative managers, depot buyers, or fleet drivers.
                    </p>
                  </div>
                  <input
                    type="text"
                    placeholder="🔍 Search name, union, region..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      width: '240px',
                    }}
                  />
                </div>

                {/* Role Filter Pills */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'All Contacts' },
                    { id: 'farmer', label: '🧑‍🌾 Farmers' },
                    { id: 'cooperative', label: '🤝 Cooperatives' },
                    { id: 'buyer', label: '🏢 Buyers' },
                    { id: 'transporter', label: '🚚 Transporters' },
                  ].map((filter) => {
                    const isSelected = roleFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setRoleFilter(filter.id)}
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.35rem 0.7rem',
                          borderRadius: '999px',
                          border: isSelected ? '1.5px solid #10b981' : '1px solid var(--border-color, #cbd5e1)',
                          background: isSelected ? '#10b981' : 'var(--surface, #ffffff)',
                          color: isSelected ? '#ffffff' : 'var(--text-color, #334155)',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contacts Grid */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {contactsLoading ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 0' }}>Loading contacts directory...</p>
                ) : filteredContacts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                    <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>No matching contacts found</p>
                    <p style={{ fontSize: '0.85rem' }}>Try clearing your search query or selecting "All Contacts".</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
                    {filteredContacts.map((contact) => {
                      const badge = getRoleBadge(contact.role);
                      const isStarting = startingChatId === contact._id;

                      return (
                        <div
                          key={contact._id}
                          style={{
                            padding: '1rem',
                            borderRadius: '10px',
                            background: 'var(--card-bg, rgba(255,255,255,0.03))',
                            border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem' }}>
                              <strong style={{ fontSize: '0.98rem', color: 'var(--text-color, #1e293b)' }}>
                                {contact.name}
                              </strong>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '999px',
                                  background: badge.bg,
                                  color: badge.color,
                                  fontWeight: 700,
                                }}
                              >
                                {badge.label}
                              </span>
                            </div>

                            {contact.cooperativeName && (
                              <p style={{ margin: '0 0 0.35rem', fontSize: '0.82rem', color: '#0284c7', fontWeight: 600 }}>
                                🏛️ {contact.cooperativeName}
                              </p>
                            )}

                            <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', color: 'var(--slate-400, #64748b)' }}>
                              📍 {contact.region || 'Ethiopia'}{contact.zone ? `, ${contact.zone}` : ''}{contact.woreda ? ` (${contact.woreda})` : ''}
                            </p>

                            {contact.phone && (
                              <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: 'var(--slate-400, #64748b)' }}>
                                📞 <a href={`tel:${contact.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{contact.phone}</a>
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={isStarting}
                            onClick={() => handleStartChatWithContact(contact)}
                            style={{
                              width: '100%',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              padding: '0.4rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            💬 {isStarting ? 'Starting Chat...' : 'Start Direct Chat'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
