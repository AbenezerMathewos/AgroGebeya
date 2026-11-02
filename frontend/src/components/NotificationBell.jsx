import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '../context/SocketContext';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getNotificationIcon(message = '') {
  const m = message.toLowerCase();
  if (m.includes('in_transit') || m.includes('dispatched') || m.includes('ship')) return '🚚';
  if (m.includes('completed') || m.includes('delivered') || m.includes('released')) return '💰';
  if (m.includes('escrow') || m.includes('locked')) return '🔒';
  if (m.includes('accepted')) return '✅';
  if (m.includes('order') || m.includes('request')) return '📦';
  if (m.includes('pool') || m.includes('pledge')) return '🤝';
  if (m.includes('price')) return '📊';
  if (m.includes('advisory') || m.includes('crop') || m.includes('disease')) return '🌿';
  return '🔔';
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useSocketContext();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = (notification) => {
    if (!notification.read) markRead(notification._id);
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      {/* Sleek Floating Circular Bell Toggle */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        style={{
          position: 'relative',
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: open ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
          color: '#ffffff',
          fontSize: '1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 700,
              minWidth: '20px',
              height: '20px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 0 2px #064e3b',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modern Glassmorphism Notification Popover */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: 0,
            width: '380px',
            maxWidth: 'calc(100vw - 2rem)',
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            zIndex: 1100,
            overflow: 'hidden',
            backdropFilter: 'blur(16px)',
            color: '#f8fafc',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                Notifications
              </strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#34d399',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Body List */}
          {notifications.length === 0 ? (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>✨</span>
              <p style={{ margin: 0, fontWeight: 600, color: '#e2e8f0' }}>You're all caught up</p>
              <small style={{ color: '#64748b' }}>Order updates, escrow alerts, and freight status will appear here.</small>
            </div>
          ) : (
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {notifications.map((n) => {
                const icon = getNotificationIcon(n.message);
                return (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => handleClick(n)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                      padding: '0.9rem 1.25rem',
                      width: '100%',
                      textAlign: 'left',
                      background: n.read ? 'transparent' : 'rgba(16, 185, 129, 0.08)',
                      border: 'none',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      color: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(16, 185, 129, 0.08)';
                    }}
                  >
                    {/* Event Icon Circle */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.84rem',
                          lineHeight: '1.45',
                          color: n.read ? '#cbd5e1' : '#f8fafc',
                          fontWeight: n.read ? 400 : 600,
                          wordBreak: 'break-word',
                        }}
                      >
                        {n.message}
                      </p>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '0.72rem',
                          color: '#64748b',
                          marginTop: '0.3rem',
                        }}
                      >
                        ⏱ {timeAgo(n.createdAt)}
                      </span>
                    </div>

                    {/* Unread Glow Indicator */}
                    {!n.read && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#10b981',
                          boxShadow: '0 0 8px #10b981',
                          marginTop: '0.4rem',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
