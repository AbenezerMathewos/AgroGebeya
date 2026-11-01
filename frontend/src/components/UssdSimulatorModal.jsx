import { useState, useEffect } from 'react';

const USSD_MENUS = {
  main: {
    title: '🇪🇹 AgroGebeya ET (*8028#)',
    prompt: 'Select an option:',
    options: [
      { key: '1', label: '1. Check ECX Market Prices (የገበያ ዋጋ)', next: 'prices' },
      { key: '2', label: '2. List Harvest for Sale (ምርት መመዝገቢያ)', next: 'listProduce' },
      { key: '3', label: '3. Book Return Truck Space (የመኪና ጭነት)', next: 'freight' },
      { key: '4', label: '4. Telebirr Escrow Balance (የሂሳብ ሁኔታ)', next: 'escrow' },
      { key: '5', label: '5. Change Language (ቋንቋ ቀይር)', next: 'language' },
    ],
  },
  prices: {
    title: '📊 Today\'s Regional Farmgate Prices',
    prompt: 'Select Commodity:',
    options: [
      { key: '1', label: '1. Magna Teff (Sodo: 11,400 ETB/Qtl)', next: 'priceDetailTeff' },
      { key: '2', label: '2. Washed Coffee (Jimma: 28,000 ETB/Qtl)', next: 'priceDetailCoffee' },
      { key: '3', label: '3. Fresh Ginger (Areka: 170 ETB/Kg)', next: 'priceDetailGinger' },
      { key: '4', label: '4. Hass Avocado (Sodo: 65 ETB/Kg)', next: 'priceDetailAvocado' },
      { key: '0', label: '0. Back to Main Menu', next: 'main' },
    ],
  },
  priceDetailTeff: {
    title: '🌾 Magna White Teff (Grade 1)',
    prompt: 'Farmgate (Sodo): 11,400 ETB\nAddis Terminal: 13,800 ETB\nArbitrage Spread: +2,400 ETB/Qtl (+21%)\n\nReply:\n1. Find Transporters\n0. Back',
    options: [
      { key: '1', label: '1. Find Available Trucks', next: 'freight' },
      { key: '0', label: '0. Back', next: 'prices' },
    ],
  },
  priceDetailCoffee: {
    title: '☕ Yirgacheffe Washed Coffee Q1',
    prompt: 'Farmgate (Dilla): 28,000 ETB\nECX Floor: 38,500 ETB\nSpread: +10,500 ETB/Qtl (+38%)\n\nReply:\n1. Lock Deal via Escrow\n0. Back',
    options: [
      { key: '1', label: '1. Lock Escrow Deal', next: 'escrowSuccess' },
      { key: '0', label: '0. Back', next: 'prices' },
    ],
  },
  priceDetailGinger: {
    title: '🫚 Wolaita Fresh Ginger',
    prompt: 'Farmgate (Areka): 170 ETB/Kg\nAtikilt Tera: 310 ETB/Kg\nSpread: +140 ETB/Kg (+82%)\n\nReply:\n1. Check Return Trucks\n0. Back',
    options: [
      { key: '1', label: '1. Check Return Trucks', next: 'freight' },
      { key: '0', label: '0. Back', next: 'prices' },
    ],
  },
  priceDetailAvocado: {
    title: '🥑 Hass Avocado (Export Ready)',
    prompt: 'Farmgate (Sodo): 65 ETB/Kg\nBole Terminal: 160 ETB/Kg\nSpread: +95 ETB/Kg (+146%)\n\nReply:\n1. List My 500Kg Lot\n0. Back',
    options: [
      { key: '1', label: '1. List My 500Kg Lot', next: 'listSuccess' },
      { key: '0', label: '0. Back', next: 'prices' },
    ],
  },
  freight: {
    title: '🚚 Return-Trip Truck Sharing',
    prompt: 'Available Corridors today:',
    options: [
      { key: '1', label: '1. Wolaita Sodo ➔ Addis (Isuzu 30 Qtl space, 380 ETB/Qtl)', next: 'freightBook1' },
      { key: '2', label: '2. Jimma ➔ Addis (FSR 55 Qtl space, 420 ETB/Qtl)', next: 'freightBook2' },
      { key: '0', label: '0. Back', next: 'main' },
    ],
  },
  freightBook1: {
    title: '🚚 Book Sodo ➔ Addis Isuzu',
    prompt: 'Driver: Girma (+251944556677)\nDeparture: Sunday Morning\nDiscount: 35% off regular tariff\n\nReply:\n1. Confirm 30 Qtl Booking\n0. Back',
    options: [
      { key: '1', label: '1. Confirm Booking via SMS', next: 'freightSuccess' },
      { key: '0', label: '0. Back', next: 'freight' },
    ],
  },
  freightBook2: {
    title: '🚚 Book Jimma ➔ Addis FSR',
    prompt: 'Driver: Tadesse (+251911998877)\nDeparture: Monday 6:00 AM\n\nReply:\n1. Confirm Booking\n0. Back',
    options: [
      { key: '1', label: '1. Confirm Booking', next: 'freightSuccess' },
      { key: '0', label: '0. Back', next: 'freight' },
    ],
  },
  escrow: {
    title: '🛡️ Telebirr Escrow Wallet',
    prompt: 'Active Escrow Accounts:\n• 145,000 ETB (Locked - Coffee Lot #884)\n• 68,000 ETB (Released to Telebirr)\n\nReply:\n1. Release Payout to Farmer\n0. Back',
    options: [
      { key: '1', label: '1. Authorize Telebirr Release', next: 'escrowReleaseSuccess' },
      { key: '0', label: '0. Back', next: 'main' },
    ],
  },
  listProduce: {
    title: '🌾 Quick Produce Listing',
    prompt: 'Enter crop name & estimated Quintals.\n\nReply with:\n1. White Teff (50 Qtl)\n2. Red Ginger (20 Qtl)\n0. Back',
    options: [
      { key: '1', label: '1. List Teff 50 Qtl', next: 'listSuccess' },
      { key: '2', label: '2. List Ginger 20 Qtl', next: 'listSuccess' },
      { key: '0', label: '0. Back', next: 'main' },
    ],
  },
  language: {
    title: '🌐 Select Language / ቋንቋ ይምረጡ',
    prompt: 'Choose language:',
    options: [
      { key: '1', label: '1. አማርኛ (Amharic)', next: 'main' },
      { key: '2', label: '2. Afaan Oromoo', next: 'main' },
      { key: '3', label: '3. Wolaytta', next: 'main' },
      { key: '4', label: '4. English', next: 'main' },
      { key: '0', label: '0. Back', next: 'main' },
    ],
  },
  listSuccess: {
    title: '✅ Listing Published!',
    prompt: 'Your harvest lot has been broadcasted to 85 verified Addis Ababa buyers.\nSMS confirmation sent.\n\nReply:\n0. Main Menu',
    options: [{ key: '0', label: '0. Return to Main Menu', next: 'main' }],
  },
  freightSuccess: {
    title: '✅ Truck Reserved!',
    prompt: 'Driver notified! Confirmation code: #TRK-8821.\nDriver will call your phone for farm pickup.\n\nReply:\n0. Main Menu',
    options: [{ key: '0', label: '0. Return to Main Menu', next: 'main' }],
  },
  escrowSuccess: {
    title: '✅ Escrow Locked!',
    prompt: '145,000 ETB securely held in Telebirr escrow.\nFunds release upon GPS cargo delivery verification.\n\nReply:\n0. Main Menu',
    options: [{ key: '0', label: '0. Return to Main Menu', next: 'main' }],
  },
  escrowReleaseSuccess: {
    title: '🎉 Payout Dispatched!',
    prompt: '145,000 ETB successfully transferred to Farmer Alemu\'s Telebirr account (*994#).\nTransaction: #ETB-8839210.\n\nReply:\n0. Main Menu',
    options: [{ key: '0', label: '0. Return to Main Menu', next: 'main' }],
  },
};

