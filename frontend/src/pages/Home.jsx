import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { marketPriceService } from '../services/marketPriceService';
import { useLanguage } from '../context/LanguageContext';
import { resolveImageUrl } from '../utils/imageUrl';
import EthiopiaAgriMap from '../components/EthiopiaAgriMap';
import VoiceSearchButton from '../components/VoiceSearchButton';
import FreightProfitCalculator from '../components/FreightProfitCalculator';




const CROP_CHIPS = [
  { label: '🌾 White Teff', query: 'Teff' },
  { label: '☕ Arabica Coffee', query: 'Coffee' },
  { label: '🥑 Hass Avocado', query: 'Avocado' },
  { label: '🌽 Maize', query: 'Maize' },
  { label: '🫚 Red Ginger', query: 'Ginger' },
  { label: '🌾 Enset / Kocho', query: 'Enset' },
];

const REGIONAL_HUBS = [
  {
    id: 'south',
    name: 'South Ethiopia & Wolaita',
    specialties: ['Red Ginger', 'Enset (Kocho)', 'Avocado', 'Boloso-1 Taro'],
    hub: 'Sodo Terminal Hub',
    status: 'Active Harvest Season',
    icon: '🌱',
  },
  {
    id: 'oromia',
    name: 'Oromia & Jimma',
    specialties: ['Grade 1 Washed Coffee', 'Yellow Maize', 'Wheat'],
    hub: 'Jimma / Adama Hub',
    status: 'Export Aggregation',
    icon: '☕',
  },
  {
    id: 'amhara',
    name: 'Amhara & Gojjam',
    specialties: ['Magna White Teff', 'Red Kidney Beans', 'Sesame'],
    hub: 'Bahir Dar / Gondar Hub',
    status: 'Wholesale Pooling',
    icon: '🌾',
  },
  {
    id: 'sidama',
    name: 'Sidama & Yirgacheffe',
    specialties: ['Yirgacheffe Specialty Coffee', 'Organic Honey', 'Fruits'],
    hub: 'Hawassa Terminal Hub',
    status: 'ECX Certified Lot',
    icon: '🍯',
  },
];

const PILLARS_DATA = [

  {
    icon: '🤝',
    title: 'Direct & Fair Trade',
    desc: 'Bypassing predatory local broker cartels so smallholder producers earn true market value.',
  },
  {
    icon: '🌾',
    title: 'Cooperative Bulk Pooling',
    desc: 'Aggregating smallholder yields into standardized 50–200 Quintal lots for commercial buyers.',
  },
  {
    icon: '🔒',
    title: 'Telebirr Escrow Protection',
    desc: 'Funds remain secured in mobile escrow until the buyer inspects quality at destination.',
  },
  {
    icon: '🚚',
    title: 'Freight Matchmaker',
    desc: 'Matching return-trip empty Isuzu trucks to reduce rural agricultural freight costs by up to 40%.',
  },
  {
    icon: '📊',
    title: 'National Price Radar',
    desc: 'Live price spread analytics between regional farmgates and central terminal markets.',
  },
  {
    icon: '🌿',
    title: 'AI Crop Diagnostics',
    desc: 'Instant disease & pest advisory to protect yields and combat bacterial wilt.',
  },
];

