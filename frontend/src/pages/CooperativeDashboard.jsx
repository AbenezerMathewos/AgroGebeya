import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrencyUnit } from '../context/CurrencyUnitContext';
import { poolService } from '../services/poolService';
import { productService } from '../services/productService';

export default function CooperativeDashboard() {
  const { user } = useAuth();
  const { formatPrice } = useCurrencyUnit();
  const navigate = useNavigate();

  const [pools, setPools] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pools'); // 'pools' | 'members' | 'listings'
  const [selectedPoolDetail, setSelectedPoolDetail] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Contribute modal state
  const [contributeModalPool, setContributeModalPool] = useState(null);
  const [contribForm, setContribForm] = useState({ quantity: '', qualityGrade: 'Grade A' });
  const [contributing, setContributing] = useState(false);

  // New pool modal
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
      const [poolRes, prodRes] = await Promise.all([
        poolService.getOpenPools(),
        productService.getAll(),
      ]);
      setPools(poolRes.pools || []);
      // Filter products pooled by this cooperative or owned by user
      const myPooled = (prodRes.products || []).filter(
        (p) => p.isCooperativePooled || (p.owner?._id || p.owner)?.toString() === (user?._id || user?.id)?.toString()
      );
      setProducts(myPooled);
    } catch (err) {
      console.error('Error loading cooperative dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute union metrics
  const metrics = useMemo(() => {
    const totalPools = pools.length;
    const totalAggregatedQuintals = pools.reduce((sum, p) => sum + (p.currentQuantity || 0), 0);
    const totalContributors = pools.reduce((sum, p) => sum + (p.contributors?.length || 0), 0);
    const totalValue = pools.reduce((sum, p) => sum + (p.currentQuantity * (p.unitPrice || 0)), 0);

    return { totalPools, totalAggregatedQuintals, totalContributors, totalValue };
  }, [pools]);

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contributeModalPool) return;
    setContributing(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await poolService.contribute(contributeModalPool._id, {
        quantity: Number(contribForm.quantity),
        qualityGrade: contribForm.qualityGrade,
      });
      setSuccessMsg(res.message || 'Contribution added to bulk pool successfully!');
      setContributeModalPool(null);
      setContribForm({ quantity: '', qualityGrade: 'Grade A' });
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to contribute to pool.');
    } finally {
      setContributing(false);
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
      setSuccessMsg('Bulk cooperative pooling contract initiated!');
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
      setErrorMsg(err.response?.data?.message || 'Failed to create bulk pool.');
    } finally {
      setSubmittingPool(false);
    }
  };

  const handleStatusChange = async (poolId, newStatus) => {
    try {
      await poolService.updateStatus(poolId, newStatus);
      setSuccessMsg(`Pool lifecycle transitioned to ${newStatus.toUpperCase()}`);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update pool status');
    }
  };

  return (
    <div className="farmer-dashboard-page coop-dashboard-page">
      <div className="dashboard-hero">
        <div>
          <span className="eyebrow">Primary Cooperative & Union Management</span>
          <h1>Cooperative Command Center</h1>
          <p className="dashboard-subtitle">
            Welcome, <strong>{user?.cooperativeName || user?.name}</strong>. Manage smallholder yield aggregation, virtual pooling contracts, and freight dispatch.
          </p>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-primary" onClick={() => setIsPoolModalOpen(true)}>
            🤝 Create Bulk Pool Contract
          </button>
          <Link to="/farmer/add-product" className="btn btn-secondary">
            🌾 Add Union Produce Listing
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

      {/* Union Key Metrics */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-icon">🤝</span>
          <div className="stat-details">
            <span className="stat-label">Active Bulk Pools</span>
            <span className="stat-value">{metrics.totalPools}</span>
            <small className="stat-sub">Yield consolidation pipelines</small>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">⚖️</span>
          <div className="stat-details">
            <span className="stat-label">Aggregated Volume</span>
            <span className="stat-value">{metrics.totalAggregatedQuintals} Qtl</span>
            <small className="stat-sub">Consolidated across members</small>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-details">
            <span className="stat-label">Smallholder Contributors</span>
            <span className="stat-value">{metrics.totalContributors}</span>
            <small className="stat-sub">Participating farmers</small>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div className="stat-details">
            <span className="stat-label">Consolidated Pool Value</span>
            <span className="stat-value text-gain">{formatPrice(metrics.totalValue)}</span>
            <small className="stat-sub">95% net farmer payout rate</small>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="dashboard-tabs" style={{ display: 'flex', gap: '0.75rem', margin: '1.5rem 0 1rem' }}>
        <button
          className={`btn ${activeTab === 'pools' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('pools')}
        >
          🤝 Bulk Yield Pools ({pools.length})
        </button>
        <button
          className={`btn ${activeTab === 'listings' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('listings')}
        >
          🌾 Union Harvest Listings ({products.length})
        </button>
      </div>

      {/* TAB 1: Bulk Yield Pools */}
      {activeTab === 'pools' && (
        <div className="dashboard-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2>Multi-Farmer Yield Pooling Engine</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                Fulfill large B2B contracts (breweries, mills, institutional cafeterias) by pooling smallholder harvest fractions.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setIsPoolModalOpen(true)}>
              ➕ Initiate Bulk Contract
            </button>
          </div>

          {loading ? (
            <p className="loading-state">Loading active pooling contracts...</p>
          ) : pools.length === 0 ? (
            <div className="empty-state-card" style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '2.5rem' }}>🤝</span>
              <h3>No active bulk yield pools</h3>
              <p>Create open contracts for commodities like Maize, Teff, or Coffee so smallholders in your woreda can pool produce.</p>
              <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => setIsPoolModalOpen(true)}>
                Create First Bulk Pool &rarr;
              </button>
            </div>
          ) : (
            <div className="pools-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.15rem' }}>
              {pools.map((pool) => {
                const pct = Math.min(100, Math.round((pool.currentQuantity / pool.targetQuantity) * 100));
                const remaining = Math.max(0, pool.targetQuantity - pool.currentQuantity);
                const isFull = pool.currentQuantity >= pool.targetQuantity;

                return (
                  <div key={pool._id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span className="badge badge-grade">{pool.variety || 'Bulk Standard'}</span>
                        <h3 style={{ margin: '0.35rem 0 0' }}>{pool.cropName}</h3>
                        <small style={{ color: '#64748b' }}>Client: {pool.buyer?.name || 'Institutional Procurement'}</small>
                      </div>
                      <span className={`badge badge-${pool.status === 'open' ? 'accepted' : 'muted'}`}>
                        {pool.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>Capacity: <strong>{pct}%</strong></span>
                        <span>{pool.currentQuantity} / {pool.targetQuantity} {pool.unit}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: isFull ? '#10b981' : '#3b82f6', transition: 'width 0.4s ease' }}></div>
                      </div>
                      <small style={{ color: '#64748b' }}>
                        {remaining > 0 ? `${remaining} ${pool.unit} remaining capacity` : '🎯 Target Volume Reached! Ready for dispatch.'}
                      </small>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Offered Rate:</span>
                        <strong>{formatPrice(pool.unitPrice)} / {pool.unit}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Farmer Net Payout:</span>
                        <strong className="text-gain">{formatPrice(pool.unitPrice * 0.95)} / {pool.unit}</strong>
                      </div>
                    </div>

                    {/* Member Contributions Summary */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0.5rem', fontSize: '0.82rem' }}>
                      <strong>👥 Contributors ({pool.contributors?.length || 0}):</strong>
                      {pool.contributors && pool.contributors.length > 0 ? (
                        <div style={{ maxHeight: '70px', overflowY: 'auto', marginTop: '0.35rem' }}>
                          {pool.contributors.map((c, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0', borderBottom: '1px dashed #f1f5f9' }}>
                              <span>{c.farmer?.name || 'Farmer'} ({c.qualityGrade})</span>
                              <strong>{c.quantity} {pool.unit} ({formatPrice(c.payoutDue)})</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>No farmers pledged yet.</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {pool.status === 'open' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setContributeModalPool(pool)}
                        >
                          ➕ Pledge Harvest Yield
                        </button>
                      )}

                      {pool.status === 'pool_filled' && (
                        <button
                          className="btn btn-sm btn-outline-success"
                          style={{ borderColor: '#10b981', color: '#059669' }}
                          onClick={() => handleStatusChange(pool._id, 'in_transit')}
                        >
                          🚚 Mark In Transit
                        </button>
                      )}

                      {pool.status === 'in_transit' && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleStatusChange(pool._id, 'delivered')}
                        >
                          ✅ Confirm Delivered
                        </button>
                      )}

                      <Link to="/freight" className="btn btn-sm btn-secondary" title="Book Isuzu freight">
                        🚛 Freight
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Union Harvest Listings */}
      {activeTab === 'listings' && (
        <div className="dashboard-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Consolidated Harvest Listings</h2>
            <Link to="/farmer/add-product" className="btn btn-primary">
              ➕ Post New Union Produce Lot
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="empty-state-card" style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '2.5rem' }}>🌾</span>
              <h3>No cooperative produce listed yet</h3>
              <p>Add wholesale aggregated lots to the national digital marketplace.</p>
              <Link to="/farmer/add-product" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
                Post Union Produce Lot &rarr;
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Commodity</th>
                    <th>Price / Unit</th>
                    <th>Aggregated Volume</th>
                    <th>Location / Zone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod._id}>
                      <td>
                        <strong>{prod.title}</strong>
                        <br />
                        <small style={{ color: '#64748b' }}>{prod.category} &middot; {prod.grade}</small>
                      </td>
                      <td>
                        <strong>{formatPrice(prod.price)} / {prod.unit}</strong>
                      </td>
                      <td>
                        <strong>{prod.quantity} {prod.unit}</strong>
                      </td>
                      <td>
                        📍 {prod.location || 'South Ethiopia'}
                      </td>
                      <td>
                        <span className={prod.isAvailable ? 'badge badge-accepted' : 'badge badge-muted'}>
                          {prod.isAvailable ? '● Active' : '○ Sold Out'}
                        </span>
                      </td>
                      <td className="row-actions">
                        <Link to={`/farmer/products/${prod._id}/edit`} className="btn-table-edit">
                          Edit
                        </Link>
                        <Link to={`/products/${prod._id}`} className="btn btn-sm btn-secondary">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Contribute Partial Yield to Pool */}
      {contributeModalPool && (
        <div className="modal-backdrop" onClick={() => setContributeModalPool(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Pledge Yield to Pool: {contributeModalPool.cropName}</h3>
              <button className="modal-close-btn" onClick={() => setContributeModalPool(null)}>✕</button>
            </div>
            <form onSubmit={handleContribute} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                Remaining needed capacity: <strong>{Math.max(0, contributeModalPool.targetQuantity - contributeModalPool.currentQuantity)} {contributeModalPool.unit}</strong>
                <br />
                Offered contract price: <strong>{formatPrice(contributeModalPool.unitPrice)} / {contributeModalPool.unit}</strong>
              </div>

              <div className="field-group">
                <label>Contribution Quantity ({contributeModalPool.unit}) *</label>
                <input
                  required
                  type="number"
                  min="0.1"
                  max={Math.max(0, contributeModalPool.targetQuantity - contributeModalPool.currentQuantity)}
                  placeholder="e.g. 5"
                  value={contribForm.quantity}
                  onChange={(e) => setContribForm({ ...contribForm, quantity: e.target.value })}
                />
              </div>

              <div className="field-group">
                <label>Inspected Quality Grade</label>
                <select
                  value={contribForm.qualityGrade}
                  onChange={(e) => setContribForm({ ...contribForm, qualityGrade: e.target.value })}
                >
                  <option value="Grade A">Grade A (Certified Export / Premium)</option>
                  <option value="Grade B">Grade B (Standard Commercial)</option>
                  <option value="Grade C">Grade C (Local Processing)</option>
                </select>
              </div>

              {Number(contribForm.quantity) > 0 && (
                <div style={{ background: '#ecfdf5', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.85rem', color: '#065f46' }}>
                  💰 <strong>Calculated Farmer Payout (Net 95%):</strong>{' '}
                  {formatPrice(Math.round(Number(contribForm.quantity) * contributeModalPool.unitPrice * 0.95 * 100) / 100)}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setContributeModalPool(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={contributing}>
                  {contributing ? 'Submitting...' : 'Confirm Pledge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Bulk Pool Contract */}
      {isPoolModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPoolModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>Initiate Cooperative Bulk Contract</h3>
              <button className="modal-close-btn" onClick={() => setIsPoolModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePool} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="field-group">
                <label>Commodity / Crop Name *</label>
                <input
                  required
                  placeholder="e.g. White Maize, Grade 1 Washed Coffee, Red Ginger"
                  value={poolForm.cropName}
                  onChange={(e) => setPoolForm({ ...poolForm, cropName: e.target.value })}
                />
              </div>

              <div className="compact-fields">
                <div className="field-group">
                  <label>Target Pool Volume (Quintals) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={poolForm.targetQuantity}
                    onChange={(e) => setPoolForm({ ...poolForm, targetQuantity: e.target.value })}
                  />
                </div>
                <div className="field-group">
                  <label>Offered Price (ETB/Qtl) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 5200"
                    value={poolForm.unitPrice}
                    onChange={(e) => setPoolForm({ ...poolForm, unitPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="compact-fields">
                <div className="field-group">
                  <label>Destination Terminal Region</label>
                  <input
                    placeholder="e.g. Addis Ababa or Hawassa"
                    value={poolForm.deliveryRegion}
                    onChange={(e) => setPoolForm({ ...poolForm, deliveryRegion: e.target.value })}
                  />
                </div>
                <div className="field-group">
                  <label>Fulfillment Deadline</label>
                  <input
                    type="date"
                    value={poolForm.deadline}
                    onChange={(e) => setPoolForm({ ...poolForm, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="field-group">
                <label>Quality & Packaging Standards</label>
                <textarea
                  rows="2"
                  placeholder="Specify grain moisture limits, bag requirements, inspection depot location..."
                  value={poolForm.description}
                  onChange={(e) => setPoolForm({ ...poolForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPoolModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingPool}>
                  {submittingPool ? 'Creating...' : 'Open Pooling Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
