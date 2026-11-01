import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrencyUnit } from '../context/CurrencyUnitContext';
import { productService } from '../services/productService';
import { poolService } from '../services/poolService';
import ProductThumb from '../components/ProductThumb';
import WeatherWidget from '../components/WeatherWidget';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrencyUnit();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'pools'
  const [products, setProducts] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [openPools, setOpenPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Contribute to pool modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [contribQty, setContribQty] = useState('');
  const [contribGrade, setContribGrade] = useState('Grade A');
  const [submittingContrib, setSubmittingContrib] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prodRes, contribRes, openPoolsRes] = await Promise.all([
        productService.getMine().catch(() => ({ products: [] })),
        poolService.getMyContributions().catch(() => ({ contributions: [] })),
        poolService.getOpenPools().catch(() => ({ pools: [] })),
      ]);
      setProducts(prodRes.products || []);
      setContributions(contribRes.contributions || []);
      setOpenPools(openPoolsRes.pools || []);
    } catch (err) {
      console.error('Error loading farmer dashboard data:', err);
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await productService.remove(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setSuccessMsg('Listing deleted successfully.');
    } catch {
      setError('Could not delete listing. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleJoinPool = async (e) => {
    e.preventDefault();
    if (!selectedPoolId || !contribQty || Number(contribQty) <= 0) {
      setError('Please select an open pool and enter a valid quantity.');
      return;
    }
    setSubmittingContrib(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await poolService.contribute(selectedPoolId, {
        quantity: Number(contribQty),
        qualityGrade: contribGrade,
      });
      setSuccessMsg(res.message || 'Successfully pledged yield to cooperative pool!');
      setShowJoinModal(false);
      setSelectedPoolId('');
      setContribQty('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join pool. Check capacity.');
    } finally {
      setSubmittingContrib(false);
    }
  };

  // Compute Farmer Dashboard Metrics
  const totalListings = products.length;
  const availableListings = products.filter((p) => p.isAvailable).length;
  const totalPledgedQuintals = contributions.reduce((acc, c) => acc + (c.myQuantity || 0), 0);
  const totalPledgedPayout = contributions.reduce((acc, c) => acc + (c.myPayoutDue || 0), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * (p.quantity || 1)), 0);

  const selectedPool = openPools.find((p) => p._id === selectedPoolId);
  const estimatedNetPayout = selectedPool && contribQty
    ? Math.round(Number(contribQty) * selectedPool.unitPrice * 0.95)
    : 0;

  return (
    <div className="farmer-dashboard">
      {/* Dashboard Welcome Header */}
      <div className="page-intro">
        <div className="badge-row-header">
          <span className="eyebrow">{t('myDashboard')}</span>
          <span className="badge badge-grade">📍 {user?.region || 'Ethiopia'}</span>
          {user?.cooperative && (
            <span className="badge badge-coop">🏢 {user.cooperative}</span>
          )}
        </div>
        <h1>Welcome, {user?.name}</h1>
        <p>Manage your harvest inventory, pledge yields to bulk institutional buyer pools, and track escrow payouts.</p>
      </div>

      <WeatherWidget />

      {/* Global Alerts */}
      {successMsg && (
        <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1.25rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#047857' }}>
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1.25rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#b91c1c' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Metrics Summary Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <strong>{totalListings}</strong>
          <span>Harvest Listings</span>
        </div>
        <div className="stat-card">
          <strong className="text-gain">{availableListings}</strong>
          <span>Active in Marketplace</span>
        </div>
        <div className="stat-card">
          <strong style={{ color: '#38bdf8' }}>{totalPledgedQuintals} Qtl</strong>
          <span>Cooperative Pledged Yield</span>
        </div>
        <div className="stat-card">
          <strong style={{ color: '#f59e0b' }}>{formatPrice(totalPledgedPayout + totalInventoryValue)}</strong>
          <span>Total Asset & Payout Value</span>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="dashboard-actions-bar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <Link to="/farmer/products/add" className="btn btn-primary">
          + Add New Harvest Listing
        </Link>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setShowJoinModal(true);
            if (openPools.length > 0 && !selectedPoolId) {
              setSelectedPoolId(openPools[0]._id);
            }
          }}
        >
          🤝 Pledge Yield to Bulk Pool
        </button>
        <Link to="/orders" className="btn btn-secondary">
          📦 View Orders & Escrow
        </Link>
        <Link to="/market-prices" className="btn btn-secondary">
          📊 Check Price Radar
        </Link>
        <Link to="/freight" className="btn btn-secondary">
          🚚 Find Return-Trip Trucks
        </Link>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', marginBottom: '1.5rem', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('listings')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'listings' ? '3px solid #10b981' : '3px solid transparent',
            color: activeTab === 'listings' ? 'var(--text-color, #10b981)' : 'var(--slate-400)',
            fontWeight: activeTab === 'listings' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          🌾 My Harvest Listings ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('pools')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pools' ? '3px solid #10b981' : '3px solid transparent',
            color: activeTab === 'pools' ? 'var(--text-color, #10b981)' : 'var(--slate-400)',
            fontWeight: activeTab === 'pools' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          🤝 My Cooperative Pool Pledges ({contributions.length})
        </button>
      </div>

      {/* Tab 1: Listings */}
      {activeTab === 'listings' && (
        <div>
          <div className="section-header-flex">
            <div>
              <h2>My Harvest Listings</h2>
              <p className="subtext">All commodities currently listed on the national marketplace</p>
            </div>
            <button onClick={loadData} className="btn btn-ghost btn-sm" title="Refresh Listings">
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="page-loading">Loading your harvest listings...</div>
          ) : products.length === 0 ? (
            <div className="empty-card">
              <span className="empty-icon">🌾</span>
              <h3>No harvest listings yet</h3>
              <p>Post your first single crop harvest or union pool lot to start receiving direct buyer orders with Chapa escrow.</p>
              <Link to="/farmer/products/add" className="btn btn-primary mt-3">
                + Add First Listing Now
              </Link>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="my-products-table">
                <thead>
                  <tr>
                    <th>Crop Media</th>
                    <th>Harvest Title</th>
                    <th>Category</th>
                    <th>Quality Grade</th>
                    <th>Unit Price</th>
                    <th>Available Stock</th>
                    <th>Location</th>
                    <th>Market Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <ProductThumb product={product} />
                      </td>
                      <td>
                        <Link to={`/products/${product._id}`} className="product-table-title">
                          {product.title}
                        </Link>
                        {product.isCooperativePooled && (
                          <span className="badge badge-coop table-tag">Union Lot</span>
                        )}
                      </td>
                      <td>
                        <span className="table-category">{product.category}</span>
                      </td>
                      <td>
                        <span className="badge badge-grade">{product.grade || 'Standard'}</span>
                      </td>
                      <td>
                        <strong>{formatPrice(product.price)}</strong>
                      </td>
                      <td>
                        {product.quantity} {product.unit || 'Kg'}
                      </td>
                      <td>
                        <small>📍 {product.location || user?.region || 'Ethiopia'}</small>
                      </td>
                      <td>
                        <span className={product.isAvailable ? 'badge badge-accepted' : 'badge badge-muted'}>
                          {product.isAvailable ? '● Active' : '○ Sold Out'}
                        </span>
                      </td>
                      <td className="row-actions">
                        <Link to={`/farmer/products/${product._id}/edit`} className="btn-table-edit">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id)}
                          disabled={deletingId === product._id}
                          className="btn-table-delete"
                        >
                          {deletingId === product._id ? '...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Cooperative Pool Pledges */}
      {activeTab === 'pools' && (
        <div>
          <div className="section-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2>My Virtual Pool Pledges</h2>
              <p className="subtext">
                Smallholder yield slices pooled to fulfill high-volume commercial and institutional procurement orders
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setShowJoinModal(true);
                  if (openPools.length > 0 && !selectedPoolId) {
                    setSelectedPoolId(openPools[0]._id);
                  }
                }}
              >
                + Join Another Bulk Pool
              </button>
              <button onClick={loadData} className="btn btn-ghost btn-sm" title="Refresh">
                🔄 Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="page-loading">Loading your pool pledges...</div>
          ) : contributions.length === 0 ? (
            <div className="empty-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <span className="empty-icon" style={{ fontSize: '2.5rem' }}>🤝</span>
              <h3>No Pool Pledges Yet</h3>
              <p style={{ color: 'var(--slate-400)', maxWidth: '520px', margin: '0.5rem auto 1.5rem auto' }}>
                Join an open procurement contract from commercial buyers (such as Soddo University, food processors, or exporters) by contributing your available harvest quantity.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowJoinModal(true);
                  if (openPools.length > 0 && !selectedPoolId) {
                    setSelectedPoolId(openPools[0]._id);
                  }
                }}
              >
                Browse & Join Open Pools
              </button>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="my-products-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                    <th style={{ padding: '0.75rem' }}>Bulk Contract Crop</th>
                    <th style={{ padding: '0.75rem' }}>Buyer / Institution</th>
                    <th style={{ padding: '0.75rem' }}>Pledged Slice</th>
                    <th style={{ padding: '0.75rem' }}>Grade</th>
                    <th style={{ padding: '0.75rem' }}>Net Payout (95%)</th>
                    <th style={{ padding: '0.75rem' }}>Pool Status</th>
                    <th style={{ padding: '0.75rem' }}>Payout Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c) => (
                    <tr key={c._id} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: 600 }}>🌾 {c.cropName}</div>
                        {c.variety && <small style={{ color: 'var(--slate-400)' }}>Variety: {c.variety}</small>}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: 500 }}>{c.buyer?.name || 'Institutional Client'}</div>
                        {c.buyer?.cooperativeName && (
                          <small style={{ color: 'var(--slate-400)' }}>🏢 {c.buyer.cooperativeName}</small>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <strong>{c.myQuantity} {c.unit || 'Quintals'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                          of {c.targetQuantity} {c.unit || 'Qtl'} total
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span className="badge badge-grade">{c.myQualityGrade || 'Standard'}</span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <strong style={{ color: '#10b981' }}>{formatPrice(c.myPayoutDue)}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                          5% platform take applied
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            background:
                              c.poolStatus === 'open'
                                ? 'rgba(56, 189, 248, 0.15)'
                                : c.poolStatus === 'pool_filled'
                                ? 'rgba(168, 85, 247, 0.15)'
                                : c.poolStatus === 'delivered'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(148, 163, 184, 0.15)',
                            color:
                              c.poolStatus === 'open'
                                ? '#38bdf8'
                                : c.poolStatus === 'pool_filled'
                                ? '#c084fc'
                                : c.poolStatus === 'delivered'
                                ? '#10b981'
                                : '#94a3b8',
                          }}
                        >
                          {c.poolStatus?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: c.myIsPaid ? '#10b981' : '#f59e0b',
                          }}
                        >
                          {c.myIsPaid ? '✅ Disbursed' : '🔒 In Escrow'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Join Bulk Procurement Pool Modal */}
      {showJoinModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--card-bg, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>🤝 Pledge Produce to Bulk Buyer Pool</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: 'var(--slate-400)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {openPools.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--slate-400)' }}>
                No open buyer pools available right now. Check back soon!
              </div>
            ) : (
              <form onSubmit={handleJoinPool}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                    Select Open Bulk Contract *
                  </label>
                  <select
                    value={selectedPoolId}
                    onChange={(e) => setSelectedPoolId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: 'inherit' }}
                  >
                    {openPools.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.cropName} — Needed: {p.remainingCapacity ?? (p.targetQuantity - p.currentQuantity)} {p.unit} @ {p.unitPrice} ETB/{p.unit} ({p.deliveryRegion})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPool && (
                  <div style={{ padding: '0.875rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    <div><strong>Buyer:</strong> {selectedPool.buyer?.name} {selectedPool.buyer?.cooperativeName && `(${selectedPool.buyer.cooperativeName})`}</div>
                    <div><strong>Contract Rate:</strong> {formatPrice(selectedPool.unitPrice)} per {selectedPool.unit || 'Quintal'}</div>
                    <div><strong>Remaining Capacity Needed:</strong> {selectedPool.remainingCapacity ?? (selectedPool.targetQuantity - selectedPool.currentQuantity)} {selectedPool.unit || 'Quintal'}</div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                      Quantity to Pledge ({selectedPool?.unit || 'Quintals'}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedPool?.remainingCapacity || undefined}
                      required
                      placeholder="e.g. 10"
                      value={contribQty}
                      onChange={(e) => setContribQty(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                      Quality Grade *
                    </label>
                    <select
                      value={contribGrade}
                      onChange={(e) => setContribGrade(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: 'inherit' }}
                    >
                      <option value="Grade A">Grade A (Premium)</option>
                      <option value="Grade B">Grade B (Standard)</option>
                      <option value="Grade C">Grade C (Commercial)</option>
                    </select>
                  </div>
                </div>

                {contribQty && selectedPool && (
                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                    <div style={{ color: '#10b981', fontWeight: 600 }}>
                      Estimated Net Payout: {formatPrice(estimatedNetPayout)}
                    </div>
                    <small style={{ color: 'var(--slate-400)' }}>
                      Calculated as {contribQty} × {selectedPool.unitPrice} ETB minus 5% platform escrow commission.
                    </small>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowJoinModal(false)}
                    disabled={submittingContrib}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submittingContrib}>
                    {submittingContrib ? 'Pledging Produce...' : 'Confirm Pledge'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