export default function Home() {

  const { t } = useLanguage();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [arbitrage, setArbitrage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');
  const [activeRegion, setActiveRegion] = useState(REGIONAL_HUBS[0]);

  // Interactive Arbitrage Simulator state
  const [simCrop, setSimCrop] = useState('Teff (White Magna)');
  const [simQuintals, setSimQuintals] = useState(50);

  useEffect(() => {
    Promise.all([
      productService.getAll({ limit: 12 }),
      marketPriceService.getArbitrage(),
    ])
      .then(([prodData, arbData]) => {
        setFeatured(prodData.products || []);
        setArbitrage(arbData.arbitrage || []);
        if (arbData.arbitrage?.[0]?.crop) {
          setSimCrop(arbData.arbitrage[0].crop);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);


  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const selectedArb = arbitrage.find((a) => a.crop === simCrop) || arbitrage[0];
  const simGain = selectedArb ? Math.round(selectedArb.spread * simQuintals) : 0;
  const simFarmgateTotal = selectedArb ? Math.round(selectedArb.lowestMarket.price * simQuintals) : 0;
  const simTerminalTotal = selectedArb ? Math.round(selectedArb.highestMarket.price * simQuintals) : 0;

  const STEPS = [
    {
      icon: '🌱',
      stepNum: '01',
      title: t('step1Title'),
      text: t('step1Text'),
    },
    {
      icon: '📈',
      stepNum: '02',
      title: t('step2Title'),
      text: t('step2Text'),
    },
    {
      icon: '🔒',
      stepNum: '03',
      title: t('step3Title'),
      text: t('step3Text'),
    },
  ];

  return (
    <div className="home-page">
      {/* Floating Animated Particle Canopy in Hero */}
      <section className="hero-premium">
        {/* Floating, Raining & Fading Agricultural Canopy */}
        <div className="hero-particles">
          <span className="particle particle-1" title="Fresh Sprout">🌱</span>
          <span className="particle particle-2" title="Golden Teff">🌾</span>
          <span className="particle particle-3" title="Arabica Coffee">☕</span>
          <span className="particle particle-4" title="Hass Avocado">🥑</span>
          <span className="particle particle-5" title="Sweet Maize">🌽</span>
          <span className="particle particle-6" title="Organic Honey">🍯</span>
          <span className="particle particle-7" title="Agronomic Leaf">🌿</span>
          <span className="particle particle-8" title="Ginger / Root">🍠</span>
          <span className="particle particle-9" title="Red Bean">🫘</span>
          <span className="particle particle-10" title="Enset Leaf">🍃</span>
          <span className="particle particle-11" title="Market Light">✨</span>
          <span className="particle particle-12" title="Sun Ray">💫</span>
        </div>


        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-pill-badge">
              <span className="pill-dot"></span>
              <span>🇪🇹 Ethiopia's Digital Agriculture Infrastructure</span>
            </div>
            <h1>{t('heroTitle')}</h1>
            <p className="hero-lead">{t('heroSubtitle')}</p>

            {/* Live Search Bar with Voice Assist */}
            <form
              className="hero-search-box"
              onSubmit={(e) => {
                e.preventDefault();
                if (heroSearch.trim()) {
                  navigate(`/products?search=${encodeURIComponent(heroSearch)}`);
                }
              }}
            >
              <input
                type="text"
                placeholder="Search Magna Teff, Jimma Coffee, Wolaita Ginger..."
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
              />
              <VoiceSearchButton
                onResult={(query) => {
                  setHeroSearch(query);
                  navigate(`/products?search=${encodeURIComponent(query)}`);
                }}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Search
              </button>
            </form>

            {/* Popular Crop Quick Chips */}
            <div className="hero-chips-row">
              <span className="chips-label">Popular:</span>
              <div className="chips-container">
                {CROP_CHIPS.map((chip) => (
                  <button
                    key={chip.query}
                    className="crop-chip"
                    onClick={() => navigate(`/products?search=${encodeURIComponent(chip.query)}`)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                {t('browseProducts')} &rarr;
              </Link>
              <Link to="/market-prices" className="btn btn-glass btn-lg">
                📊 {t('marketPrices')}
              </Link>
              <Link to="/freight" className="btn btn-ghost btn-lg">
                🚚 {t('logistics')}
              </Link>
            </div>
          </div>

          {/* Right Hero: Live Spread Simulator Card */}
          {selectedArb && (
            <div className="hero-simulator-card">
              <div className="simulator-header">
                <span className="badge badge-discount">⚡ Arbitrage Profit Calculator</span>
                <span className="sim-live-tag">
                  <span className="pulse-dot-small"></span> Live Rates
                </span>
              </div>

              <div className="sim-field">
                <label>Select Commodity</label>
                <select
                  value={simCrop}
                  onChange={(e) => setSimCrop(e.target.value)}
                  className="sim-select"
                >
                  {arbitrage.map((a) => (
                    <option key={a.crop} value={a.crop}>
                      {a.crop} (+{a.spreadPercentage}% spread)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sim-field">
                <div className="sim-label-row">
                  <label>Volume</label>
                  <strong>{simQuintals} Quintals</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={simQuintals}
                  onChange={(e) => setSimQuintals(Number(e.target.value))}
                  className="sim-slider"
                />
              </div>

              <div className="sim-breakdown-box">
                <div className="sim-row">
                  <span>Farmgate Value ({selectedArb.lowestMarket.market}):</span>
                  <strong>{simFarmgateTotal.toLocaleString()} ETB</strong>
                </div>
                <div className="sim-row">
                  <span>Terminal Market Value ({selectedArb.highestMarket.market}):</span>
                  <strong>{simTerminalTotal.toLocaleString()} ETB</strong>
                </div>
                <div className="sim-row sim-gain-row">
                  <span>Potential Gross Spread:</span>
                  <strong className="text-gain">+{simGain.toLocaleString()} ETB</strong>
                </div>
              </div>

              <Link to="/market-prices" className="btn btn-primary btn-block btn-sm">
                View Full Arbitrage Radar &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Live Metrics Trust Bar */}
        <div className="hero-metrics-bar">
          <div className="metric-item">
            <strong className="metric-glow">50,000+</strong>
            <span>Quintals Facilitated</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <strong className="metric-glow">8+</strong>
            <span>National Market Hubs</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <strong className="metric-glow">100%</strong>
            <span>Telebirr Escrow Protected</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <strong className="metric-glow">5</strong>
            <span>Languages Supported</span>
          </div>
        </div>
      </section>

      {/* Live Arbitrage & Price Spread Ticker */}
      {arbitrage.length > 0 && (
        <section className="arbitrage-ticker-section">
          <div className="ticker-header">
            <div className="ticker-badge-live">
              <span className="pulse-dot"></span>
              <span>LIVE ARBITRAGE RADAR</span>
            </div>
            <span className="ticker-sub">Real-time farmgate to terminal market price spreads across Ethiopia:</span>
          </div>
          <div className="arbitrage-ticker-cards">
            {arbitrage.map((item, index) => (
              <div className={`ticker-card flame-card flame-theme-${index % 6}`} key={item.crop}>
                <div className="card-flame-glow-layer"></div>
                <div className="card-spark-flare"></div>
                <div className="ticker-card-top">
                  <strong className="ticker-crop-name">{item.crop}</strong>
                  <span className="ticker-gain-badge">
                    <span className="spark-fire-icon">🔥</span> +{item.spreadPercentage}%
                  </span>
                </div>
                <div className="ticker-spread-row">
                  <div className="spread-node">
                    <span className="node-market">📍 {item.lowestMarket.market}</span>
                    <span className="node-price">{item.lowestMarket.price} ETB</span>
                  </div>
                  <span className="spread-arrow">➔</span>
                  <div className="spread-node">
                    <span className="node-market">🏢 {item.highestMarket.market}</span>
                    <span className="node-price font-bold">{item.highestMarket.price} ETB</span>
                  </div>
                </div>
                <div className="ticker-footer-gain">
                  <span>Gross Spread: <strong>+{item.spread} ETB</strong>/{item.lowestMarket.unit}</span>
                  <span className="sparkle-hint">✨</span>
                </div>
              </div>
            ))}
          </div>

        </section>
      )}

      {/* Interactive Regional Harvest GIS Map & Sourcing Corridors */}
      <EthiopiaAgriMap />

      {/* Interactive Freight & Arbitrage Profit Calculator */}
      <FreightProfitCalculator />

      {/* Featured Harvests — Infinite Smooth Marquee Carousel */}

      <section className="featured-section">

        <div className="section-header-flex">
          <div>
            <div className="carousel-eyebrow-row">
              <span className="eyebrow">Direct from Smallholders & Unions</span>
              <span className="badge badge-discount">● Live Streaming Feed</span>
            </div>
            <h2>{t('featuredHarvests')}</h2>
          </div>
          <div className="carousel-controls-header">
            <span className="carousel-pause-hint">⚡ Live Non-Stop Stream</span>
            <Link to="/products" className="btn btn-secondary btn-sm">
              {t('viewAllProducts')} &rarr;
            </Link>
          </div>

        </div>

        {loading ? (
          <div className="page-loading">Loading marketplace listings...</div>
        ) : featured.length === 0 ? (
          <div className="empty-card">No products listed yet.</div>
        ) : (
          <div className="marquee-carousel-wrapper">
            <div className="marquee-track marquee-track-left">
              {/* Render two duplicated sets for seamless 100% gapless infinite loop (Right to Left) */}
              {[...featured, ...featured].map((product, idx) => (
                <Link
                  to={`/products/${product._id}`}
                  key={`${product._id}-${idx}`}
                  className="product-card carousel-product-card"
                >
                  <div className="product-card-media">
                    {product.images?.[0] ? (
                      <img
                        src={resolveImageUrl(product.images[0])}
                        alt={product.title}
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    ) : (
                      <span className="product-card-media-fallback">🌾</span>
                    )}
                    {product.isCooperativePooled && (
                      <span className="badge badge-coop card-badge">Cooperative Lot</span>
                    )}
                  </div>
                  <div className="product-card-body">
                    <div className="product-card-tags">
                      <span className="eyebrow">{product.category}</span>
                      <span className="badge badge-grade">{product.grade || 'Grade 1'}</span>
                    </div>
                    <h3>{product.title}</h3>
                    <p className="product-card-price">
                      {product.price.toLocaleString()} ETB
                      <span> / {product.unit || 'Kg'}</span>
                    </p>
                    <p className="product-card-location">📍 {product.location} ({product.region})</p>
                    <p className="product-seller">
                      {product.cooperativeName ? `🏢 ${product.cooperativeName}` : `👨‍🌾 ${product.owner?.name}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>


      {/* 4 Pillars Highlight — Infinite Marquee Stream (Left to Right) */}
      <section className="pillars-section">
        <div className="page-intro text-center">
          <span className="eyebrow">Enterprise Agricultural Infrastructure</span>
          <h2>Solving Structural Market Inefficiencies</h2>
        </div>
        <div className="marquee-carousel-wrapper">
          <div className="marquee-track-right">
            {/* Render two duplicated sets for seamless 100% gapless infinite loop (Left to Right) */}
            {[...PILLARS_DATA, ...PILLARS_DATA].map((pillar, idx) => (
              <div className="pillar-carousel-card" key={`${pillar.title}-${idx}`}>
                <div className="pillar-icon-box">{pillar.icon}</div>
                <h3>{pillar.title}</h3>
                <p>{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* How it Works Section */}
      <section className="how-it-works">
        <div className="page-intro text-center">
          <span className="eyebrow">Simple & Frictionless</span>
          <h2>{t('threeStepsTitle')}</h2>
        </div>
        <div className="steps-grid">
          {STEPS.map((step) => (
            <div className="step-card" key={step.title}>
              <span className="step-watermark">{step.stepNum}</span>
              <span className="step-icon">{step.icon}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Freight Call to Action Banner */}
      <section className="cta-banner freight-cta">
        <h2>{t('freightBannerTitle')}</h2>
        <p>{t('freightBannerSubtitle')}</p>
        <div className="hero-actions">
          <Link to="/freight" className="btn btn-primary btn-lg">
            Explore Freight Routes &rarr;
          </Link>
          <Link to="/advisory" className="btn btn-secondary btn-lg">
            View Crop Health Guide
          </Link>
        </div>
      </section>
    </div>
  );
}