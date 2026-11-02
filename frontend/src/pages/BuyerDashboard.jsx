import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrencyUnit } from '../context/CurrencyUnitContext';
import { orderService } from '../services/orderService';
import { poolService } from '../services/poolService';
import EscrowPaymentModal from '../components/EscrowPaymentModal';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const { formatPrice } = useCurrencyUnit();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'pools'
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayOrder, setSelectedPayOrder] = useState(null);
  const [releasingId, setReleasingId] = useState(null);
  const [confirmEscrowOrder, setConfirmEscrowOrder] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Bulk procurement contract modal state
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [poolForm, setPoolForm] = useState({
    cropName: '',
    variety: '',
    targetQuantity: '',
    unit: 'Quintal',
    unitPrice: '',
    deliveryRegion: 'Addis Ababa',
    deadline: '',
    description: '',
  });
  const [submittingPool, setSubmittingPool] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderRes, poolRes] = await Promise.all([
        orderService.getMine(),
        poolService.getOpenPools(),
      ]);
      setOrders(orderRes.orders || []);
      // Filter pools where the current buyer is the contract owner
      const myPools = (poolRes.pools || []).filter(
        (p) => (p.buyer?._id || p.buyer)?.toString() === (user?._id || user?.id)?.toString()
      );
      setPools(myPools);
    } catch (err) {
      console.error('Error loading buyer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute summary metrics
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalEscrowDeposited = orders
      .filter((o) => o.paymentStatus === 'escrow_held' || o.isPaid)
      .reduce((sum, o) => sum + (o.totalAmount || o.totalPrice || 0), 0);
    const activeInTransit = orders.filter((o) => o.status === 'in_transit').length;
    const completedOrders = orders.filter((o) => o.status === 'completed').length;

    return { totalOrders, totalEscrowDeposited, activeInTransit, completedOrders };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const executeReleaseEscrow = async (orderId) => {
    setReleasingId(orderId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await orderService.releaseEscrow(orderId);
      setSuccessMsg(res.message || 'Escrow released successfully! Funds disbursed to seller.');
      setConfirmEscrowOrder(null);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not release escrow. Please try again.');
    } finally {
      setReleasingId(null);
    }
  };

  const handleCreatePool = async (e) => {
    e.preventDefault();
    setSubmittingPool(true);
    setErrorMsg('');
    try {
      await poolService.create({
        ...poolForm,
        targetQuantity: Number(poolForm.targetQuantity),
        unitPrice: Number(poolForm.unitPrice),
      });
      setSuccessMsg('Bulk Procurement Contract published! Smallholders can now pool produce to fulfill it.');
      setIsPoolModalOpen(false);
      setPoolForm({
        cropName: '',
        variety: '',
        targetQuantity: '',
        unit: 'Quintal',
        unitPrice: '',
        deliveryRegion: 'Addis Ababa',
        deadline: '',
        description: '',
      });
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create bulk procurement contract.');
    } finally {
      setSubmittingPool(false);
    }
  };

  return (
    <div className="farmer-dashboard-page buyer-dashboard-page">
      <div className="dashboard-hero">
        <div>
          <span className="eyebrow">Institutional & Commercial Procurement</span>
          <h1>Buyer Command Center</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{user?.name}</strong>. Manage your direct farmgate contracts, Telebirr & Chapa escrow vaults, and bulk cooperative pooling.
          </p>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-primary" onClick={() => setIsPoolModalOpen(true)}>
            📦 Post Bulk Procurement Contract (RFQ)
          </button>
          <Link to="/products" className="btn btn-secondary">
            🌾 Browse Marketplace
          </Link>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="payment-receipt-banner" style={{ marginBottom: '1.25rem', background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}>
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="payment-error-banner" style={{ marginBottom: '1.25rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Executive Key Metrics */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <div className="stat-details">
            <span className="stat-label">Total Purchase Orders</span>
            <span className="stat-value">{metrics.totalOrders}</span>
            <small className="stat-sub">Direct farmgate orders</small>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🔒</span>
          <div className="stat-details">
            <span className="stat-label">Secured in Escrow</span>
            <span className="stat-value text-gain">{formatPrice(metrics.totalEscrowDeposited)}</span>
            <small className="stat-sub">Protected until delivery</small>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🚚</span>
          <div className="stat-details">
            <span className="stat-label">In-Transit Freight</span>
            <span className="stat-value">{metrics.activeInTransit}</span>
            <small className="stat-sub">Isuzu / FSR consignments</small>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-details">
            <span className="stat-label">Fulfilled Deliveries</span>
            <span className="stat-value text-gain">{metrics.completedOrders}</span>
            <small className="stat-sub">Inspected & settled</small>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="dashboard-tabs" style={{ display: 'flex', gap: '0.75rem', margin: '1.5rem 0 1rem' }}>
        <button
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Direct Purchase Orders ({orders.length})
        </button>
        <button
          className={`btn ${activeTab === 'pools' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('pools')}
        >
          🤝 My Bulk Procurement Pools ({pools.length})
        </button>
      </div>

      {/* TAB 1: Direct Purchase Orders */}
      {activeTab === 'orders' && (
        <div className="dashboard-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2>Procurement Orders & Escrow Status</h2>
            <div className="filter-pills" style={{ display: 'flex', gap: '0.4rem' }}>
              {['all', 'pending', 'accepted', 'in_transit', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  className={`map-style-btn ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="loading-state">Loading your procurement portfolio...</p>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state-card" style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '2.5rem' }}>🛒</span>
              <h3>No {statusFilter !== 'all' ? statusFilter : ''} orders found</h3>
              <p>Explore verified produce listings across Ethiopia and place direct escrow-backed purchase requests.</p>
              <Link to="/products" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
                Browse Verified Produce Lots &rarr;
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Produce Lot</th>
                    <th>Supplier / Region</th>
                    <th>Quantity</th>
                    <th>Total Value</th>
                    <th>Order Status</th>
                    <th>Escrow Protection</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const totalVal = order.totalAmount || order.totalPrice || 0;
                    const isHeld = order.paymentStatus === 'escrow_held' || order.escrowStatus === 'held_in_escrow';
                    const isReleased = order.paymentStatus === 'released_to_farmer' || order.escrowStatus === 'released_to_seller';

                    return (
                      <tr key={order._id}>
                        <td>
                          <strong>{order.product?.title || 'Produce Lot'}</strong>
                          <br />
                          <small style={{ color: '#64748b' }}>Ordered {new Date(order.createdAt).toLocaleDateString()}</small>
                        </td>
                        <td>
                          <span>{order.farmer?.name || 'Verified Producer'}</span>
                          <br />
                          <small style={{ color: '#64748b' }}>📍 {order.product?.location || order.deliveryAddress?.city || 'Ethiopia'}</small>
                        </td>
                        <td>
                          <strong>{order.quantity} {order.unit || 'Kg'}</strong>
                        </td>
                        <td>
                          <strong className="text-gain">{formatPrice(totalVal)}</strong>
                        </td>
                        <td>
                          <span className={`badge badge-${order.status}`}>
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {isHeld && (
                            <span className="badge badge-accepted" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #10b981' }}>
                              🔒 Escrow Secured
                            </span>
                          )}
                          {isReleased && (
                            <span className="badge badge-muted" style={{ background: '#f1f5f9', color: '#475569' }}>
                              ✅ Payout Disbursed
                            </span>
                          )}
                          {!isHeld && !isReleased && (
                            <span className="badge badge-pending" style={{ background: '#fef3c7', color: '#d97706' }}>
                              ⏳ Pending Payment
                            </span>
                          )}
                        </td>
                        <td className="row-actions">
                          {/* Payment Action if not yet paid */}
                          {!order.isPaid && order.status !== 'cancelled' && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => setSelectedPayOrder(order)}
                            >
                              ⚡ Pay & Lock Escrow
                            </button>
                          )}

                          {/* Escrow Release Button when delivered / in transit */}
                          {isHeld && order.status !== 'completed' && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              style={{ borderColor: '#10b981', color: '#059669' }}
                              onClick={() => setConfirmEscrowOrder(order)}
                              disabled={releasingId === order._id}
                            >
                              {releasingId === order._id ? 'Releasing...' : '✅ Inspect & Release'}
                            </button>
                          )}

                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => navigate('/messages')}
                            title="Message supplier"
                          >
                            💬 Chat
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: My Bulk Procurement Pools (Virtual Pooling) */}
      {activeTab === 'pools' && (
        <div className="dashboard-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2>Virtual Yield Pooling Contracts</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                Bulk contracts published by your organization. Multiple smallholders pledge partial harvests to fulfill these institutional orders.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setIsPoolModalOpen(true)}>
              ➕ New Bulk Order Contract
            </button>
          </div>

          {loading ? (
            <p className="loading-state">Loading your bulk contracts...</p>
          ) : pools.length === 0 ? (
            <div className="empty-state-card" style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '2.5rem' }}>🤝</span>
              <h3>No bulk pooling contracts published yet</h3>
              <p>Post a bulk order for commodities like Teff, Coffee, Wheat, Maize, or Enset, allowing smallholders across Ethiopia to combine yields.</p>
              <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => setIsPoolModalOpen(true)}>
                Create First Bulk Contract &rarr;
              </button>
            </div>
          ) : (
            <div className="pools-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {pools.map((pool) => {
                const pct = Math.min(100, Math.round((pool.currentQuantity / pool.targetQuantity) * 100));
                const remaining = Math.max(0, pool.targetQuantity - pool.currentQuantity);

                return (
                  <div key={pool._id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span className="badge badge-grade">{pool.variety || 'Standard Bulk'}</span>
                        <h3 style={{ margin: '0.35rem 0 0' }}>{pool.cropName}</h3>
                      </div>
                      <span className={`badge badge-${pool.status === 'open' ? 'accepted' : 'muted'}`}>
                        {pool.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>Fulfillment: <strong>{pct}%</strong></span>
                        <span>{pool.currentQuantity} / {pool.targetQuantity} {pool.unit}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#10b981' : '#3b82f6', transition: 'width 0.4s ease' }}></div>
                      </div>
                      <small style={{ color: '#64748b' }}>
                        {remaining > 0 ? `${remaining} ${pool.unit} still needed` : '🎉 Pool target reached! Ready for dispatch.'}
                      </small>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Unit Price:</span>
                        <strong>{formatPrice(pool.unitPrice)} / {pool.unit}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Contract Value:</span>
                        <strong>{formatPrice(pool.totalContractValue || pool.targetQuantity * pool.unitPrice)}</strong>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      📍 Delivery to: <strong>{pool.deliveryRegion}</strong>
                      {pool.deadline && ` · Deadline: ${new Date(pool.deadline).toLocaleDateString()}`}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        👥 {pool.contributors?.length || 0} smallholder farmers contributed
                      </span>
                      {pool.status === 'pool_filled' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => poolService.updateStatus(pool._id, 'in_transit').then(loadData)}
                        >
                          Dispatch Freight &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Escrow Payment Simulation / Execution */}
      {selectedPayOrder && (
        <EscrowPaymentModal
          isOpen={Boolean(selectedPayOrder)}
          onClose={() => setSelectedPayOrder(null)}
          order={selectedPayOrder}
          product={selectedPayOrder.product}
          onPaymentSuccess={() => {
            setSelectedPayOrder(null);
            setSuccessMsg('🔒 Payment successfully locked into Escrow Vault!');
            loadData();
          }}
        />
      )}

      {/* MODAL 2: Create Bulk Procurement Pool Contract */}
      {isPoolModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPoolModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>📦 Post Bulk Procurement Contract (RFQ)</h3>
              <button className="modal-close-btn" onClick={() => setIsPoolModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePool} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="field-group">
                <label>Commodity / Crop Name *</label>
                <input
                  required
                  placeholder="e.g. Yellow Maize, Magna White Teff, Red Ginger"
                  value={poolForm.cropName}
                  onChange={(e) => setPoolForm({ ...poolForm, cropName: e.target.value })}
                />
              </div>

              <div className="compact-fields">
                <div className="field-group">
                  <label>Target Volume (Quintals) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={poolForm.targetQuantity}
                    onChange={(e) => setPoolForm({ ...poolForm, targetQuantity: e.target.value })}
                  />
                </div>
                <div className="field-group">
                  <label>Unit Price Offered (ETB/Qtl) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 4800"
                    value={poolForm.unitPrice}
                    onChange={(e) => setPoolForm({ ...poolForm, unitPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="compact-fields">
                <div className="field-group">
                  <label>Delivery Destination Region</label>
                  <input
                    placeholder="e.g. Addis Ababa (Merkato) or Soddo"
                    value={poolForm.deliveryRegion}
                    onChange={(e) => setPoolForm({ ...poolForm, deliveryRegion: e.target.value })}
                  />
                </div>
                <div className="field-group">
                  <label>Target Fulfillment Deadline</label>
                  <input
                    type="date"
                    value={poolForm.deadline}
                    onChange={(e) => setPoolForm({ ...poolForm, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="field-group">
                <label>Quality Specs & Packaging Requirements</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Moisture <= 12%, clean 100kg bags. Grade A or Grade B certified."
                  value={poolForm.description}
                  onChange={(e) => setPoolForm({ ...poolForm, description: e.target.value })}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', fontSize: '0.82rem', color: '#475569' }}>
                💡 <strong>Cooperative Virtual Pooling:</strong> Smallholder farmers across Ethiopian regional corridors will be notified to contribute partial harvests until your target volume of <strong>{poolForm.targetQuantity || 0} Quintals</strong> is met.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPoolModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingPool}>
                  {submittingPool ? 'Publishing...' : 'Publish Bulk Procurement Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Professional Escrow Release Confirmation Modal */}
      {confirmEscrowOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '500px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              color: '#f8fafc',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  margin: '0 auto 1rem auto',
                }}
              >
                🛡️
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem', color: '#f8fafc' }}>
                Verify Produce & Release Escrow
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.5' }}>
                Physical Quality & Volume Inspection Confirmation
              </p>
            </div>

            {/* Produce Summary Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.25rem',
                fontSize: '0.86rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: '#94a3b8' }}>Produce:</span>
                <strong style={{ color: '#f8fafc' }}>{confirmEscrowOrder.product?.title || 'Produce Lot'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: '#94a3b8' }}>Seller / Producer:</span>
                <span style={{ color: '#f8fafc' }}>{confirmEscrowOrder.farmer?.name || 'Producer'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: '#94a3b8' }}>Quantity:</span>
                <span style={{ color: '#f8fafc' }}>{confirmEscrowOrder.quantity} {confirmEscrowOrder.unit}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#94a3b8' }}>Net Payout to Seller:</span>
                <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>
                  {formatPrice(confirmEscrowOrder.totalPrice || confirmEscrowOrder.totalAmount || 0)}
                </strong>
              </div>
            </div>

            {/* Security Guarantee Notice */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '10px',
                padding: '0.85rem',
                marginBottom: '1.5rem',
                fontSize: '0.82rem',
                color: '#fde68a',
                lineHeight: '1.5',
              }}
            >
              ⚠️ <strong>Inspection Protection:</strong> Only release escrow if you have received and inspected the harvest. Once confirmed, Telebirr/CBE escrow funds are immediately disbursed to the seller.
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmEscrowOrder(null)}
                disabled={releasingId === confirmEscrowOrder._id}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
                onClick={() => executeReleaseEscrow(confirmEscrowOrder._id)}
                disabled={releasingId === confirmEscrowOrder._id}
              >
                {releasingId === confirmEscrowOrder._id ? 'Disbursing Funds...' : '✅ Yes, Verify & Release Escrow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
