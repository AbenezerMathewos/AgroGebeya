import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LIVE_EVENTS = [
  {
    id: 1,
    icon: '🌾',
    title: 'New Harvest Lot Listed',
    desc: 'Girmachew in East Gojjam listed 45 Qtl Magna White Teff (Grade 1)',
    time: 'Just now',
    link: '/products',
    badge: 'Farmgate',
    color: '#10b981',
  },
  {
    id: 2,
    icon: '🚚',
    title: 'Return Truck Available',
    desc: 'Sino Truck (300 Qtl) departing Hawassa to Addis Ababa (120 Qtl space)',
    time: '2m ago',
    link: '/freight',
    badge: 'Freight',
    color: '#0ea5e9',
  },
  {
    id: 3,
    icon: '🛡️',
    title: 'Telebirr Escrow Locked',
    desc: 'Buyer locked 145,000 ETB in secured escrow for Washed Coffee Q1',
    time: '4m ago',
    link: '/market-prices',
    badge: 'Escrow',
    color: '#f59e0b',
  },
  {
    id: 4,
    icon: '📈',
    title: 'ECX Market Update',
    desc: 'Humera White Sesame jumped +5.8% to 18,200 ETB/Qtl at Addis Terminal',
    time: '6m ago',
    link: '/market-prices',
    badge: 'ECX Floor',
    color: '#8b5cf6',
  },
  {
    id: 5,
    icon: '🥑',
    title: 'Wholesale Trade Completed',
    desc: '80 Qtl Hass Avocado delivered from Sodo to Bole Fruit Terminal',
    time: '8m ago',
    link: '/products',
    badge: 'Verified',
    color: '#10b981',
  },
  {
    id: 6,
    icon: '🫚',
    title: 'High Demand Surge',
    desc: 'Red Ginger price spread reached +140 ETB/Kg between Areka & Atikilt Tera',
    time: '11m ago',
    link: '/market-prices',
    badge: 'Arbitrage',
    color: '#ef4444',
  },
];

export default function LiveTradeToast() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Initial delay before first toast
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 3500);

    return () => clearTimeout(initialTimer);
  }, []);

  useEffect(() => {
    if (!visible || isPaused) return;

    // Show for 6 seconds, hide for 6 seconds, then switch to next
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 6500);

    const nextTimer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % LIVE_EVENTS.length);
      setVisible(true);
    }, 13000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [visible, isPaused, currentIndex]);

  const event = LIVE_EVENTS[currentIndex];

  if (!event) return null;

  return (
    <div
      className={`live-trade-toast ${visible ? 'toast-visible' : 'toast-hidden'}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{ '--event-accent': event.color }}
    >
      <div className="toast-pulse-halo"></div>
      <div className="toast-icon-box">{event.icon}</div>
      <div className="toast-content">
        <div className="toast-header-row">
          <span className="toast-badge" style={{ backgroundColor: `${event.color}18`, color: event.color }}>
            ● {event.badge}
          </span>
          <span className="toast-time">{event.time}</span>
        </div>
        <strong className="toast-title">{event.title}</strong>
        <p className="toast-desc">{event.desc}</p>
        <Link to={event.link} className="toast-link" onClick={() => setVisible(false)}>
          View details &rarr;
        </Link>
      </div>
      <button
        className="toast-close-btn"
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
        }}
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
