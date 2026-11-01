import { useState, useEffect } from 'react';
import { useCurrencyUnit } from '../context/CurrencyUnitContext';
import { orderService } from '../services/orderService';

export default function EscrowPaymentModal({ isOpen, onClose, order, product, onPaymentSuccess }) {
  const { formatPrice } = useCurrencyUnit();

  const [paymentMethod, setPaymentMethod] = useState('telebirr'); // telebirr | cbe_birr | chapa
  const [telebirrMode, setTelebirrMode] = useState('qr'); // qr | ussd
  const [phone, setPhone] = useState('0912345678');
  const [ussdStep, setUssdStep] = useState('idle'); // idle | prompt | verifying | success
  const [pin, setPin] = useState('');
  const [cbeAccount, setCbeAccount] = useState('1000192837465');
  const [otp, setOtp] = useState('');
  const [selectedBank, setSelectedBank] = useState('abyssinia');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [txReceipt, setTxReceipt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minute countdown
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (order?.contactPhone) {
      setPhone(order.contactPhone);
    }
  }, [order]);

  // Countdown timer for QR code validity
  useEffect(() => {
    if (!isOpen || paymentCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, paymentCompleted]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen) return null;

  const totalAmount = order?.totalPrice || (product?.price ? (order?.quantity || 1) * product.price : 0);
  const quantity = order?.quantity || 1;
  const unit = order?.unit || product?.unit || 'Kg';
  const itemTitle = product?.title || order?.product?.title || 'Agricultural Produce';
  const sellerName = product?.farmer?.name || product?.cooperativeName || order?.farmer?.name || 'Verified Agro Producer';

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSimulatePayment = async (customTxId) => {
    setIsProcessing(true);
    setErrorMsg('');
    const txId = customTxId || `ET-ESCROW-${paymentMethod.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;

    try {
      if (order?._id) {
        const response = await orderService.pay(order._id, {
          paymentMethod,
          transactionRef: txId,
        });
        setTxReceipt({
          txId,
          method: paymentMethod,
          amount: totalAmount,
          date: new Date().toLocaleString(),
          productTitle: itemTitle,
          seller: sellerName,
          buyerPhone: phone,
          orderId: order._id,
        });
        setPaymentCompleted(true);
        if (onPaymentSuccess) {
          onPaymentSuccess(response.order || order);
        }
      } else {
        // Direct simulation mode before creating order
        setTxReceipt({
          txId,
          method: paymentMethod,
          amount: totalAmount,
          date: new Date().toLocaleString(),
          productTitle: itemTitle,
          seller: sellerName,
          buyerPhone: phone,
        });
        setPaymentCompleted(true);
        if (onPaymentSuccess) {
          onPaymentSuccess({ paymentMethod, transactionRef: txId });
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Payment simulation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTelebirrUssdSubmit = (e) => {
    e.preventDefault();
    setUssdStep('prompt');
  };

  const handlePinConfirm = () => {
    if (pin.length < 4) {
      setErrorMsg('Please enter a 4-digit PIN');
      return;
    }
    setUssdStep('verifying');
    setTimeout(() => {
      handleSimulatePayment();
    }, 1500);
  };

  return (
    <div className="modal-backdrop escrow-payment-backdrop" onClick={() => !isProcessing && onClose()}>
      <div className="modal-card escrow-payment-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="escrow-modal-header">
          <div className="escrow-brand-title">
            <span className="escrow-lock-icon">🔒</span>
            <div>
              <h3>AgroGebeya Escrow Payment Vault</h3>
              <p className="escrow-subtitle">Multi-Signature Protected &bull; National Agri-Trade Treasury</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={isProcessing}>✕</button>
        </div>

        {/* Order Summary Strip */}
        <div className="escrow-summary-strip">
          <div className="summary-left">
            <span className="summary-crop-tag">{itemTitle}</span>
            <span className="summary-qty-tag">{quantity} {unit}</span>
            <span className="summary-seller-tag">👨‍🌾 {sellerName}</span>
          </div>
          <div className="summary-right">
            <span className="summary-total-label">Total Escrow Deposit:</span>
            <strong className="summary-total-amount">{formatPrice(totalAmount)}</strong>
          </div>
        </div>

        {paymentCompleted && txReceipt ? (
          /* Payment Success & Escrow Deposit Voucher */
          <div className="escrow-success-view">
            <div className="escrow-success-badge">
              <div className="success-icon-bounce">✓</div>
              <h2>Payment Locked in Escrow!</h2>
              <p>Funds are safely held in the AgroGebeya National Treasury until you inspect and accept the produce arrival.</p>
            </div>

            <div className="escrow-voucher-card" id="printable-escrow-receipt">
              <div className="voucher-header">
                <div className="voucher-gov-seal">🇪🇹 OFFICIAL ESCROW DEPOSIT VOUCHER</div>
                <div className="voucher-tx-id">TX: <code>{txReceipt.txId}</code></div>
              </div>
              <div className="voucher-grid">
                <div className="v-row">
                  <span>Commodity:</span>
                  <strong>{txReceipt.productTitle}</strong>
                </div>
                <div className="v-row">
                  <span>Volume:</span>
                  <strong>{quantity} {unit}</strong>
                </div>
                <div className="v-row">
                  <span>Amount Deposited:</span>
                  <strong className="v-amount">{formatPrice(txReceipt.amount)}</strong>
                </div>
                <div className="v-row">
                  <span>Payment Channel:</span>
                  <strong className="v-channel">{txReceipt.method.toUpperCase()} ESCROW</strong>
                </div>
                <div className="v-row">
                  <span>Farmer / Union:</span>
                  <span>{txReceipt.seller}</span>
                </div>
                <div className="v-row">
                  <span>Buyer Phone:</span>
                  <span>{txReceipt.buyerPhone}</span>
                </div>
                <div className="v-row">
                  <span>Security Guarantee:</span>
                  <span className="v-guarantee">🛡️ Telebirr Multi-Sig 100% Guaranteed</span>
                </div>
              </div>
            </div>

            <div className="escrow-modal-actions">
              <button className="btn btn-secondary" onClick={() => window.print()}>
                🖨️ Print Escrow Voucher
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                Done & View Order Status
              </button>
            </div>
          </div>
        ) : (
          /* Payment Selection & Methods */
          <div className="escrow-modal-body">
            {errorMsg && <div className="payment-error-banner">{errorMsg}</div>}

            {/* Provider Tabs */}
            <div className="payment-provider-tabs">
              <button
                type="button"
                className={`provider-tab telebirr-tab ${paymentMethod === 'telebirr' ? 'active' : ''}`}
                onClick={() => { setPaymentMethod('telebirr'); setErrorMsg(''); }}
              >
                <span className="provider-icon">📱</span>
                <div className="provider-info">
                  <strong>Telebirr</strong>
                  <small>Ethio Telecom (*127#)</small>
                </div>
                {paymentMethod === 'telebirr' && <span className="active-dot"></span>}
              </button>

              <button
                type="button"
                className={`provider-tab cbe-tab ${paymentMethod === 'cbe_birr' ? 'active' : ''}`}
                onClick={() => { setPaymentMethod('cbe_birr'); setErrorMsg(''); }}
              >
                <span className="provider-icon">🏦</span>
                <div className="provider-info">
                  <strong>CBE Birr</strong>
                  <small>Commercial Bank</small>
                </div>
                {paymentMethod === 'cbe_birr' && <span className="active-dot"></span>}
              </button>

              <button
                type="button"
                className={`provider-tab chapa-tab ${paymentMethod === 'chapa' ? 'active' : ''}`}
                onClick={() => { setPaymentMethod('chapa'); setErrorMsg(''); }}
              >
                <span className="provider-icon">⚡</span>
                <div className="provider-info">
                  <strong>Chapa</strong>
                  <small>Multi-Bank Direct</small>
                </div>
                {paymentMethod === 'chapa' && <span className="active-dot"></span>}
              </button>
            </div>

            {/* Content per Provider */}
            {paymentMethod === 'telebirr' && (
              <div className="telebirr-panel">
                <div className="telebirr-sub-switch">
                  <button
                    type="button"
                    className={`sub-switch-btn ${telebirrMode === 'qr' ? 'active' : ''}`}
                    onClick={() => setTelebirrMode('qr')}
                  >
                    📸 Scan SuperApp QR
                  </button>
                  <button
                    type="button"
                    className={`sub-switch-btn ${telebirrMode === 'ussd' ? 'active' : ''}`}
                    onClick={() => setTelebirrMode('ussd')}
                  >
                    📲 Push Notification / *127#
                  </button>
                </div>

                {telebirrMode === 'qr' ? (
                  <div className="qr-checkout-box">
                    <div className="qr-visual-wrapper">
                      {/* Stylized high-res dynamic QR code simulation */}
                      <div className="simulated-qr-frame">
                        <svg viewBox="0 0 100 100" className="qr-svg-graphic">
                          <rect x="0" y="0" width="100" height="100" fill="#ffffff" rx="8" />
                          <rect x="8" y="8" width="28" height="28" fill="#0b72b9" rx="4" />
                          <rect x="14" y="14" width="16" height="16" fill="#ffffff" rx="2" />
                          <rect x="18" y="18" width="8" height="8" fill="#0b72b9" />
                          
                          <rect x="64" y="8" width="28" height="28" fill="#0b72b9" rx="4" />
                          <rect x="70" y="14" width="16" height="16" fill="#ffffff" rx="2" />
                          <rect x="74" y="18" width="8" height="8" fill="#0b72b9" />

                          <rect x="8" y="64" width="28" height="28" fill="#0b72b9" rx="4" />
                          <rect x="14" y="70" width="16" height="16" fill="#ffffff" rx="2" />
                          <rect x="18" y="74" width="8" height="8" fill="#0b72b9" />

                          {/* Pattern dots */}
                          <rect x="42" y="12" width="6" height="6" fill="#1e293b" />
                          <rect x="52" y="18" width="6" height="6" fill="#1e293b" />
                          <rect x="42" y="30" width="6" height="6" fill="#0b72b9" />
                          <rect x="42" y="44" width="16" height="16" fill="#0b72b9" rx="3" />
                          <rect x="12" y="44" width="6" height="6" fill="#1e293b" />
                          <rect x="24" y="50" width="6" height="6" fill="#1e293b" />
                          <rect x="68" y="44" width="6" height="6" fill="#1e293b" />
                          <rect x="80" y="52" width="8" height="8" fill="#0b72b9" />
                          <rect x="44" y="68" width="8" height="8" fill="#1e293b" />
                          <rect x="58" y="76" width="6" height="6" fill="#1e293b" />
                          <rect x="74" y="74" width="14" height="14" fill="#0b72b9" rx="2" />
                        </svg>
                        <div className="qr-center-logo">telebirr</div>
                      </div>
                      <div className="qr-instructions">
                        <div className="qr-timer-pill">
                          ⏱️ Valid for: <strong>{formatTimer(timeLeft)}</strong>
                        </div>
                        <h4>Scan with your Telebirr SuperApp</h4>
                        <p>Open Telebirr &rarr; Tap 'Scan QR' &rarr; Confirm {formatPrice(totalAmount)} Escrow Deposit.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-telebirr btn-block"
                      onClick={() => handleSimulatePayment()}
                      disabled={isProcessing}
                    >
                      {isProcessing ? '⏳ Verifying Telebirr Escrow...' : '⚡ Simulate Instant Telebirr App Approval'}
                    </button>
                  </div>
                ) : (
                  <div className="ussd-checkout-box">
                    {ussdStep === 'idle' && (
                      <form onSubmit={handleTelebirrUssdSubmit} className="ussd-input-form">
                        <label>
                          <strong>Enter Buyer Telebirr Registered Mobile Number:</strong>
                          <div className="phone-prefix-input">
                            <span className="flag-prefix">🇪🇹 +251</span>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="912 345 678"
                              required
                            />
                          </div>
                        </label>
                        <p className="ussd-hint">
                          We will trigger a USSD Flash Prompt directly on your mobile handset to authorize this escrow transfer.
                        </p>
                        <button type="submit" className="btn btn-telebirr btn-block">
                          📲 Send Telebirr USSD Push Prompt
                        </button>
                      </form>
                    )}

                    {ussdStep === 'prompt' && (
                      <div className="ussd-simulated-phone-popup">
                        <div className="phone-screen-top">
                          <span>Telebirr Flash Prompt *127#</span>
                        </div>
                        <div className="phone-screen-content">
                          <p>
                            <strong>AgroGebeya Ethiopia Treasury</strong> requests <strong>{formatPrice(totalAmount)}</strong> for Produce Escrow.
                          </p>
                          <label>
                            <span>Enter 4-Digit Telebirr PIN:</span>
                            <input
                              type="password"
                              maxLength="4"
                              value={pin}
                              onChange={(e) => setPin(e.target.value)}
                              placeholder="••••"
                              autoFocus
                              className="ussd-pin-field"
                            />
                          </label>
                          <div className="ussd-screen-btns">
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => { setUssdStep('idle'); setPin(''); }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-telebirr btn-sm"
                              onClick={handlePinConfirm}
                            >
                              Authorize Escrow Lock
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {ussdStep === 'verifying' && (
                      <div className="ussd-verifying-state">
                        <div className="telebirr-spinner"></div>
                        <h4>Contacting Ethio Telecom Telebirr Gateway...</h4>
                        <p>Locking funds in multi-signature escrow vault.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'cbe_birr' && (
              <div className="cbe-panel">
                <div className="cbe-form-card">
                  <label>
                    <strong>CBE Birr Account / Mobile Number:</strong>
                    <input
                      type="text"
                      value={cbeAccount}
                      onChange={(e) => setCbeAccount(e.target.value)}
                      placeholder="1000xxxxxxxx or 09xxxxxxxx"
                    />
                  </label>

                  <label>
                    <strong>SMS One-Time Confirmation PIN (OTP):</strong>
                    <div className="otp-input-group">
                      <input
                        type="text"
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="e.g. 748192"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setOtp('593812')}
                      >
                        Auto-Fill OTP
                      </button>
                    </div>
                  </label>

                  <div className="cbe-escrow-badge">
                    <span>🛡️ CBE Trust Guarantee</span>
                    <small>Funds are held directly in CBE Escrow Account #100098472910 until delivery sign-off.</small>
                  </div>

                  <button
                    type="button"
                    className="btn btn-cbe btn-block"
                    onClick={() => handleSimulatePayment()}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '⏳ Connecting to CBE Birr Core...' : `Authorize ${formatPrice(totalAmount)} via CBE Birr`}
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === 'chapa' && (
              <div className="chapa-panel">
                <div className="chapa-bank-selection">
                  <label><strong>Select Ethiopian Bank for Direct Transfer:</strong></label>
                  <div className="bank-pill-grid">
                    {[
                      { id: 'abyssinia', name: 'Bank of Abyssinia (Apollo)' },
                      { id: 'awash', name: 'Awash Bank' },
                      { id: 'dashen', name: 'Dashen Bank (Amole)' },
                      { id: 'cbe', name: 'Commercial Bank of Ethiopia' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        className={`bank-pill ${selectedBank === b.id ? 'active' : ''}`}
                        onClick={() => setSelectedBank(b.id)}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="chapa-security-notice">
                  <span>⚡ Powered by Chapa Ethiopia</span>
                  <p>Encrypted 256-bit payment gateway with automated Webhook verification and instant escrow deposit.</p>
                </div>

                <button
                  type="button"
                  className="btn btn-chapa btn-block"
                  onClick={() => handleSimulatePayment()}
                  disabled={isProcessing}
                >
                  {isProcessing ? '⏳ Securing with Chapa Gateway...' : `Pay & Lock ${formatPrice(totalAmount)} in Escrow`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