export default function UssdSimulatorModal({ isOpen, onClose }) {
  const [currentMenuKey, setCurrentMenuKey] = useState('main');
  const [dialInput, setDialInput] = useState('*8028#');
  const [isSessionActive, setIsSessionActive] = useState(false);

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMenu = USSD_MENUS[currentMenuKey] || USSD_MENUS.main;

  const handleDial = () => {
    setIsSessionActive(true);
    setCurrentMenuKey('main');
  };

  const handleOptionSelect = (nextKey) => {
    setCurrentMenuKey(nextKey);
  };

  const handleKeypadPress = (val) => {
    if (!isSessionActive) {
      setDialInput((prev) => prev + val);
    } else {
      // Find matching option
      const opt = currentMenu.options.find((o) => o.key === val);
      if (opt) {
        handleOptionSelect(opt.next);
      }
    }
  };

  const handleResetSession = () => {
    setIsSessionActive(false);
    setCurrentMenuKey('main');
    setDialInput('*8028#');
  };

  const handleCloseModal = () => {
    handleResetSession();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleCloseModal}>
      <div className="modal-card ussd-simulator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">📲 Rural Offline Inclusion Technology</span>
            <h2>Offline USSD & SMS Simulator (*8028# / *994#)</h2>
            <p className="modal-subtitle">
              How rural Ethiopian smallholders trade, check farmgate prices, and book trucks without internet.
            </p>
          </div>
          <button className="modal-close-btn" onClick={handleCloseModal} title="Close Simulator">✕</button>
        </div>

        <div className="ussd-sim-container">
          {/* Feature Phone Simulator Shell */}
          <div className="feature-phone-shell">
            {/* Phone Speaker & Brand */}
            <div className="phone-top-speaker">
              <span className="speaker-slot"></span>
              <span className="phone-brand">ETHIO TELECOM 4G/2G</span>
            </div>

            {/* LCD Screen */}
            <div className="phone-lcd-screen">
              <div className="lcd-status-bar">
                <span>📶 EthioTel</span>
                <span>🔋 94%</span>
              </div>

              {!isSessionActive ? (
                <div className="lcd-idle-screen">
                  <div className="lcd-clock">14:30</div>
                  <div className="lcd-date">Friday, Aug 15</div>
                  <div className="lcd-prompt">Dial shortcode to begin:</div>
                  <div className="lcd-dial-display">{dialInput}</div>
                  <button className="phone-call-btn" onClick={handleDial}>
                    📞 Dial *8028#
                  </button>
                </div>
              ) : (
                <div className="lcd-session-screen">
                  <div className="lcd-menu-header">{currentMenu.title}</div>
                  <pre className="lcd-menu-prompt">{currentMenu.prompt}</pre>
                  <div className="lcd-menu-options">
                    {currentMenu.options.map((opt) => (
                      <button
                        key={opt.key}
                        className="lcd-opt-btn"
                        onClick={() => handleOptionSelect(opt.next)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Phone Call / End Quick Action Bar */}
            <div className="phone-action-row">
              <button
                className="phone-green-call-btn"
                onClick={handleDial}
                title="Call / Dial"
              >
                📞 Call
              </button>
              <button
                className="phone-red-end-btn"
                onClick={handleCloseModal}
                title="End Session & Close"
              >
                🔴 End / Close
              </button>
            </div>

            {/* Phone Keypad */}
            <div className="phone-keypad-grid">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                <button
                  key={key}
                  className="phone-key-btn"
                  onClick={() => handleKeypadPress(key)}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Bottom Controls */}
            <div className="phone-bottom-actions">
              <button className="phone-reset-btn" onClick={handleResetSession}>
                🔄 Restart USSD Session
              </button>
              <button className="phone-exit-btn" onClick={handleCloseModal}>
                ✕ Close Simulator
              </button>
            </div>
          </div>

          {/* Educational Sidebar Info */}
          <div className="ussd-info-sidebar">
            <h3>🌾 Why Offline USSD is Critical for Ethiopia</h3>
            <ul className="ussd-benefit-list">
              <li>
                <strong>📶 100% Zero-Data Access:</strong> Works on basic $12 feature phones across rural Wolaita, Bale, Jimma, and Gojjam with no WiFi or mobile data.
              </li>
              <li>
                <strong>🇪🇹 Multilingual IVR Voice:</strong> Farmers who cannot read can press 1 for spoken Amharic, Afaan Oromoo, or Wolaytta.
              </li>
              <li>
                <strong>💳 Direct Telebirr Integration:</strong> Escrow deposits and releases trigger instant SMS payment receipts directly to <code>*994#</code>.
              </li>
              <li>
                <strong>🚚 SMS Driver Dispatch:</strong> Transporters receive SMS notifications with GPS coordinates and cargo quintal load instructions.
              </li>
            </ul>

            <div className="ussd-try-preset">
              <p>💡 <strong>Try this live simulation:</strong></p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsSessionActive(true);
                  setCurrentMenuKey('prices');
                }}
              >
                1. Test Farmgate Price Query
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsSessionActive(true);
                  setCurrentMenuKey('freight');
                }}
              >
                2. Test Booking Isuzu Truck
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsSessionActive(true);
                  setCurrentMenuKey('escrow');
                }}
              >
                3. Test Telebirr Escrow Release
              </button>
            </div>

            <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={handleCloseModal}>
              ✕ Close USSD Simulator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
