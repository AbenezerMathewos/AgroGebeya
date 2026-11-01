import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { marketPriceService } from '../services/marketPriceService';
import { poolService } from '../services/poolService';
import { useLanguage } from '../context/LanguageContext';
import ProductThumb from '../components/ProductThumb';

const emptyPriceForm = { crop: '', market: '', region: 'Addis Ababa', lowPrice: '', highPrice: '', unit: 'Quintal (100Kg)', marketType: 'Terminal Wholesale' };

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [prices, setPrices] = useState([]);
  const [pools, setPools] = useState([]);
  const [tab, setTab] = useState('users');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [priceForm, setPriceForm] = useState(emptyPriceForm);
  const [priceError, setPriceError] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  const loadAll = () => {
    Promise.all([
      adminService.getStats(),
      adminService.getUsers(),
      adminService.getProducts(),
      marketPriceService.getAll(),
      poolService.getAllPools().catch(() => ({ pools: [] })),
    ])
      .then(([statsData, usersData, productsData, pricesData, poolsData]) => {
        setStats(statsData);
        setUsers(usersData.users || []);
        setProducts(productsData.products || []);
        setPrices(pricesData.prices || []);
        setPools(poolsData.pools || []);
      })
      .catch(() => setError('Could not load administrative data.'));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user and all associated records?')) return;
    setBusyId(id);
    try {
      await adminService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      loadAll();
    } catch {
      setError('Could not delete that user account.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this marketplace product?')) return;
    setBusyId(id);
    try {
      await adminService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      loadAll();
    } catch {
      setError('Could not delete that product listing.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddPrice = async (e) => {
    e.preventDefault();
    setPriceError('');
    setSavingPrice(true);
    try {
      const { price } = await marketPriceService.create({
        ...priceForm,
        lowPrice: Number(priceForm.lowPrice),
        highPrice: Number(priceForm.highPrice),
      });
      setPrices((prev) => [price, ...prev]);
      setPriceForm(emptyPriceForm);
    } catch (err) {
      setPriceError(err.response?.data?.message || 'Could not save market price record.');
    } finally {
      setSavingPrice(false);
    }
  };

  const handleDeletePrice = async (id) => {
    if (!window.confirm('Delete this price radar record?')) return;
    setBusyId(id);
    try {
      await marketPriceService.remove(id);
      setPrices((prev) => prev.filter((p) => p._id !== id));
    } catch {
      setError('Could not delete that market price record.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Admin Header */}
      <div className="page-intro">
        <div className="badge-row-header">
          <span className="eyebrow">{t('adminDashboard')}</span>
          <span className="badge badge-role-admin">🛡️ System Administration</span>
        </div>
        <h1>National Agricultural Platform Control Center</h1>
        <p>Oversee registered actors, verify cooperative union listings, and broadcast daily ECX wholesale market prices.</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      {/* Admin Stats Grid */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <strong>{stats.totalUsers || 0}</strong>
            <span>Total Registered Users</span>
          </div>
          <div className="stat-card">
            <strong className="text-gain">{stats.totalFarmers || 0}</strong>
            <span>Smallholders</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: '#0ea5e9' }}>{stats.totalCooperatives || 0}</strong>
            <span>Union Cooperatives</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: '#f59e0b' }}>{stats.totalBuyers || 0}</strong>
            <span>Wholesale Buyers</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: '#8b5cf6' }}>{stats.totalTransporters || 0}</strong>
            <span>Freight Transporters</span>
          </div>
          <div className="stat-card">
            <strong style={{ color: '#10b981' }}>{pools.length}</strong>
            <span>Bulk Pooling Contracts</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button onClick={() => setTab('users')} className={`admin-tab-btn ${tab === 'users' ? 'active' : ''}`}>
          👥 Manage Users ({users.length})
        </button>
        <button onClick={() => setTab('products')} className={`admin-tab-btn ${tab === 'products' ? 'active' : ''}`}>
          🌾 Manage Harvests ({products.length})
        </button>
        <button onClick={() => setTab('pools')} className={`admin-tab-btn ${tab === 'pools' ? 'active' : ''}`}>
          🤝 Cooperative Pools ({pools.length})
        </button>
        <button onClick={() => setTab('prices')} className={`admin-tab-btn ${tab === 'prices' ? 'active' : ''}`}>
          📊 Market Price Radar ({prices.length})
        </button>
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th>Region / Zone</th>
                <th>Cooperative Union</th>
                <th>System Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>{u.email}</td>
                  <td>📍 {u.region || 'Nationwide'}</td>
                  <td>{u.cooperative ? `🏢 ${u.cooperative}` : '—'}</td>
                  <td>
                    <span className={`badge badge-role-${u.role}`}>{u.role}</span>
                  </td>
                  <td>
                    {u.role !== 'admin' && (
                      <button onClick={() => handleDeleteUser(u._id)} disabled={busyId === u._id} className="btn-table-delete">
                        {busyId === u._id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Products Tab */}
      {tab === 'products' && (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Harvest Title</th>
                <th>Category</th>
                <th>Grade</th>
                <th>Seller / Union</th>
                <th>Unit Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <ProductThumb product={p} />
                  </td>
                  <td>
                    <strong>{p.title}</strong>
                    {p.isCooperativePooled && <span className="badge badge-coop table-tag">Union Lot</span>}
                  </td>
                  <td>{p.category}</td>
                  <td>
                    <span className="badge badge-grade">{p.grade || 'Grade 1'}</span>
                  </td>
                  <td>{p.cooperativeName ? `🏢 ${p.cooperativeName}` : `👨‍🌾 ${p.owner?.name}`}</td>
                  <td>{p.price.toLocaleString()} ETB</td>
                  <td>
                    <button onClick={() => handleDeleteProduct(p._id)} disabled={busyId === p._id} className="btn-table-delete">
                      {busyId === p._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cooperative Pools Tab */}
      {tab === 'pools' && (
        <div className="table-responsive-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Crop & Variety</th>
                <th>Procuring Buyer</th>
                <th>Target Quantity</th>
                <th>Progress (Pooled)</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Platform Fee (5%)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pools.map((pool) => {
                const pct = Math.min(100, Math.round(((pool.currentQuantity || 0) / pool.targetQuantity) * 100)) || 0;
                return (
                  <tr key={pool._id}>
                    <td>
                      <strong>🌾 {pool.cropName}</strong>
                      {pool.variety && <small style={{ display: 'block', color: 'var(--slate-400)' }}>{pool.variety}</small>}
                    </td>
                    <td>
                      <strong>{pool.buyer?.name || 'Institutional Buyer'}</strong>
                      {pool.buyer?.cooperativeName && (
                        <small style={{ display: 'block', color: 'var(--slate-400)' }}>🏢 {pool.buyer.cooperativeName}</small>
                      )}
                    </td>
                    <td>
                      <strong>{pool.targetQuantity} {pool.unit || 'Quintals'}</strong>
                      <small style={{ display: 'block', color: 'var(--slate-400)' }}>📍 {pool.deliveryRegion || 'Addis Ababa'}</small>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                        <span>{pool.currentQuantity || 0} / {pool.targetQuantity}</span>
                        <span style={{ fontWeight: 600 }}>{pct}%</span>
                      </div>
                      <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#10b981' : '#38bdf8', borderRadius: '3px' }} />
                      </div>
                      <small style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>{pool.contributors?.length || 0} contributor(s)</small>
                    </td>
                    <td>{pool.unitPrice?.toLocaleString()} ETB</td>
                    <td>
                      <strong>{(pool.totalContractValue || (pool.targetQuantity * pool.unitPrice))?.toLocaleString()} ETB</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#10b981' }}>{(pool.totalCommission || ((pool.targetQuantity * pool.unitPrice) * 0.05))?.toLocaleString()} ETB</strong>
                    </td>
                    <td>
                      <span className={`badge ${pool.status === 'pool_filled' ? 'badge-accepted' : pool.status === 'open' ? 'badge-grade' : 'badge-muted'}`}>
                        {pool.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {pools.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    No bulk pooling contracts registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Market Prices Tab */}
      {tab === 'prices' && (
        <div className="admin-prices">
          <form className="filters-form price-add-form" onSubmit={handleAddPrice}>
            {priceError && <p className="form-error">{priceError}</p>}
            <input
              required
              placeholder="Crop Name (e.g. White Magna Teff)"
              value={priceForm.crop}
              onChange={(e) => setPriceForm({ ...priceForm, crop: e.target.value })}
            />
            <input
              required
              placeholder="Market Hub (e.g. Ehil Berenda / Sodo)"
              value={priceForm.market}
              onChange={(e) => setPriceForm({ ...priceForm, market: e.target.value })}
            />
            <input
              required
              type="number"
              min="0"
              placeholder="Low Price (ETB)"
              value={priceForm.lowPrice}
              onChange={(e) => setPriceForm({ ...priceForm, lowPrice: e.target.value })}
            />
            <input
              required
              type="number"
              min="0"
              placeholder="High Price (ETB)"
              value={priceForm.highPrice}
              onChange={(e) => setPriceForm({ ...priceForm, highPrice: e.target.value })}
            />
            <select
              value={priceForm.unit}
              onChange={(e) => setPriceForm({ ...priceForm, unit: e.target.value })}
            >
              <option value="Quintal (100Kg)">Quintal (100Kg)</option>
              <option value="Kg">Kg</option>
              <option value="Box / Crate">Box / Crate</option>
            </select>
            <button className="btn btn-primary" disabled={savingPrice}>
              {savingPrice ? 'Broadcasting...' : '+ Broadcast Price'}
            </button>
          </form>

          <div className="table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Commodity</th>
                  <th>Market Hub</th>
                  <th>Wholesale Spread Range</th>
                  <th>Last Recorded Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price) => (
                  <tr key={price._id}>
                    <td>
                      <strong>{price.crop}</strong>
                    </td>
                    <td>📍 {price.market}</td>
                    <td>
                      <strong>{price.lowPrice.toLocaleString()} – {price.highPrice.toLocaleString()} ETB</strong> / {price.unit}
                    </td>
                    <td>{new Date(price.recordedAt).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleDeletePrice(price._id)} disabled={busyId === price._id} className="btn-table-delete">
                        {busyId === price._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
                {prices.length === 0 && (
                  <tr>
                    <td colSpan={5}>No market price records broadcasted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}