import { useState } from 'react';

const ESCROW_STEPS = [
  {
    step: 1,
    title: 'Deposit to Mobile Escrow',
    desc: 'Buyer pays via Telebirr or CBE Birr. Funds are locked securely in the national escrow smart contract.',
    icon: '💳',
    badge: '100% Protected',
  },
  {
    step: 2,
    title: 'Dispatched & Waybill Uploaded',
    desc: 'Farmer or Cooperative union loads the verified lot. Transporter uploads the digital GPS waybill.',
    icon: '🚚',
    badge: 'In Transit',
  },
  {
    step: 3,
    title: 'Terminal Inspection & Acceptance',
    desc: 'Buyer physically inspects crop moisture, purity grade, and weight at destination warehouse.',
    icon: '🔍',
    badge: 'Quality Check',
  },
  {
    step: 4,
    title: 'Instant Payout Release',
    desc: 'Upon OTP confirmation or arrival sign-off, escrow releases full payment directly to the smallholder farmer.',
    icon: '💰',
    badge: 'Instant Transfer',
  },
];

export default function EscrowTrustTimeline({ currentStep = 1 }) {
  const [activeStep, setActiveStep] = useState(currentStep);

  return (
    <div className="escrow-trust-card">
      <div className="escrow-trust-header">
        <div className="escrow-badge-pill">
          <span className="shield-icon">🛡️</span>
          <span>Telebirr & CBE Escrow Protection Protocol</span>
        </div>
        <span className="escrow-guarantee-tag">🔒 Zero-Loss Guarantee</span>
      </div>

      <p className="escrow-trust-sub">
        Every transaction on AgroGebeya Ethiopia is guarded by multi-signature escrow. Your money is never released until you inspect and approve the harvest.
      </p>

      {/* Stepper Grid */}
      <div className="escrow-stepper-interactive">
        {ESCROW_STEPS.map((item) => {
          const isDone = item.step < activeStep;
          const isCurrent = item.step === activeStep;
          return (
            <div
              key={item.step}
              className={`escrow-step-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
              onClick={() => setActiveStep(item.step)}
            >
              <div className="step-badge-indicator">
                <span className="step-icon">{item.icon}</span>
                <span className="step-number">{isDone ? '✓' : item.step}</span>
              </div>
              <div className="step-body">
                <strong>{item.title}</strong>
                <p>{item.desc}</p>
                <span className="step-status-chip">{item.badge}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Step Preview */}
      <div className="escrow-step-interactive-footer">
        <span>Click any step above to inspect verification checkpoints.</span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setActiveStep((prev) => (prev % 4) + 1)}
        >
          Simulate Next Step ({activeStep}/4) &rarr;
        </button>
      </div>
    </div>
  );
}
