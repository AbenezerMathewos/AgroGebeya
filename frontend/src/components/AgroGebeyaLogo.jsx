export default function AgroGebeyaLogo({ size = 32, showText = true, className = '' }) {
  return (
    <div className={`agro-brand-logo ${className}`}>
      {/* Premium Custom SVG Emblem */}
      <div className="agro-logo-mark" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="agro-svg-emblem"
        >
          <defs>
            {/* Emerald Leaf Gradient */}
            <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Golden Grain & Sun Gradient */}
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Cyan Digital Network Gradient */}
            <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="0%" stopColor="#0284c7" />
            </linearGradient>

            {/* Soft Glow Filter */}
            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#10b981" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Outer Ring / Digital Connection Arc */}
          <circle
            cx="24"
            cy="24"
            r="21"
            stroke="url(#emeraldGrad)"
            strokeWidth="2.5"
            strokeDasharray="95 35"
            strokeLinecap="round"
            className="logo-arc-outer"
          />

          {/* Inner Golden Wheat & Crop Sheaf */}
          <path
            d="M24 38V18M24 18C21 14 16 13 14 15C12 17 13 22 17 24C21 26 24 24 24 24M24 22C27 18 32 17 34 19C36 21 35 26 31 28C27 30 24 28 24 28M24 27C21 24 18 24 16 26C14 28 15 31 18 32C21 33 24 31 24 31M24 31C27 28 30 28 32 30C34 32 33 35 30 36C27 37 24 35 24 35"
            stroke="url(#goldGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Sprouting Emerald Leaf */}
          <path
            d="M24 18C24 12 21 7 17 6C17 11 19 16 24 18Z"
            fill="url(#emeraldGrad)"
            filter="url(#logoGlow)"
          />
          <path
            d="M24 18C24 12 27 7 31 6C31 11 29 16 24 18Z"
            fill="url(#emeraldGrad)"
            filter="url(#logoGlow)"
          />

          {/* Core Golden Sunburst Dot */}
          <circle cx="24" cy="18" r="3.2" fill="url(#goldGrad)" />
          <circle cx="24" cy="18" r="1.5" fill="#ffffff" />

          {/* Digital Network Nodes (Trade Links) */}
          <circle cx="10" cy="24" r="2.2" fill="url(#cyanGrad)" className="logo-node node-1" />
          <circle cx="38" cy="24" r="2.2" fill="url(#cyanGrad)" className="logo-node node-2" />
          <circle cx="24" cy="42" r="2.2" fill="url(#emeraldGrad)" className="logo-node node-3" />
        </svg>
      </div>

      {/* Brand Text Typography */}
      {showText && (
        <div className="agro-logo-text">
          <span className="logo-name-agro">Agro<span className="logo-name-gebeya">Gebeya</span></span>
          <span className="logo-badge-et">ETHIOPIA</span>
        </div>
      )}
    </div>
  );
}
