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
  const isFarmerRole = user?.role === 'farmer' || user?.role === 'cooperative';
  const isTransporter = user?.role === 'transporter';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [viewType, setViewType] = useState('all'); // 'all' | 'purchases' | 'sales' | 'delivery' | 'freight_pool'
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

  const currentUserId = (user?._id || user?.id)?.toString();

  const typedOrders = orders.filter((o) => {
    if (isTransporter) {
      if (viewType === 'delivery') return o.fulfillment === 'delivery';
      if (viewType === 'freight_pool') return o.fulfillment === 'freight_pool';
      return true;
    }
    const isBuyer =
      o.isBuyer !== undefined
        ? o.isBuyer
        : Boolean(currentUserId && (o.buyer?._id || o.buyer)?.toString() === currentUserId);
    if (viewType === 'purchases') return isBuyer;
    if (viewType === 'sales') return !isBuyer;
    return true;
  });

  const visibleOrders = filter === 'all' ? typedOrders : typedOrders.filter((o) => o.status === filter);

  const purchaseCount = orders.filter((o) =>
    o.isBuyer !== undefined
      ? o.isBuyer
      : Boolean(currentUserId && (o.buyer?._id || o.buyer)?.toString() === currentUserId)
  ).length;
  const salesCount = orders.filter((o) =>
    o.isBuyer !== undefined
      ? !o.isBuyer
      : Boolean(currentUserId && (o.buyer?._id || o.buyer)?.toString() !== currentUserId)
  ).length;
  const directDeliveryCount = orders.filter((o) => o.fulfillment === 'delivery').length;
  const poolDeliveryCount = orders.filter((o) => o.fulfillment === 'freight_pool').length;

  return (
    <div className="orders-page">
      <div className="page-intro">
        <span className="eyebrow">{isTransporter ? 'Logistics & Cargo Hub' : 'Transaction & Escrow Hub'}</span>
        <h1>{isTransporter ? 'Cargo Freight & Delivery Dispatches' : 'Order Tracking & Dispatches'}</h1>
        <p>
          {isTransporter
            ? 'Manage regional agricultural produce dispatches, haul harvests from farmgates, and confirm safe client delivery.'
            : 'Track real-time orders, manage escrow disbursements, dispatch freight, and confirm deliveries with 100% buyer & farmer protection.'}
        </p>
      </div>

      {/* Role-Agnostic Transaction Type Switcher */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {isTransporter ? (
          <>
            <button
              type="button"
              onClick={() => setViewType('all')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                border: 'none',
                background: viewType === 'all' ? '#10b981' : 'rgba(255,255,255,0.06)',
                color: viewType === 'all' ? '#ffffff' : 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              🚚 All Freight Dispatches ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setViewType('delivery')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                border: 'none',
                background: viewType === 'delivery' ? '#10b981' : 'rgba(255,255,255,0.06)',
                color: viewType === 'delivery' ? '#ffffff' : 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              📦 Direct Deliveries ({directDeliveryCount})
            </button>
            <button
              type="button"
              onClick={() => setViewType('freight_pool')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                border: 'none',
                background: viewType === 'freight_pool' ? '#10b981' : 'rgba(255,255,255,0.06)',
                color: viewType === 'freight_pool' ? '#ffffff' : 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              🤝 Freight Pools ({poolDeliveryCount})
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setViewType('all')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                border: 'none',
                background: viewType === 'all' ? '#10b981' : 'rgba(255,255,255,0.06)',
                color: viewType === 'all' ? '#ffffff' : 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              📦 All Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setViewType('purchases')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                border: 'none',
                background: viewType === 'purchases' ? '#10b981' : 'rgba(255,255,255,0.06)',
                color: viewType === 'purchases' ? '#ffffff' : 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              🛒 My Purchases ({purchaseCount})
            </button>
            {isFarmerRole && (
              <button
                type="button"
                onClick={() => setViewType('sales')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: viewType === 'sales' ? '#10b981' : 'rgba(255,255,255,0.06)',
                  color: viewType === 'sales' ? '#ffffff' : 'inherit',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                🌾 Orders Received / Sales ({salesCount})
              </button>
            )}
          </>
        )}
      </div>

      <div className="orders-status-filters">
        {['all', 'pending', 'accepted', 'in_transit', 'completed'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`orders-filter-pill ${filter === tab ? 'active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab === 'all' ? 'All Statuses' : STATUS_LABEL[tab] || tab}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="page-loading">Loading order requests...</p>
      ) : visibleOrders.length === 0 ? (
        <div className="empty-card">
          {viewType === 'purchases'
            ? "You haven't placed any crop requests yet. Browse the marketplace to order fresh commodities."
            : viewType === 'sales'
            ? "No incoming requests for your listings yet. Once buyers order your harvest, they will appear here."
            : "No orders found for this status."}
        </div>
      ) : (
        <div className="orders-list">
          {visibleOrders.map((order) => {
            const isOrderBuyer =
              order.isBuyer !== undefined
                ? order.isBuyer
                : String(order.buyer?._id || order.buyer) === String(user?._id);

            return (
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
                    {isTransporter ? (
                      <>
                        <p>
                          <strong>🌾 Commodity: {order.quantity} {order.unit}</strong> of {order.product?.title || 'Produce'} &middot;{' '}
                          <span className="text-highlight">Total Payout: {order.totalPrice ? order.totalPrice.toLocaleString() : (order.quantity * (order.product?.price || 0)).toLocaleString()} ETB</span>
                        </p>
                        <p>
                          📍 <strong>Pickup Origin (Farmgate / Depot):</strong> {order.farmer?.name} &bull; {order.product?.location || order.farmer?.region || 'Ethiopia'} (📞 {order.farmer?.phone || 'N/A'})
                        </p>
                        <p>
                          🎯 <strong>Delivery Destination:</strong> {order.deliveryAddress?.city || 'Addis Ababa'} {order.deliveryAddress?.specificAddress ? `(${order.deliveryAddress.specificAddress})` : ''} &bull; Buyer: {order.buyer?.name} (📞 {order.contactPhone})
                        </p>
                        <p>
                          🚚 Fulfillment Method: <strong>{order.fulfillment === 'freight_pool' ? 'Freight-Sharing Pool' : 'Direct Dispatch'}</strong> &middot; Escrow: <strong>{order.paymentStatus?.toUpperCase()}</strong>
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          {isOrderBuyer
                            ? `👨‍🌾 Producer / Seller: ${order.farmer?.name || 'Farmer'}${order.farmer?.cooperativeName ? ` (${order.farmer.cooperativeName})` : ''}`
                            : `👤 Buyer: ${order.buyer?.name || 'Buyer'}`} &middot;{' '}
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
                      </>
                    )}
                  </div>

                  {/* Quick Voucher Button */}
                  <div className="order-receipt-quick-row">
                    <button
                      type="button"
                      className={`btn btn-sm ${order.paymentStatus === 'escrow_held' || order.paymentStatus === 'released_to_farmer' ? 'btn-escrow-voucher' : 'btn-primary'}`}
                      onClick={() => setActivePaymentOrder(order)}
                    >
                      📜 {order.paymentStatus === 'escrow_held' || order.paymentStatus === 'released_to_farmer' ? 'View Escrow Voucher' : '⚡ Complete Escrow Payment'}
                    </button>
                  </div>
                </div>

                {/* Transporter Logistics Actions */}
                {isTransporter ? (
                  <div className="order-card-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', alignItems: 'stretch' }}>
                    {order.status === 'pending' || order.status === 'accepted' ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busyId === order._id}
                        onClick={() => handleStatusChange(order._id, 'in_transit')}
                      >
                        🚚 Pick Up & Dispatch to Destination
                      </button>
                    ) : order.status === 'in_transit' ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busyId === order._id}
                        onClick={() => handleStatusChange(order._id, 'completed')}
                      >
                        ✅ Confirm Cargo Delivery Arrival
                      </button>
                    ) : (
                      <span className="badge badge-accepted">✅ Delivered & Confirmed</span>
                    )}
                    <Link
                      to="/messages"
                      className="btn btn-secondary btn-sm"
                      style={{ textAlign: 'center', textDecoration: 'none', fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                    >
                      💬 Coordinate Logistics
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Seller Actions (if current user is the seller/farmer) */}
                    {!isOrderBuyer && order.status === 'pending' && (
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

                    {!isOrderBuyer && order.status === 'accepted' && (
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

                    {!isOrderBuyer && order.status === 'in_transit' && (
                      <div className="order-card-actions">
                        <span className="badge badge-escrow">Waiting for buyer receipt...</span>
                      </div>
                    )}

                    {!isOrderBuyer && order.status === 'completed' && (
                      <div className="order-card-actions">
                        <span className="badge badge-accepted">Delivered & Funds Released 💰</span>
                      </div>
                    )}

                    {/* Buyer Actions (if current user placed this order, whether farmer, buyer, or coop) */}
                    {isOrderBuyer && (order.status === 'in_transit' || order.status === 'accepted') && (
                      <div className="order-card-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={busyId === order._id}
                          onClick={() => handleStatusChange(order._id, 'completed')}
                        >
                          ✅ {t('confirmReceipt')} & Release Escrow
                        </button>
                      </div>
                    )}

                    {isOrderBuyer && order.status === 'pending' && (
                      <div className="order-card-actions">
                        <span className="badge badge-pending">Waiting for producer acceptance...</span>
                      </div>
                    )}

                    {isOrderBuyer && order.status === 'completed' && (
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
                  </>
                )}
              </div>
            );
          })}
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