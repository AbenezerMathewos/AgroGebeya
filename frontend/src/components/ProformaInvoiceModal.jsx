import { useState, useEffect } from 'react';
import { useCurrencyUnit } from '../context/CurrencyUnitContext';

export default function ProformaInvoiceModal({ isOpen, onClose, product }) {
  const { formatPrice } = useCurrencyUnit();
  const [invoiceQuantity, setInvoiceQuantity] = useState(25); // in Quintals

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const unitPrice = product.price || 4900;
  const subtotal = unitPrice * invoiceQuantity;
  const freightTariff = Math.round(invoiceQuantity * 380); // 380 ETB per Qtl
  const ecxClearingFee = Math.round(subtotal * 0.015); // 1.5% ECX Fee
  const totalAmount = subtotal + freightTariff + ecxClearingFee;

  const invoiceNumber = `ET-ECX-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const currentDateGC = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const currentDateEC = '10 ጳጉሜ 2018 ዓ.ም';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop proforma-modal-backdrop" onClick={onClose}>
      <div className="modal-card proforma-modal printable-document" onClick={(e) => e.stopPropagation()}>
        {/* Top Control Bar (Hidden from Print) */}
        <div className="proforma-top-actions no-print">
          <div className="qty-selector-pill">
            <span className="qty-label">Lot Payload:</span>
            <input
              type="number"
              min="1"
              max="1000"
              value={invoiceQuantity}
              onChange={(e) => setInvoiceQuantity(Math.max(1, Number(e.target.value)))}
            />
            <span>Quintals (100 Kg Bags)</span>
          </div>

          <div className="proforma-buttons">
            <button className="btn btn-primary btn-sm print-trigger-btn" onClick={handlePrint}>
              🖨️ Print Official 1-Page Invoice / PDF
            </button>
            <button className="modal-close-btn" onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        {/* Official Single-Page Document */}
        <div className="proforma-paper" id="printable-ecx-invoice">
          {/* Header */}
          <div className="proforma-header-section">
            <div className="proforma-gov-seal">
              <div className="seal-emblem-box">🇪🇹</div>
              <div className="seal-text-group">
                <h3>FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA</h3>
                <h4>MINISTRY OF AGRICULTURE &bull; ETHIOPIA COMMODITY EXCHANGE (ECX)</h4>
                <div className="seal-sub">National Agriculture Traceability & Telebirr Escrow Protocol</div>
              </div>
            </div>

            <div className="proforma-doc-meta">
              <span className="proforma-badge">OFFICIAL PRO-FORMA INVOICE</span>
              <div className="doc-meta-row"><strong>Invoice #:</strong> <span>{invoiceNumber}</span></div>
              <div className="doc-meta-row"><strong>Date (G.C.):</strong> <span>{currentDateGC}</span></div>
              <div className="doc-meta-row"><strong>Date (E.C.):</strong> <span>{currentDateEC}</span></div>
            </div>
          </div>

          <div className="proforma-gold-line"></div>

          {/* Parties Box */}
          <div className="proforma-parties-grid">
            <div className="party-box">
              <div className="party-role-tag">PRODUCER / SELLER (አምራች ህብረት ስራ ማህበር)</div>
              <strong className="party-name">{product.farmer?.name || product.cooperativeName || 'Primary Farmers Cooperative Union'}</strong>
              <div className="party-detail">📍 Origin Hub: {product.location || 'Boditi Cooperative Depot'}, {product.region || 'South Ethiopia'}</div>
              <div className="party-detail">📞 Phone: {product.owner?.phone || '+251 912 345 678'}</div>
              <div className="party-detail">🛡️ MoA Farmer Reg ID: <code>#ET-SODO-F8831</code></div>
            </div>

            <div className="party-box">
              <div className="party-role-tag">CLEARING, LOGISTICS & TELEBIRR ESCROW</div>
              <strong className="party-name">Telebirr Multi-Signature Escrow Protocol</strong>
              <div className="party-detail">🏦 Escrow Trust Account: <code>*994# / AgroGebeya-Treasury</code></div>
              <div className="party-detail">🏢 Destination Terminal: Addis Ababa Central Wholesale (Ehil Berenda)</div>
              <div className="party-detail">🚚 Logistics Dispatch: Isuzu Return Freight Sharing Corridor</div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="proforma-items-table">
            <thead>
              <tr>
                <th style={{ width: '42%' }}>Commodity & ECX Specification</th>
                <th style={{ width: '18%' }}>Lab Standard</th>
                <th style={{ width: '12%' }}>Quantity</th>
                <th style={{ width: '14%' }}>Unit Rate</th>
                <th style={{ width: '14%' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{product.title}</strong>
                  <div className="item-sub">Grade: {product.grade || 'Grade 1'} &bull; Origin: {product.region || 'South Ethiopia'}</div>
                </td>
                <td>
                  <div>Moisture &le; 11.5%</div>
                  <div className="item-sub">Purity &ge; 98.5%</div>
                </td>
                <td><strong>{invoiceQuantity} Qtl</strong></td>
                <td>{formatPrice(unitPrice)}</td>
                <td><strong>{formatPrice(subtotal)}</strong></td>
              </tr>
              <tr>
                <td colSpan="3">
                  <strong>Return-Trip Freight Transit Tariff</strong>
                  <div className="item-sub">Farmgate Hub ➔ Addis Ababa Terminal (330 Km Highway Corridor)</div>
                </td>
                <td>380 ETB / Qtl</td>
                <td>{formatPrice(freightTariff)}</td>
              </tr>
              <tr>
                <td colSpan="3">
                  <strong>ECX Terminal Quality Inspection & Weighbridge Seal</strong>
                  <div className="item-sub">1.5% Standard Clearing Fee</div>
                </td>
                <td>1.5% Fee</td>
                <td>{formatPrice(ecxClearingFee)}</td>
              </tr>
            </tbody>
          </table>

          {/* Financial Summary & Escrow Guarantee */}
          <div className="proforma-financial-summary">
            <div className="proforma-escrow-stamp">
              <div className="stamp-box">
                <div className="stamp-title">🛡️ TELEBIRR ESCROW GUARANTEED</div>
                <div className="stamp-code">ET-TELEBIRR-ESC-88492-VALID</div>
                <small>Funds held in secure national escrow until buyer verifies grade & delivery.</small>
              </div>
            </div>

            <div className="summary-numbers-box">
              <div className="summary-line">
                <span>Commodity Subtotal:</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="summary-line">
                <span>Return Freight Tariff:</span>
                <strong>{formatPrice(freightTariff)}</strong>
              </div>
              <div className="summary-line">
                <span>ECX Clearing & Inspection:</span>
                <strong>{formatPrice(ecxClearingFee)}</strong>
              </div>
              <div className="summary-line total-highlight">
                <span>Total Escrow Amount:</span>
                <strong>{formatPrice(totalAmount)}</strong>
              </div>
            </div>
          </div>

          {/* Official Signatures */}
          <div className="proforma-signatures">
            <div className="sig-block">
              <div className="sig-line">____________________________________</div>
              <strong>Producer Union Authorized Officer</strong>
              <small>Authorized Farmers Cooperative Union</small>
            </div>
            <div className="sig-block">
              <div className="sig-line">____________________________________</div>
              <strong>ECX Inspector & Escrow Officer</strong>
              <small>Addis Ababa Terminal Trade Clearing</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
