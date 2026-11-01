import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { orderService } from '../services/orderService';
import EscrowPaymentModal from './EscrowPaymentModal';

const emptyOrderForm = {
  quantity: '',
  fulfillment: 'pickup',
  paymentMethod: 'telebirr',
  contactPhone: '',
  deliveryAddress: {
    region: 'Addis Ababa',
    city: '',
    specificAddress: '',
  },
  note: '',
};

export default function OrderPanel({ product }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyOrderForm);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [busy, setBusy] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [escrowModalOpen, setEscrowModalOpen] = useState(false);

  if (!product.isAvailable) {
    return (
      <div className="order-panel muted">
        <span className="eyebrow">Direct Trade</span>
        <strong>Currently unavailable</strong>
        <p>This harvest is marked sold out. Check back later or browse other listings.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="order-panel">
        <span className="eyebrow">Direct Trade</span>
        <h2>{t('requestProduce')}</h2>
        <p>Sign in to send the farmer or cooperative an order with Telebirr Escrow protection.</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          Sign in to order
        </button>
      </div>
    );
  }

  const currentUserId = user._id || user.id;
  const isOwner = product.owner && currentUserId.toString() === (product.owner._id || product.owner).toString();
  if (isOwner) {
    return (
      <div className="order-panel owner-panel">
        <span className="eyebrow">Your Listing</span>
        <h2>Manage this produce</h2>
        <p>You listed this harvest. Keep quantity and price up to date on your dashboard.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/farmer/dashboard')}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const quantityNum = Number(form.quantity) || 0;
  const unitPrice = product.price || 0;
  const totalPrice = Math.round(quantityNum * unitPrice * 100) / 100;

  const submit = async (e) => {
    e.preventDefault();
    if (quantityNum < (product.minOrderQuantity || 1)) {
      setMessage(`Minimum order quantity is ${product.minOrderQuantity || 1} ${product.unit || 'Kg'}`);
      setMessageType('error');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const { order } = await orderService.create({
        ...form,
        productId: product._id,
        quantity: quantityNum,
      });
      setCreatedOrder(order);
      setMessage('✅ Order request submitted! Opening Telebirr / CBE Escrow authorization...');
      setMessageType('success');
      
      // If it's an escrow method, open the interactive escrow vault checkout modal
      if (['telebirr', 'cbe_birr', 'chapa'].includes(form.paymentMethod)) {
        setEscrowModalOpen(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not send request.');
      setMessageType('error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form className="order-panel" onSubmit={submit}>
        <span className="eyebrow">Direct Marketplace &middot; Escrow Protection</span>
        <h2>{t('requestProduce')}</h2>

        <div className="compact-fields">
          <div className="field-group">
            <label>Quantity ({product.unit || 'Kg'})</label>
            <input
              required
              type="number"
              min={product.minOrderQuantity || 1}
              max={product.quantity}
              placeholder={`Qty (${product.minOrderQuantity || 1}+)`}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>

          <div className="field-group">
            <label>Fulfillment</label>
            <select
              value={form.fulfillment}
              onChange={(e) => setForm({ ...form, fulfillment: e.target.value })}
            >
              <option value="pickup">Self Pickup at Farmgate / Depot</option>
              <option value="delivery">Direct Seller Delivery</option>
              <option value="freight_pool">Freight-Sharing Pool (Isuzu)</option>
            </select>
          </div>
        </div>

        <div className="field-group">
          <label>{t('paymentMethod')}</label>
          <select
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
          >
            <option value="telebirr">📱 Telebirr Escrow (SuperApp / *127#)</option>
            <option value="cbe_birr">🏦 CBE Birr (Commercial Bank Escrow)</option>
            <option value="chapa">⚡ Chapa Direct Multi-Bank Pay</option>
            <option value="cash_on_delivery">💵 {t('cashOnDelivery')}</option>
          </select>
        </div>

        {form.fulfillment !== 'pickup' && (
          <div className="compact-fields">
            <div className="field-group">
              <label>Destination City / Woreda</label>
              <input
                required
                placeholder="e.g. Addis Ababa, Hawassa"
                value={form.deliveryAddress.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    deliveryAddress: { ...form.deliveryAddress, city: e.target.value },
                  })
                }
              />
            </div>
            <div className="field-group">
              <label>Specific Address</label>
              <input
                placeholder="e.g. Ehil Berenda Gate 2"
                value={form.deliveryAddress.specificAddress}
                onChange={(e) =>
                  setForm({
                    ...form,
                    deliveryAddress: { ...form.deliveryAddress, specificAddress: e.target.value },
                  })
                }
              />
            </div>
          </div>
        )}

        <div className="field-group">
          <label>Your Phone Number</label>
          <input
            required
            placeholder="+2519..."
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label>Optional Note</label>
          <textarea
            placeholder="Special packaging, delivery dates, or inspection requirements..."
            rows={2}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        {/* Order Total & Escrow calculation */}
        {totalPrice > 0 && (
          <div className="order-summary-box">
            <div className="summary-row">
              <span>Subtotal ({quantityNum} {product.unit}):</span>
              <strong>{totalPrice.toLocaleString()} ETB</strong>
            </div>
            <div className="summary-row">
              <span>Escrow Protection:</span>
              <span className="text-free">FREE (0 ETB)</span>
            </div>
            <div className="summary-row total-row">
              <span>Estimated Total:</span>
              <strong className="text-total">{totalPrice.toLocaleString()} ETB</strong>
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-block" disabled={busy || quantityNum <= 0}>
          {busy ? 'Processing...' : `Confirm & Request (${totalPrice > 0 ? totalPrice.toLocaleString() + ' ETB' : ''})`}
        </button>

        <p className="escrow-note">{t('escrowGuarantee')}</p>

        {message && (
          <p className={messageType === 'error' ? 'inline-message error' : 'inline-message success'}>
            {message}
          </p>
        )}
      </form>

      {/* Interactive Ethiopian Escrow Payment Modal */}
      {escrowModalOpen && createdOrder && (
        <EscrowPaymentModal
          isOpen={escrowModalOpen}
          onClose={() => setEscrowModalOpen(false)}
          order={createdOrder}
          product={product}
          onPaymentSuccess={(updatedOrder) => {
            setCreatedOrder(updatedOrder);
            setMessage('🔒 Escrow Payment Secured! You can track transit and release funds upon arrival in My Orders.');
          }}
        />
      )}
    </>
  );
}


