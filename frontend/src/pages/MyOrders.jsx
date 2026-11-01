import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { orderService } from '../services/orderService';
import ProductThumb from '../components/ProductThumb';
import ReviewForm from '../components/ReviewForm';
import EscrowPaymentModal from '../components/EscrowPaymentModal';

const STATUS_LABEL = {
  pending: 'Pending Acceptance',
  accepted: 'Accepted (Escrow Held)',
  in_transit: 'In Transit / Dispatched',
  declined: 'Declined',
  completed: 'Delivered & Funds Released',
  cancelled: 'Cancelled',
};

function StatusBadge({ status, paymentStatus }) {
  if (paymentStatus === 'escrow_held' && status === 'accepted') {
    return <span className="badge badge-escrow">🔒 Telebirr Escrow Held</span>;
  }
  if (paymentStatus === 'released_to_farmer') {
    return <span className="badge badge-accepted">💰 Funds Released to Farmer</span>;
  }
  if (paymentStatus === 'pending_payment') {
    return <span className="badge badge-pending">⏳ Escrow Payment Pending</span>;
  }
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status] || status}</span>;
}

export default function MyOrders() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isFarmer = user?.role === 'farmer' || user?.role === 'cooperative';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);

  const loadOrders = () => {
    setLoading(true);
    orderService
      .getMine()
      .then((data) => setOrders(data.orders || []))
      .catch(() => setError('Could not load your orders.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (id, status) => {
    setBusyId(id);
    try {
      const { order } = await orderService.updateStatus(id, status);
      setOrders((prev) => prev.map((o) => (o._id === id ? order : o)));
    } catch {
      setError('Could not update that request. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const visibleOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="orders-page">
      <div className="page-intro">
        <span className="eyebrow">{isFarmer ? 'Incoming Produce Requests' : 'My Purchase Requests'}</span>
        <h1>{isFarmer ? 'Manage Buyer Orders & Dispatches' : 'Track Orders & Escrow Payments'}</h1>
        <p>
          {isFarmer
            ? 'Buyers who requested your harvest. Accept orders, ship via freight, and receive guaranteed Telebirr payment.'
            : 'Track the real-time status of your crop orders with 100% Telebirr escrow protection.'}
        </p>
      </div>

      <div className="admin-tabs">
        {['all', 'pending', 'accepted', 'in_transit', 'completed'].map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)} disabled={filter === tab}>
            {tab === 'all' ? 'All Orders' : STATUS_LABEL[tab] || tab}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="page-loading">Loading order requests...</p>
      ) : visibleOrders.length === 0 ? (
        <div className="empty-card">
          {isFarmer
            ? "No incoming requests yet. Once buyers order your produce, they'll appear here."
            : "You haven't placed any crop requests yet. Browse the marketplace to find fresh produce."}
        </div>
      ) : (
        <div className="orders-list">
          {visibleOrders.map((order) => (
            <div className="order-card" key={order._id}>
              <ProductThumb product={order.product} size={64} />
              <div className="order-card-main">
                <div className="order-card-heading">
                  <Link to={`/products/${order.product?._id}`}>
                    {order.product?.title || 'Produce Listing'}
                  </Link>
                  <StatusBadge status={order.status} paymentStatus={order.paymentStatus} />
                </div>

                {/* Visual Escrow & Order Progress Stepper */}
                <div className="escrow-stepper">
                  <div className={`step-node ${order.status !== 'declined' ? 'active' : ''}`}>
                    <span className="step-num">1</span>
                    <span className="step-lbl">Requested</span>
                  </div>
                  <div className={`step-line ${['accepted', 'in_transit', 'completed'].includes(order.status) || order.paymentStatus === 'escrow_held' ? 'active' : ''}`} />
                  <div className={`step-node ${['accepted', 'in_transit', 'completed'].includes(order.status) || order.paymentStatus === 'escrow_held' ? 'active' : ''}`}>
                    <span className="step-num">2</span>
                    <span className="step-lbl">Escrow Held</span>
                  </div>
                  <div className={`step-line ${['in_transit', 'completed'].includes(order.status) ? 'active' : ''}`} />
                  <div className={`step-node ${['in_transit', 'completed'].includes(order.status) ? 'active' : ''}`}>
                    <span className="step-num">3</span>
                    <span className="step-lbl">In Transit</span>
                  </div>
                  <div className={`step-line ${order.status === 'completed' ? 'active' : ''}`} />
                  <div className={`step-node ${order.status === 'completed' ? 'active' : ''}`}>
                    <span className="step-num">4</span>
                    <span className="step-lbl">Delivered</span>
                  </div>
                </div>

                <div className="order-details-meta">
                  <p>
                    {isFarmer ? `👤 Buyer: ${order.buyer?.name}` : `👨‍🌾 Producer: ${order.farmer?.name}`} &middot;{' '}
                    <strong>{order.quantity} {order.unit}</strong> &middot;{' '}
                    <span className="text-highlight">Total: {order.totalPrice ? order.totalPrice.toLocaleString() : (order.quantity * (order.product?.price || 0)).toLocaleString()} ETB</span>
                  </p>
                  <p>
                    💳 Method: <strong>{order.paymentMethod?.toUpperCase()}</strong> &middot;{' '}
                    {order.escrowTransactionId && <span className="text-code">Tx: {order.escrowTransactionId} &middot; </span>}
                    📞 Contact: {order.contactPhone}
                  </p>
                  {order.deliveryAddress?.city && (
                    <p>📍 Delivery Destination: {order.deliveryAddress.city} {order.deliveryAddress.specificAddress ? `(${order.deliveryAddress.specificAddress})` : ''}</p>
                  )}
                  {order.note && <p className="order-card-note">"{order.note}"</p>}
                </div>

                {/* Quick Voucher Button */}
                <div className="order-receipt-quick-row">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setActivePaymentOrder(order)}
                  >
                    📜 {order.paymentStatus === 'escrow_held' || order.paymentStatus === 'released_to_farmer' ? 'View Escrow Voucher' : '⚡ Complete Escrow Payment'}
                  </button>
                </div>
              </div>

              {/* Farmer Actions */}
              {isFarmer && order.status === 'pending' && (
                <div className="order-card-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={busyId === order._id}
                    onClick={() => handleStatusChange(order._id, 'accepted')}
                  >
                    Accept Order
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={busyId === order._id}
                    onClick={() => handleStatusChange(order._id, 'declined')}
                  >
                    Decline
                  </button>
                </div>
              )}

              {isFarmer && order.status === 'accepted' && (
                <div className="order-card-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={busyId === order._id}
                    onClick={() => handleStatusChange(order._id, 'in_transit')}
                  >
                    Dispatch & Ship 🚚
                  </button>
                </div>
              )}

              {isFarmer && order.status === 'in_transit' && (
                <div className="order-card-actions">
                  <span className="badge badge-escrow">Waiting for buyer receipt...</span>
                </div>
              )}

              {/* Buyer Actions: Confirm delivery & Release escrow funds */}
              {!isFarmer && (order.status === 'in_transit' || order.status === 'accepted') && (
                <div className="order-card-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={busyId === order._id}
                    onClick={() => handleStatusChange(order._id, 'completed')}
                  >
                    ✅ {t('confirmReceipt')}
                  </button>
                </div>
              )}

              {!isFarmer && order.status === 'completed' && (
                <div className="order-card-actions">
                  {order.reviewed ? (
                    <span className="badge badge-accepted">Reviewed ⭐</span>
                  ) : (
                    <ReviewForm
                      order={order}
                      onSubmitted={() =>
                        setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, reviewed: true } : o)))
                      }
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Interactive Payment / Voucher Modal */}
      {activePaymentOrder && (
        <EscrowPaymentModal
          isOpen={!!activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          order={activePaymentOrder}
          product={activePaymentOrder.product}
          onPaymentSuccess={(updatedOrder) => {
            setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
          }}
        />
      )}
    </div>
  );
}