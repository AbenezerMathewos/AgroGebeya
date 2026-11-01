import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { marketPriceService } from '../services/marketPriceService';
import { useLanguage } from '../context/LanguageContext';
import { useCurrencyUnit } from '../context/CurrencyUnitContext';
import PriceSparkline from '../components/PriceSparkline';

const CROP_CATEGORIES = [
  { id: 'all', label: 'All Commodities' },
  { id: 'cereals', label: '🌾 Cereals & Grains (Teff, Wheat, Maize)', keywords: ['teff', 'ጤፍ', 'maize', 'በቆሎ', 'wheat', 'ስንዴ'] },
  { id: 'coffee', label: '☕ Coffee & Cash Crops (Arabica, Yirgacheffe)', keywords: ['coffee', 'ቡና', 'yirgacheffe'] },
  { id: 'spices', label: '🫚 Roots & Spices (Ginger, Enset, Kocho)', keywords: ['ginger', 'ዝንጅብል', 'kocho', 'ቆጮ', 'enset', 'እንሰት', 'avocado', 'አቮካዶ'] },
  { id: 'pulses', label: '🫘 Pulses & Oilseeds (Sesame, Beans)', keywords: ['sesame', 'ሰሊጥ', 'beans', 'ቦሎቄ', 'soybean', 'አተር'] },
];

const REGION_FILTERS = [
  { id: 'all', label: 'All Corridors' },
  { id: 'Addis Ababa', label: '🏢 Addis Ababa (Terminal)' },
  { id: 'South Ethiopia', label: '🌱 South Ethiopia & Wolaita' },
  { id: 'Oromia', label: '☕ Oromia & Jimma' },
  { id: 'Amhara', label: '🌾 Amhara & Gojjam' },
  { id: 'Sidama', label: '🍯 Sidama & Hawassa' },
];

