import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrencyUnit } from '../context/CurrencyUnitContext';
import { Link } from 'react-router-dom';

const ROUTES_DATA = {
  sodo: { name: 'Wolaita Sodo', distKm: 330, tollEtb: 150 },
  jimma: { name: 'Jimma', distKm: 350, tollEtb: 180 },
  bahirdar: { name: 'Bahir Dar (Gojjam)', distKm: 490, tollEtb: 220 },
  hawassa: { name: 'Hawassa / Sidama', distKm: 275, tollEtb: 210 },
  mekelle: { name: 'Mekelle (Raya)', distKm: 780, tollEtb: 300 },
  diredawa: { name: 'Dire Dawa / Harar', distKm: 450, tollEtb: 250 },
};

const TRUCK_TYPES = [
  { id: 'isuzu', name: 'Isuzu NPR (50 Quintals / 5 Ton)', capacityQtl: 50, ratePerKm: 38 },
  { id: 'fsr', name: 'FSR Medium Truck (100 Quintals / 10 Ton)', capacityQtl: 100, ratePerKm: 62 },
  { id: 'sino', name: 'Sino Heavy Trailer (300 Quintals / 30 Ton)', capacityQtl: 300, ratePerKm: 135 },
];

const COMMODITIES = [
  { id: 'teff', name: '🌾 Magna White Teff', farmgatePrice: 9200, terminalPrice: 11800 },
  { id: 'coffee', name: '☕ Washed Arabica Coffee', farmgatePrice: 13500, terminalPrice: 17200 },
  { id: 'ginger', name: '🫚 Wolaita Red Ginger', farmgatePrice: 4200, terminalPrice: 6800 },
  { id: 'avocado', name: '🥑 Hass Avocado', farmgatePrice: 3500, terminalPrice: 5900 },
  { id: 'maize', name: '🌽 Yellow Maize', farmgatePrice: 2800, terminalPrice: 4100 },
];

export default function FreightProfitCalculator() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrencyUnit();

  const [origin, setOrigin] = useState('sodo');
  const [truckId, setTruckId] = useState('isuzu');
  const [commodityId, setCommodityId] = useState('teff');
  const [quintals, setQuintals] = useState(50);

  const selectedRoute = ROUTES_DATA[origin];
  const selectedTruck = TRUCK_TYPES.find((t) => t.id === truckId) || TRUCK_TYPES[0];
  const selectedCrop = COMMODITIES.find((c) => c.id === commodityId) || COMMODITIES[0];

  // Calculations
  const totalFreightCost = Math.round(selectedRoute.distKm * selectedTruck.ratePerKm + selectedRoute.tollEtb);
  const freightPerQuintal = (totalFreightCost / (quintals || 1)).toFixed(0);

  const totalFarmgateCost = quintals * selectedCrop.farmgatePrice;
  const totalTerminalRevenue = quintals * selectedCrop.terminalPrice;
  const grossArbitrage = totalTerminalRevenue - totalFarmgateCost;
  const netProfit = grossArbitrage - totalFreightCost;
  const returnOnInvestment = totalFarmgateCost > 0 ? ((netProfit / (totalFarmgateCost + totalFreightCost)) * 100).toFixed(1) : 0;

  return (
    <section className="calculator-section">
      <div className="section-header-flex">
        <div>
          <span className="eyebrow">🧮 Fast Financial Decision Engine</span>
          <h2>Interactive Freight Cost & Arbitrage Profit Calculator</h2>
          <p className="calculator-sub">
            Calculate exact truck transport fees, diesel tariffs, toll rates, and smallholder-to-terminal net profit margins in real-time.
          </p>
        </div>
        <span className="badge badge-discount">⚡ Live Tariff Estimates</span>
      </div>

      <div className="calculator-card">
        <div className="calculator-inputs-panel">
          <div className="calc-form-group">
            <label>1. Origin Farmgate Hub</label>
            <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
              {Object.entries(ROUTES_DATA).map(([key, data]) => (
                <option key={key} value={key}>
                  📍 {data.name} ({data.distKm} km to Addis)
                </option>
              ))}
            </select>
          </div>

          <div className="calc-form-group">
            <label>2. Truck Size & Return Capacity</label>
            <select
              value={truckId}
              onChange={(e) => {
                setTruckId(e.target.value);
                const truck = TRUCK_TYPES.find((t) => t.id === e.target.value);
                if (truck) setQuintals(truck.capacityQtl);
              }}
            >
              {TRUCK_TYPES.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  🚚 {truck.name}
                </option>
              ))}
            </select>
          </div>

          <div className="calc-form-group">
            <label>3. Crop Commodity</label>
            <select value={commodityId} onChange={(e) => setCommodityId(e.target.value)}>
              {COMMODITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="calc-form-group">
            <label>4. Total Load Volume (Quintals)</label>
            <div className="calc-slider-row">
              <input
                type="range"
                min="10"
                max={selectedTruck.capacityQtl}
                step="5"
                value={quintals}
                onChange={(e) => setQuintals(Number(e.target.value))}
              />
              <span className="calc-slider-val"><strong>{quintals}</strong> Qtl</span>
            </div>
          </div>
        </div>

        {/* Results Live Breakdown */}
        <div className="calculator-results-panel">
          <div className="results-badge-header">
            <span>Route: <strong>{selectedRoute.name} ➔ Addis Ababa</strong> ({selectedRoute.distKm} km)</span>
            <span className="badge badge-gain">+{returnOnInvestment}% ROI</span>
          </div>

          <div className="results-metrics-grid">
            <div className="calc-result-box">
              <span className="calc-box-label">🚚 Total Freight Cost</span>
              <strong>{formatPrice(totalFreightCost)}</strong>
              <small>~{formatPrice(freightPerQuintal)} / Quintal</small>
            </div>

            <div className="calc-result-box">
              <span className="calc-box-label">🌾 Farmgate Sourcing Cost</span>
              <strong>{formatPrice(totalFarmgateCost)}</strong>
              <small>{selectedCrop.farmgatePrice.toLocaleString()} ETB/Qtl</small>
            </div>

            <div className="calc-result-box">
              <span className="calc-box-label">🏢 Terminal Market Value</span>
              <strong>{formatPrice(totalTerminalRevenue)}</strong>
              <small>{selectedCrop.terminalPrice.toLocaleString()} ETB/Qtl</small>
            </div>

            <div className="calc-result-box highlight-box">
              <span className="calc-box-label">💰 Estimated Net Profit</span>
              <strong className="text-gain-lg">{formatPrice(netProfit)}</strong>
              <small>After freight, fuel & toll</small>
            </div>
          </div>

          <div className="calc-actions-row">
            <Link to="/freight" className="btn btn-primary btn-block">
              🚚 Find Empty Return Trucks in {selectedRoute.name.split(' ')[0]} &rarr;
            </Link>
            <Link to="/products" className="btn btn-secondary btn-block">
              🌾 Source {selectedCrop.name.split(' ')[1]} Lots Directly
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
