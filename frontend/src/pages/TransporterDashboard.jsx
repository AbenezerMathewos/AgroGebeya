import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrencyUnit } from '../context/CurrencyUnitContext';
import { freightService } from '../services/freightService';
import { poolService } from '../services/poolService';

const emptyTripForm = {
  driverName: '',
  driverPhone: '',
  vehicleType: 'Isuzu NPR (35-50 Quintals)',
  plateNumber: '',
  originRegion: 'South Ethiopia',
  originCity: '',
  destinationRegion: 'Addis Ababa',
  destinationCity: 'Addis Ababa',
  departureDate: '',
  totalCapacityQuintals: '',
  pricePerQuintal: '',
  isReturnTripDiscount: true,
  notes: '',
};

export default function TransporterDashboard() {
  const { user } = useAuth();
  const { formatPrice } = useCurrencyUnit();

  const [trips, setTrips] = useState([]);
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trips'); // 'trips' | 'cargo-opportunities'
  const [statusFilter, setStatusFilter] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Trip Creation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tripForm, setTripForm] = useState({
    ...emptyTripForm,
    driverName: user?.name || '',
    driverPhone: user?.phone || '',
  });
  const [submittingTrip, setSubmittingTrip] = useState(false);
  const [updatingTripId, setUpdatingTripId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tripsRes, poolsRes] = await Promise.all([
        freightService.getMyTrips().catch(() => ({ trips: [] })),
        poolService.getOpenPools().catch(() => ({ pools: [] })),
      ]);
      setTrips(tripsRes.trips || []);
      setPools(poolsRes.pools || []);
    } catch (err) {
      console.error('Error loading transporter data:', err);
      setErrorMsg('Could not load fleet data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute fleet logistics metrics
  const metrics = useMemo(() => {
    const totalTrips = trips.length;
    const activeTrips = trips.filter((t) => t.status === 'scheduled' || t.status === 'in_transit').length;
    const totalCapacity = trips.reduce((sum, t) => sum + (t.totalCapacityQuintals || 0), 0);
    const bookedVolume = trips.reduce(
      (sum, t) => sum + Math.max(0, (t.totalCapacityQuintals || 0) - (t.availableCapacityQuintals || 0)),
      0
    );
    const estimatedRevenue = trips.reduce((sum, t) => {
      const booked = Math.max(0, (t.totalCapacityQuintals || 0) - (t.availableCapacityQuintals || 0));
      return sum + booked * (t.pricePerQuintal || 0);
    }, 0);

    return { totalTrips, activeTrips, totalCapacity, bookedVolume, estimatedRevenue };
  }, [trips]);

  const filteredTrips = useMemo(() => {
    if (statusFilter === 'all') return trips;
    return trips.filter((t) => t.status === statusFilter);
  }, [trips, statusFilter]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setSubmittingTrip(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await freightService.create({
        ...tripForm,
        totalCapacityQuintals: Number(tripForm.totalCapacityQuintals),
        pricePerQuintal: Number(tripForm.pricePerQuintal),
      });
      setSuccessMsg('Return freight trip posted successfully! Shippers can now reserve capacity.');
      setIsModalOpen(false);
      setTripForm({
        ...emptyTripForm,
        driverName: user?.name || '',
        driverPhone: user?.phone || '',
      });
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to post freight trip.');
    } finally {
      setSubmittingTrip(false);
    }
  };

  const handleUpdateStatus = async (tripId, newStatus) => {
    setUpdatingTripId(tripId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await freightService.updateStatus(tripId, newStatus);
      setSuccessMsg(`Trip status updated to "${newStatus.replace('_', ' ')}".`);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not update trip status.');
    } finally {
      setUpdatingTripId(null);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel and remove this scheduled trip?')) return;
    setUpdatingTripId(tripId);
    try {
      await freightService.deleteTrip(tripId);
      setSuccessMsg('Trip removed successfully.');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not delete trip.');
    } finally {
      setUpdatingTripId(null);
    }
  };

  return (
    <div className="farmer-dashboard-page transporter-dashboard-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div className="dashboard-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <span className="eyebrow" style={{ display: 'inline-block', color: 'var(--amber-500, #f59e0b)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            🚚 Ethiopian Agricultural Freight Hub
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Transporter Command Center</h1>
          <p className="dashboard-subtitle" style={{ color: 'var(--slate-500)', margin: 0, maxWidth: '650px' }}>
            Welcome, <strong>{user?.name}</strong>. Manage your rural freight fleet, post discounted return-trip backhauls, and connect directly with unions and institutional buyers.
          </p>
        </div>
        <div className="dashboard-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Post Return Freight Trip
          </button>
          <Link to="/freight" className="btn btn-secondary">
            🚚 Public Freight Board
          </Link>
          <Link to="/messages" className="btn btn-secondary">
            💬 Cargo Inquiries
          </Link>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1.25rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#047857' }}>
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1.25rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#b91c1c' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Metrics Banner */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>Active Scheduled Routes</span>
          <strong style={{ display: 'block', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: '#38bdf8' }}>
            {metrics.activeTrips} <small style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--slate-400)' }}>/ {metrics.totalTrips} Total</small>
          </strong>
        </div>

        <div className="stat-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>Total Fleet Capacity</span>
          <strong style={{ display: 'block', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
            {metrics.totalCapacity.toLocaleString()} <small style={{ fontSize: '0.875rem', fontWeight: 400 }}>Quintals</small>
          </strong>
        </div>

        <div className="stat-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>Booked Freight Volume</span>
          <strong style={{ display: 'block', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: '#10b981' }}>
            {metrics.bookedVolume.toLocaleString()} <small style={{ fontSize: '0.875rem', fontWeight: 400 }}>Quintals</small>
          </strong>
        </div>

        <div className="stat-card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>Estimated Trip Bookings</span>
          <strong style={{ display: 'block', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: '#f59e0b' }}>
            {formatPrice(metrics.estimatedRevenue)}
          </strong>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', marginBottom: '1.5rem', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('trips')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'trips' ? '3px solid #10b981' : '3px solid transparent',
            color: activeTab === 'trips' ? 'var(--text-color, #10b981)' : 'var(--slate-400)',
            fontWeight: activeTab === 'trips' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          🚚 My Fleet Trips ({trips.length})
        </button>
        <button
          onClick={() => setActiveTab('cargo-opportunities')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'cargo-opportunities' ? '3px solid #10b981' : '3px solid transparent',
            color: activeTab === 'cargo-opportunities' ? 'var(--text-color, #10b981)' : 'var(--slate-400)',
            fontWeight: activeTab === 'cargo-opportunities' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          📦 Available Cargo & Pooling Demands ({pools.length})
        </button>
      </div>

      {/* Tab 1: My Trips */}
      {activeTab === 'trips' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>Filter by Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color, #475569)', background: 'var(--card-bg, #1e293b)', color: 'inherit' }}
              >
                <option value="all">All Trips</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_transit">En Route (In Transit)</option>
                <option value="full">Capacity Full</option>
                <option value="completed">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button onClick={loadData} className="btn btn-ghost btn-sm" title="Refresh">
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-400)' }}>Loading your freight routes...</div>
          ) : filteredTrips.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg, rgba(255,255,255,0.02))', borderRadius: '12px', border: '1px dashed var(--border-color, rgba(255,255,255,0.15))' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>🚚</span>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>No Freight Trips Scheduled</h3>
              <p style={{ color: 'var(--slate-400)', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                Post your empty return trips (e.g. from Addis Ababa back to Southern Ethiopia or Oromia) to offer discounted freight to smallholders and cooperatives.
              </p>
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                + Schedule First Freight Trip
              </button>
            </div>
          ) : (
            <div className="table-responsive-wrapper" style={{ overflowX: 'auto' }}>
              <table className="my-products-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                    <th style={{ padding: '0.75rem' }}>Route</th>
                    <th style={{ padding: '0.75rem' }}>Vehicle & Driver</th>
                    <th style={{ padding: '0.75rem' }}>Departure</th>
                    <th style={{ padding: '0.75rem' }}>Capacity Progress</th>
                    <th style={{ padding: '0.75rem' }}>Freight Rate</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => {
                    const booked = Math.max(0, trip.totalCapacityQuintals - trip.availableCapacityQuintals);
                    const pct = Math.min(100, Math.round((booked / trip.totalCapacityQuintals) * 100)) || 0;

                    return (
                      <tr key={trip._id} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>
                            📍 {trip.originCity} ➔ {trip.destinationCity}
                          </div>
                          <small style={{ color: 'var(--slate-400)' }}>
                            {trip.originRegion} → {trip.destinationRegion}
                          </small>
                        </td>

                        <td style={{ padding: '1rem 0.75rem' }}>
                          <div style={{ fontWeight: 500 }}>{trip.vehicleType}</div>
                          <small style={{ color: 'var(--slate-400)' }}>
                            {trip.driverName} • {trip.driverPhone} {trip.plateNumber && `(${trip.plateNumber})`}
                          </small>
                        </td>

                        <td style={{ padding: '1rem 0.75rem' }}>
                          <div>{new Date(trip.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <small style={{ color: 'var(--slate-400)' }}>
                            {new Date(trip.departureDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </td>

                        <td style={{ padding: '1rem 0.75rem', minWidth: '160px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                            <span>{booked} / {trip.totalCapacityQuintals} Qtl</span>
                            <span style={{ fontWeight: 600, color: pct >= 90 ? '#ef4444' : '#10b981' }}>{pct}%</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 90 ? '#ef4444' : '#10b981', borderRadius: '3px' }} />
                          </div>
                          <small style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                            {trip.availableCapacityQuintals} Qtl remaining
                          </small>
                        </td>

                        <td style={{ padding: '1rem 0.75rem' }}>
                          <div style={{ fontWeight: 700 }}>{formatPrice(trip.pricePerQuintal)} <small style={{ fontWeight: 400 }}>/ Qtl</small></div>
                          {trip.isReturnTripDiscount && (
                            <span style={{ display: 'inline-block', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#f59e0b22', color: '#f59e0b', marginTop: '0.2rem' }}>
                              ⚡ Return Discount
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '1rem 0.75rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              background:
                                trip.status === 'scheduled'
                                  ? 'rgba(56, 189, 248, 0.15)'
                                  : trip.status === 'in_transit'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : trip.status === 'completed'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : trip.status === 'full'
                                  ? 'rgba(168, 85, 247, 0.15)'
                                  : 'rgba(148, 163, 184, 0.15)',
                              color:
                                trip.status === 'scheduled'
                                  ? '#38bdf8'
                                  : trip.status === 'in_transit'
                                  ? '#f59e0b'
                                  : trip.status === 'completed'
                                  ? '#10b981'
                                  : trip.status === 'full'
                                  ? '#c084fc'
                                  : '#94a3b8',
                            }}
                          >
                            {trip.status === 'in_transit' ? '🚚 En Route' : trip.status}
                          </span>
                        </td>

                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            {trip.status === 'scheduled' && (
                              <button
                                onClick={() => handleUpdateStatus(trip._id, 'in_transit')}
                                disabled={updatingTripId === trip._id}
                                className="btn btn-sm"
                                style={{ background: '#0284c7', color: '#fff', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                title="Mark truck departed and en route"
                              >
                                🚚 Depart
                              </button>
                            )}

                            {trip.status === 'in_transit' && (
                              <button
                                onClick={() => handleUpdateStatus(trip._id, 'completed')}
                                disabled={updatingTripId === trip._id}
                                className="btn btn-sm"
                                style={{ background: '#059669', color: '#fff', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                title="Mark cargo delivered to destination"
                              >
                                ✅ Arrived
                              </button>
                            )}

                            {trip.status !== 'completed' && trip.status !== 'cancelled' && (
                              <button
                                onClick={() => handleDeleteTrip(trip._id)}
                                disabled={updatingTripId === trip._id}
                                className="btn btn-ghost btn-sm"
                                style={{ color: '#ef4444', fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                                title="Cancel and delete trip"
                              >
                                ✕
                              </button>
                            )}
                          </div>
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

      {/* Tab 2: Available Cargo Demands */}
      {activeTab === 'cargo-opportunities' && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Institutional Bulk Contracts & Cargo In Need of Freight</h3>
            <p style={{ color: 'var(--slate-400)', margin: 0 }}>
              Universities, exporters, and cooperatives have aggregated produce in regional depots that require long-haul transportation.
            </p>
          </div>

          {pools.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--card-bg, rgba(255,255,255,0.02))', borderRadius: '12px' }}>
              <p style={{ color: 'var(--slate-400)' }}>No active open bulk contracts at this moment.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {pools.map((p) => (
                <div key={p._id} style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--card-bg, rgba(255,255,255,0.04))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>🌾 {p.cropName}</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                      {p.targetQuantity} {p.unit || 'Quintals'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--slate-400)', margin: '0 0 0.75rem 0' }}>
                    Destination: <strong>{p.deliveryRegion || 'Addis Ababa'}</strong>
                  </p>

                  <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    <span>Buyer: <strong>{p.buyer?.name || 'Institutional Client'}</strong></span>
                    {p.buyer?.cooperativeName && (
                      <span style={{ display: 'block', color: 'var(--slate-400)' }}>🏢 {p.buyer.cooperativeName}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                    <span style={{ fontSize: '0.8rem', color: '#10b981' }}>
                      {p.currentQuantity} / {p.targetQuantity} Qtl Aggregated
                    </span>
                    <Link to="/messages" className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                      Contact Buyer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Return Trip Modal */}
      {isModalOpen && (
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
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.35rem' }}>🚚 Post Scheduled / Return Freight Trip</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--slate-400)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrip}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                    Driver Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={tripForm.driverName}
                    onChange={(e) => setTripForm({ ...tripForm, driverName: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                    Driver Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={tripForm.driverPhone}
                    onChange={(e) => setTripForm({ ...tripForm, driverPhone: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                    Vehicle Type *
                  </label>
                  <select
                    value={tripForm.vehicleType}
                    onChange={(e) => setTripForm({ ...tripForm, vehicleType: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: 'inherit' }}
                  >
                    <option value="Isuzu NPR (35-50 Quintals)">Isuzu NPR (35-50 Quintals)</option>
                    <option value="FSR Truck (70-100 Quintals)">FSR Truck (70-100 Quintals)</option>
                    <option value="Sino-Truck (250-400 Quintals)">Sino-Truck (250-400 Quintals)</option>
                    <option value="Pickup / Van (10-20 Quintals)">Pickup / Van (10-20 Quintals)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                    Plate Number
                  </label>
                  <input
                    type="text"
                    placeholder="ET 3-45678"
                    value={tripForm.plateNumber}
                    onChange={(e) => setTripForm({ ...tripForm, plateNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                  />
                </div>
              </div>

              {/* Origin */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                    Origin Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={tripForm.originRegion}
                    onChange={(e) => setTripForm({ ...tripForm, originRegion: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                    Origin City / Station *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Addis Ababa or Soddo"
                    value={tripForm.originCity}
                    onChange={(e) => setTripForm({ ...tripForm, originCity: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                  />
                </div>
              </div>

              {/* Destination */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                    Destination Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={tripForm.destinationRegion}
                    onChange={(e) => setTripForm({ ...tripForm, destinationRegion: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                    Destination City / Terminal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hawassa, Soddo, Addis"
                    value={tripForm.destinationCity}
                    onChange={(e) => setTripForm({ ...tripForm, destinationCity: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                  />
                </div>
              </div>

              {/* Departure Date & Capacity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                    Departure Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={tripForm.departureDate}
                    onChange={(e) => setTripForm({ ...tripForm, departureDate: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                    Available Capacity (Quintals) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50"
                    value={tripForm.totalCapacityQuintals}
                    onChange={(e) => setTripForm({ ...tripForm, totalCapacityQuintals: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                  />
                </div>
              </div>

              {/* Price & Discount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                    Freight Price per Quintal (ETB) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 150"
                    value={tripForm.pricePerQuintal}
                    onChange={(e) => setTripForm({ ...tripForm, pricePerQuintal: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                  />
                </div>
                <div style={{ paddingTop: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={tripForm.isReturnTripDiscount}
                      onChange={(e) => setTripForm({ ...tripForm, isReturnTripDiscount: e.target.checked })}
                    />
                    <span>Offer Return-Trip Discount ⚡</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--slate-300)' }}>
                  Pickup Notes / Instructions
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g., Returning empty from Merkato delivery; can load enset, potatoes, or maize along Hawassa corridor."
                  value={tripForm.notes}
                  onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submittingTrip}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingTrip}>
                  {submittingTrip ? 'Publishing Route...' : 'Publish Scheduled Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
