import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function FloatingActionMenu() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const addProductRoute = user
    ? (user.role === 'farmer' || user.role === 'cooperative') ? '/farmer/add-product' : '/products'
    : '/login';

  return (
    <div className={`fab-container ${open ? 'open' : ''}`}>
      {/* Expanded Quick Action Pills */}
      {open && (
        <div className="fab-menu-items">
          <Link
            to={addProductRoute}
            className="fab-item"
            onClick={() => setOpen(false)}
            title="Post a New Harvest Lot"
          >
            <span className="fab-item-label">🌾 List New Harvest</span>
            <span className="fab-item-icon">➕</span>
          </Link>

          <Link
            to="/freight"
            className="fab-item"
            onClick={() => setOpen(false)}
            title="Find Return-Trip Freight"
          >
            <span className="fab-item-label">🚚 Book Empty Truck</span>
            <span className="fab-item-icon">📦</span>
          </Link>

          <Link
            to="/market-prices"
            className="fab-item"
            onClick={() => setOpen(false)}
            title="Check ECX Price Radar"
          >
            <span className="fab-item-label">📊 ECX Price Radar</span>
            <span className="fab-item-icon">📈</span>
          </Link>

          <Link
            to="/advisory"
            className="fab-item"
            onClick={() => setOpen(false)}
            title="Scan Crop Disease & Pest"
          >
            <span className="fab-item-label">🌿 Scan Crop Disease</span>
            <span className="fab-item-icon">🔍</span>
          </Link>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        className={`fab-trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Quick Actions Speed Dial"
        title="⚡ Quick Actions"
      >
        <span className="fab-icon">{open ? '✕' : '⚡'}</span>
        {!open && <span className="fab-pulse-effect"></span>}
      </button>
    </div>
  );
}
