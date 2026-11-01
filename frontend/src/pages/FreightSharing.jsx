import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { freightService } from '../services/freightService';

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

export default function FreightSharing() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingTripId, setBookingTripId] = useState(null);
  const [bookQuintals, setBookQuintals] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  // Transporter form state
  const [showPostModal, setShowPostModal] = useState(false);
  const [tripForm, setTripForm] = useState(emptyTripForm);
  const [savingTrip, setSavingTrip] = useState(false);

  const loadTrips = () => {
    setLoading(true);
    freightService
      .getAll()
      .then((data) => setTrips(data.trips))
      .catch(() => setError('Could not load freight trips'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const handleBook = async (tripId) => {
    if (!bookQuintals || Number(bookQuintals) <= 0) return;
    setBusy(true);
    setError('');
    setBookingSuccess('');
    try {
      const res = await freightService.book(tripId, Number(bookQuintals));
      setBookingSuccess(`Successfully reserved ${bookQuintals} Quintals! Estimated transport: ${res.totalCost?.toLocaleString()} ETB. The driver will contact you.`);
      setBookingTripId(null);
      setBookQuintals('');
      loadTrips();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not book freight space.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setSavingTrip(true);
    setError('');
    try {
      await freightService.create({
        ...tripForm,
        totalCapacityQuintals: Number(tripForm.totalCapacityQuintals),
        pricePerQuintal: Number(tripForm.pricePerQuintal),
      });
      setShowPostModal(false);
      setTripForm(emptyTripForm);
      loadTrips();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post trip.');
    } finally {
      setSavingTrip(false);
    }
  };

  return (
    <div className="freight-page">
      <section className="page-intro">
        <span className="eyebrow">🚚 Rural Logistics & Freight Matchmaker</span>
        <h1>{t('freightBannerTitle')}</h1>
        <p>{t('freightBannerSubtitle')}</p>
      </section>

      <div className="freight-actions-bar">
        <div className="freight-stats-badge">
          <span>📦 {trips.length} Active Routes Available</span>
        </div>
        {user && (
          <button className="btn btn-primary" onClick={() => setShowPostModal(true)}>
            + Post Truck / Return Trip
          </button>
        )}
      </div>

      {bookingSuccess && <div className="alert-banner alert-success">{bookingSuccess}</div>}
      {error && <div className="alert-banner alert-error">{error}</div>}

      {showPostModal && (
        <div className="modal-backdrop" onClick={() => setShowPostModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Post Available Truck Capacity</h2>
            <p>Help farmers move crops and fill your empty return miles.</p>

            <form onSubmit={handleCreateTrip} className="auth-form modal-form">
              <div className="form-row">
                <div className="form-col">
                  <label>Driver Name</label>
                  <input
                    required
                    placeholder="e.g. Girma Desta"
                    value={tripForm.driverName}
                    onChange={(e) => setTripForm({ ...tripForm, driverName: e.target.value })}
                  />
                </div>
                <div className="form-col">
                  <label>Driver Phone Number</label>
                  <input
                    required
                    placeholder="+2519..."
                    value={tripForm.driverPhone}
                    onChange={(e) => setTripForm({ ...tripForm, driverPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label>Vehicle Type</label>
                  <select
                    value={tripForm.vehicleType}
                    onChange={(e) => setTripForm({ ...tripForm, vehicleType: e.target.value })}
                  >
                    <option value="Isuzu NPR (35-50 Quintals)">Isuzu NPR (35-50 Quintals)</option>
                    <option value="FSR Truck (70-100 Quintals)">FSR Truck (70-100 Quintals)</option>
                    <option value="Sino-Truck (250-400 Quintals)">Sino-Truck (250-400 Quintals)</option>
                    <option value="Pickup / Van (10-20 Quintals)">Pickup / Van (10-20 Quintals)</option>
                  </select>
                </div>
                <div className="form-col">
                  <label>Plate Number (Optional)</label>
                  <input
                    placeholder="e.g. ET-3-12345"
                    value={tripForm.plateNumber}
                    onChange={(e) => setTripForm({ ...tripForm, plateNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label>Origin City (መነሻ)</label>
                  <input
                    required
                    placeholder="e.g. Wolaita Sodo, Jimma, Bahir Dar"
                    value={tripForm.originCity}
                    onChange={(e) => setTripForm({ ...tripForm, originCity: e.target.value })}
                  />
                </div>
                <div className="form-col">
                  <label>Destination City (መድረሻ)</label>
                  <input
                    required
                    placeholder="e.g. Addis Ababa, Adama, Hawassa"
                    value={tripForm.destinationCity}
                    onChange={(e) => setTripForm({ ...tripForm, destinationCity: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label>Departure Date</label>
                  <input
                    required
                    type="date"
                    value={tripForm.departureDate}
                    onChange={(e) => setTripForm({ ...tripForm, departureDate: e.target.value })}
                  />
                </div>
                <div className="form-col">
                  <label>Available Capacity (Quintals)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 40"
                    value={tripForm.totalCapacityQuintals}
                    onChange={(e) => setTripForm({ ...tripForm, totalCapacityQuintals: e.target.value })}
                  />
                </div>
                <div className="form-col">
                  <label>Price per Quintal (ETB)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 350"
                    value={tripForm.pricePerQuintal}
                    onChange={(e) => setTripForm({ ...tripForm, pricePerQuintal: e.target.value })}
                  />
                </div>
              </div>

              <label>Route Notes / Pickup Points along highway</label>
              <textarea
                rows={2}
                placeholder="e.g. Can pick up cargo in Boditi, Alaba, or Shashemene..."
                value={tripForm.notes}
                onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })}
              />

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={savingTrip}>
                  {savingTrip ? 'Publishing...' : 'Publish Route'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPostModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="page-loading">Loading available freight routes...</div>
      ) : trips.length === 0 ? (
        <div className="empty-card">No scheduled freight trips currently. Be the first to post an empty return trip!</div>
      ) : (
        <div className="freight-grid">
          {trips.map((trip) => (
            <article className="freight-card" key={trip._id}>
              <div className="freight-card-header">
                <span className="badge badge-accepted">{trip.vehicleType}</span>
                {trip.isReturnTripDiscount && (
                  <span className="badge badge-discount">⚡ Return-Trip Discount</span>
                )}
              </div>

              <div className="freight-route">
                <div className="route-point">
                  <span className="point-dot origin-dot"></span>
                  <div>
                    <strong>{trip.originCity}</strong>
                    <small>{trip.originRegion}</small>
                  </div>
                </div>
                <div className="route-arrow">➔</div>
                <div className="route-point">
                  <span className="point-dot dest-dot"></span>
                  <div>
                    <strong>{trip.destinationCity}</strong>
                    <small>{trip.destinationRegion}</small>
                  </div>
                </div>
              </div>

              <div className="freight-meta-grid">
                <div>
                  <span className="meta-label">Departure</span>
                  <strong>{new Date(trip.departureDate).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="meta-label">Open Space</span>
                  <strong className="text-highlight">
                    {trip.availableCapacityQuintals} / {trip.totalCapacityQuintals} Qtl
                  </strong>
                </div>
                <div>
                  <span className="meta-label">Rate</span>
                  <strong>{trip.pricePerQuintal} ETB/Qtl</strong>
                </div>
                <div>
                  <span className="meta-label">Driver Contact</span>
                  <strong>📞 {trip.driverPhone}</strong>
                </div>
              </div>

              {trip.notes && <p className="freight-notes">"{trip.notes}"</p>}

              <div className="freight-card-footer">
                {bookingTripId === trip._id ? (
                  <div className="booking-inline-form">
                    <input
                      type="number"
                      min="1"
                      max={trip.availableCapacityQuintals}
                      placeholder="Quintals"
                      value={bookQuintals}
                      onChange={(e) => setBookQuintals(e.target.value)}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={busy || !bookQuintals}
                      onClick={() => handleBook(trip._id)}
                    >
                      {busy ? 'Booking...' : 'Confirm'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setBookingTripId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary btn-block"
                    disabled={trip.availableCapacityQuintals <= 0}
                    onClick={() => {
                      if (!user) return alert('Please login to book freight space');
                      setBookingTripId(trip._id);
                    }}
                  >
                    {trip.availableCapacityQuintals > 0 ? '📦 Book Cargo Space' : 'Truck Full'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