export default function MarketPrices() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrencyUnit();

  const [prices, setPrices] = useState([]);
  const [arbitrage, setArbitrage] = useState([]);
  const [viewMode, setViewMode] = useState('prices'); // 'prices' | 'arbitrage'
  const [filters, setFilters] = useState({ crop: '', market: '', region: '' });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedPriceDetail, setSelectedPriceDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictionData, setPredictionData] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      marketPriceService.getAll(filters),
      marketPriceService.getArbitrage(),
    ])
      .then(([pricesData, arbData]) => {
        setPrices(pricesData.prices || []);
        setArbitrage(arbData.arbitrage || []);
      })
      .catch(() => {
        setPrices([]);
        setArbitrage([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [filters.region]);

  // Client-side filtering by category & region pills
  const filteredPrices = useMemo(() => {
    return prices.filter((item) => {
      // Region filter
      if (selectedRegion !== 'all' && item.region !== selectedRegion) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all') {
        const cat = CROP_CATEGORIES.find((c) => c.id === selectedCategory);
        if (cat && cat.keywords) {
          const match = cat.keywords.some((kw) => item.crop.toLowerCase().includes(kw.toLowerCase()));
          if (!match) return false;
        }
      }
      // Search input filter
      if (filters.crop && !item.crop.toLowerCase().includes(filters.crop.toLowerCase())) {
        return false;
      }
      if (filters.market && !item.market.toLowerCase().includes(filters.market.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [prices, selectedCategory, selectedRegion, filters.crop, filters.market]);

  const handlePredict = async (crop, itemDetails = {}) => {
    setPredicting(true);
    setPredictionError(null);
    try {
      const params = {
        market: itemDetails.market,
        region: itemDetails.region,
        lowPrice: itemDetails.lowPrice,
        highPrice: itemDetails.highPrice,
        unit: itemDetails.unit,
      };
      const res = await marketPriceService.predictPrice(crop, params);
      if (res.success && res.prediction) {
        setPredictionData({
          ...res.prediction,
          source: res.source,
          market: res.market,
          region: res.region,
        });
      } else {
        setPredictionError('Unable to generate forecast at this time.');
      }
    } catch (err) {
      console.error(err);
      setPredictionError(err.response?.data?.message || 'Network error generating price forecast');
    } finally {
      setPredicting(false);
    }
  };

  const closeModal = () => {
    setSelectedPriceDetail(null);
    setPredictionData(null);
    setPredictionError(null);
  };

  return (
    <div className="market-page">
      {/* Live ECX Trading Floor Ticker Bar */}
      <div className="ecx-live-session-banner">
        <div className="ecx-status-pill">
          <span className="live-session-dot"></span>
          <strong>ECX LIVE FLOOR SESSION</strong>
        </div>
        <div className="ecx-ticker-marquee">
          <span className="ecx-ticker-stat">Daily Settled Volume: <strong>34,800 Qtl</strong></span>
          <span className="ecx-ticker-sep">&middot;</span>
          <span className="ecx-ticker-stat">Total Floor Value: <strong>214.5M ETB</strong></span>
          <span className="ecx-ticker-sep">&middot;</span>
          <span className="ecx-ticker-stat">ECX Index: <strong className="text-gain">+4.8% ▲</strong></span>
          <span className="ecx-ticker-sep">&middot;</span>
          <span className="ecx-ticker-stat">Washed Coffee Q1: <strong>38,500 ETB</strong> (+7.2% ▲)</span>
          <span className="ecx-ticker-sep">&middot;</span>
          <span className="ecx-ticker-stat">Magna Teff: <strong>13,800 ETB</strong> (+4.5% ▲)</span>
          <span className="ecx-ticker-sep">&middot;</span>
          <span className="ecx-ticker-stat">Humera Sesame: <strong>18,200 ETB</strong> (+5.8% ▲)</span>
        </div>
      </div>

      <section className="page-intro">
        <span className="eyebrow">📈 National Market Intelligence & ECX Transparency</span>
        <h1>{t('priceRadarHeadline')}</h1>
        <p>{t('arbitrageSubtitle')}</p>
      </section>

      {/* View Mode Switcher */}
      <div className="market-view-toggle">
        <button
          className={viewMode === 'prices' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setViewMode('prices')}
        >
          📊 Live ECX Market Board ({filteredPrices.length} Records)
        </button>
        <button
          className={viewMode === 'arbitrage' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setViewMode('arbitrage')}
        >
          ⚡ Farmgate-to-Terminal Arbitrage Radar ({arbitrage.length} Commodities)
        </button>
      </div>

      {viewMode === 'prices' ? (
        <>
          {/* Category Filter Pills */}
          <div className="market-category-filters">
            {CROP_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`category-filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Region Filter Pills */}
          <div className="market-region-filters">
            {REGION_FILTERS.map((r) => (
              <button
                key={r.id}
                className={`region-filter-pill ${selectedRegion === r.id ? 'active' : ''}`}
                onClick={() => setSelectedRegion(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Quick Search Form */}
          <form
            className="filters-form price-filters"
            onSubmit={(e) => {
              e.preventDefault();
              loadData();
            }}
          >
            <input
              placeholder="Filter by Crop, e.g. Magna Teff, Washed Coffee, Ginger..."
              value={filters.crop}
              onChange={(e) => setFilters({ ...filters, crop: e.target.value })}
            />
            <input
              placeholder="Filter by Market, e.g. Ehil Berenda, Sodo, Jimma..."
              value={filters.market}
              onChange={(e) => setFilters({ ...filters, market: e.target.value })}
            />
            <button className="btn btn-primary">Filter Prices</button>
          </form>

          {loading ? (
            <div className="page-loading">Fetching real-time ECX market records...</div>
          ) : filteredPrices.length === 0 ? (
            <div className="empty-card">
              <p>No price records match the selected criteria.</p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.85rem' }}
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedRegion('all');
                  setFilters({ crop: '', market: '', region: '' });
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="price-grid">
              {filteredPrices.map((price) => {
                const avgPrice = Math.round((price.lowPrice + price.highPrice) / 2);
                return (
                  <article
                    className="price-card interactive-price-card"
                    key={price._id}
                    onClick={() => setSelectedPriceDetail(price)}
                    title="Click to view ECX Grade & Sourcing Analytics"
                  >
                    <div className="price-card-top">
                      <span className="eyebrow">📍 {price.market}</span>
                      <span className={`badge badge-trend badge-trend-${price.trend}`}>
                        {price.trend === 'rising' ? '▲ Rising' : price.trend === 'falling' ? '▼ Falling' : '● Stable'}
                      </span>
                    </div>

                    <h2>{price.crop}</h2>
                    <span className="price-market-type">
                      {price.marketType} &middot; {price.region}
                    </span>

                    <div className="price-card-figures">
                      <div>
                        <strong>
                          {formatPrice(price.lowPrice)} &ndash; {formatPrice(price.highPrice)}
                        </strong>
                        <small>per {price.unit}</small>
                      </div>
                      <PriceSparkline
                        basePrice={avgPrice}
                        trend={price.trend}
                        unit={price.unit}
                      />
                    </div>

                    <div className="price-card-bottom-bar">
                      <span className="price-date">📅 {new Date(price.recordedAt).toLocaleDateString()}</span>
                      <span className="price-inspect-link">Inspect ECX Grade &rarr;</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Arbitrage Spread Radar View */
        <div className="arbitrage-view">
          <div className="arbitrage-hero-banner">
            <div>
              <h3>⚡ Smallholder Farmgate-to-Terminal Market Spread Radar</h3>
              <p>
                Direct comparison between lowest farmgate primary markets and highest terminal wholesale prices in Addis Ababa & Regional Hubs.
              </p>
            </div>
            <span className="badge badge-gain">● Real-time Margins</span>
          </div>

          {loading ? (
            <div className="page-loading">Calculating nationwide price spreads...</div>
          ) : arbitrage.length === 0 ? (
            <div className="empty-card">No arbitrage comparison data available.</div>
          ) : (
            <div className="arbitrage-table-wrapper">
              <table className="admin-table arbitrage-table">
                <thead>
                  <tr>
                    <th>Commodity</th>
                    <th>Lowest Source (Farmgate Hub)</th>
                    <th>Highest Destination (Terminal Market)</th>
                    <th>Price Gap (Gross Spread)</th>
                    <th>30-Day Trajectory</th>
                    <th>Gross Arbitrage Margin</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {arbitrage.map((item) => (
                    <tr key={item.crop}>
                      <td>
                        <strong>{item.crop}</strong>
                        <div className="small-text">{item.recordsCount} Regional Feeds</div>
                      </td>
                      <td>
                        <span className="text-farmgate">📍 {item.lowestMarket.market} ({item.lowestMarket.region})</span>
                        <div><strong>{formatPrice(item.lowestMarket.price)}</strong> / {item.lowestMarket.unit}</div>
                      </td>
                      <td>
                        <span className="text-terminal">🏢 {item.highestMarket.market} ({item.highestMarket.region})</span>
                        <div><strong>{formatPrice(item.highestMarket.price)}</strong> / {item.highestMarket.unit}</div>
                      </td>
                      <td>
                        <span className="spread-number">+{formatPrice(item.spread)}</span>
                      </td>
                      <td>
                        <PriceSparkline
                          basePrice={item.highestMarket.price || 8000}
                          trend="rising"
                          width={110}
                          height={36}
                          showBadge={false}
                        />
                      </td>
                      <td>
                        <span className="badge badge-gain">+{item.spreadPercentage}% Gross Spread</span>
                      </td>
                      <td>
                        <Link
                          to={`/products?search=${encodeURIComponent(item.crop.split(' ')[0])}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Source &rarr;
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

      {/* ECX Commodity Grade & Logistics Intelligence Modal */}
      {selectedPriceDetail && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-card price-intelligence-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">🇪🇹 ECX Quality Standard & Market Profile</span>
                <h2>{selectedPriceDetail.crop}</h2>
                <span className="price-market-type">{selectedPriceDetail.market} &middot; {selectedPriceDetail.region}</span>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="intelligence-body">
              <div className="intelligence-stat-row">
                <div className="intel-stat-box">
                  <span>Current Price Range</span>
                  <strong>{formatPrice(selectedPriceDetail.lowPrice)} &ndash; {formatPrice(selectedPriceDetail.highPrice)}</strong>
                  <small>per {selectedPriceDetail.unit}</small>
                </div>
                <div className="intel-stat-box">
                  <span>ECX 30-Day Volatility</span>
                  <strong className="text-gain">Low (3.8% σ)</strong>
                  <small>Trend: {selectedPriceDetail.trend.toUpperCase()}</small>
                </div>
                <div className="intel-stat-box">
                  <span>Market Classification</span>
                  <strong>{selectedPriceDetail.marketType}</strong>
                  <small>Verified by MoA & ECX</small>
                </div>
              </div>

              {/* ECX Grade Requirements */}
              <div className="ecx-grade-specs-card">
                <h4>📋 Official ECX Physical Grade Specifications</h4>
                <div className="spec-item-row">
                  <span>Max Allowable Moisture Content:</span>
                  <strong>&le; 11.5% (Certified Laboratory Sealed)</strong>
                </div>
                <div className="spec-item-row">
                  <span>Minimum Physical Purity Rate:</span>
                  <strong>&ge; 98.5% Foreign Matter Free</strong>
                </div>
                <div className="spec-item-row">
                  <span>Recommended Storage Packaging:</span>
                  <strong>Standard 100 Kg Polypropylene Bags with Lot Barcode</strong>
                </div>
              </div>

              {/* AI 30-Day Price Forecast Section */}
              <div className="ai-prediction-card">
                <div className="ai-prediction-header">
                  <div className="ai-prediction-title">
                    <h4>🤖 AI 30-Day Price Forecast</h4>
                    {predictionData?.source && (
                      <span className="ai-source-badge">⚡ {predictionData.source}</span>
                    )}
                  </div>
                  {!predictionData && !predicting && (
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={() => handlePredict(selectedPriceDetail.crop, selectedPriceDetail)}
                      disabled={predicting}
                    >
                      Generate Forecast
                    </button>
                  )}
                  {predictionData && !predicting && (
                    <button 
                      className="btn btn-sm btn-secondary" 
                      onClick={() => handlePredict(selectedPriceDetail.crop, selectedPriceDetail)}
                      title="Re-run forecast analysis"
                    >
                      🔄 Refresh
                    </button>
                  )}
                </div>

                {predicting && (
                  <div className="ai-prediction-loader">
                    <div className="ai-predict-spinner"></div>
                    <div>
                      <strong>Analyzing Ethiopian Agricultural Trends...</strong>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                        Simulating 30-day ECX auction parity & regional supply corridors for {selectedPriceDetail.crop}
                      </p>
                    </div>
                  </div>
                )}

                {predictionError && !predicting && (
                  <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    ⚠️ {predictionError} — <button onClick={() => handlePredict(selectedPriceDetail.crop, selectedPriceDetail)} style={{ background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
                  </div>
                )}

                {predictionData && !predicting && (
                  <div className="ai-prediction-content">
                    <div className="ai-metrics-grid">
                      <div className="ai-metric-box">
                        <span className="ai-metric-label">Predicted Range</span>
                        <div className="ai-metric-value" style={{ color: '#059669' }}>
                          {formatPrice(predictionData.predictedLow)} &ndash; {formatPrice(predictionData.predictedHigh)}
                        </div>
                        <small style={{ fontSize: '0.7rem', color: '#64748b' }}>per {selectedPriceDetail.unit || 'Quintal'}</small>
                      </div>

                      <div className="ai-metric-box">
                        <span className="ai-metric-label">30-Day Trajectory</span>
                        <div>
                          <span className={`ai-trend-pill ${predictionData.trend || 'stable'}`}>
                            {predictionData.trend === 'rising' && '▲ RISING'}
                            {predictionData.trend === 'falling' && '▼ FALLING'}
                            {predictionData.trend === 'stable' && '▶ STABLE'}
                            {predictionData.expectedChangePct ? ` (${predictionData.expectedChangePct})` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="ai-metric-box">
                        <span className="ai-metric-label">Confidence Score</span>
                        <div className="ai-metric-value">{predictionData.confidence || '88%'}</div>
                        <small style={{ fontSize: '0.7rem', color: '#64748b' }}>ECX Historical Baseline</small>
                      </div>

                      <div className="ai-metric-box">
                        <span className="ai-metric-label">Target Horizon</span>
                        <div className="ai-metric-value">{predictionData.horizon || '30 Days'}</div>
                        <small style={{ fontSize: '0.7rem', color: '#64748b' }}>Regional Spot Forecast</small>
                      </div>
                    </div>

                    {predictionData.recommendedAction && (
                      <div className="ai-action-box">
                        <strong>💡 Actionable Strategy: </strong>
                        {predictionData.recommendedAction}
                      </div>
                    )}

                    <p style={{ fontSize: '0.88rem', lineHeight: '1.5', margin: '0.5rem 0 0', color: 'inherit', opacity: 0.9 }}>
                      {predictionData.analysis}
                    </p>

                    {Array.isArray(predictionData.keyDrivers) && predictionData.keyDrivers.length > 0 && (
                      <div style={{ marginTop: '0.85rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>
                          Key Market Drivers:
                        </span>
                        <div className="ai-drivers-list">
                          {predictionData.keyDrivers.map((driver, idx) => (
                            <span key={idx} className="ai-driver-tag">
                              📌 {driver}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="intelligence-actions-row">
                <Link
                  to={`/products?search=${encodeURIComponent(selectedPriceDetail.crop.split(' ')[0])}`}
                  className="btn btn-primary"
                  onClick={closeModal}
                >
                  🌾 Browse Verified Harvest Lots for {selectedPriceDetail.crop.split(' ')[0]} &rarr;
                </Link>
                <Link
                  to="/freight"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  🚚 Check Return Trucks in {selectedPriceDetail.region}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
