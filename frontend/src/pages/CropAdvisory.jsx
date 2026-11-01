import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { advisoryService } from '../services/advisoryService';
import AiCropScannerWidget from '../components/AiCropScannerWidget';

export default function CropAdvisory() {
  const { lang, t } = useLanguage();
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All');

  const CROPS = ['All', 'Enset', 'Coffee', 'Teff', 'Maize', 'Wheat', 'Ginger', 'Avocado'];

  const loadAdvisories = () => {
    setLoading(true);
    advisoryService
      .getAll({ search: search !== '' ? search : undefined, crop: selectedCrop !== 'All' ? selectedCrop : undefined })
      .then((data) => setAdvisories(data.advisories || []))
      .catch(() => setAdvisories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAdvisories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCrop]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadAdvisories();
  };

  const getLocalized = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.am || obj.en || obj.om || obj.wot || obj.ti || Object.values(obj)[0] || '';
  };

  return (
    <div className="advisory-page">
      <section className="page-intro">
        <span className="eyebrow">🔬 National Agronomic & Plant Protection Intelligence</span>
        <h1>{t('diseaseAdvisoryTitle')}</h1>
        <p>{t('diseaseAdvisorySubtitle')}</p>
      </section>

      {/* AI Crop Disease Scanner & Diagnostics Widget with Direct Mongo Publishing */}
      <AiCropScannerWidget onPosted={() => loadAdvisories()} />

      <div className="advisory-filters-bar">
        <div className="crop-tab-buttons">
          {CROPS.map((c) => (
            <button
              key={c}
              className={selectedCrop === c ? 'crop-tab-btn active' : 'crop-tab-btn'}
              onClick={() => setSelectedCrop(c)}
            >
              {c === 'All' ? '🌱 All Crops' : c}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="advisory-search-form">
          <input
            placeholder="Search symptoms, pests, or disease..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="page-loading">Loading diagnostic guides...</div>
      ) : advisories.length === 0 ? (
        <div className="empty-card">No advisory records match your query.</div>
      ) : (
        <div className="advisory-grid">
          {advisories.map((item) => (
            <article className="advisory-card" key={item._id}>
              {item.imageUrl && (
                <div className="advisory-card-img-wrapper">
                  <img src={item.imageUrl} alt={item.pestOrDisease} className="advisory-card-thumb" />
                  <span className="verified-scan-badge">📷 Verified Field Scan</span>
                </div>
              )}

              <div className="advisory-card-header">
                <div>
                  <span className="badge badge-crop">{item.cropName}</span>
                  <h2>{item.pestOrDisease}</h2>
                  {item.localNames && (
                    <p className="local-name-tag">
                      {getLocalized(item.localNames)}
                    </p>
                  )}
                </div>
                <span className={`badge badge-severity-${(item.severity || 'moderate').toLowerCase()}`}>
                  {item.severity || 'High'} Severity
                </span>
              </div>

              <div className="advisory-section">
                <strong>🔍 {t('symptoms')}</strong>
                <p>{getLocalized(item.symptoms)}</p>
              </div>

              <div className="advisory-section">
                <strong>🛡️ {t('prevention')}</strong>
                <p>{getLocalized(item.prevention)}</p>
              </div>

              <div className="advisory-treatment-box organic-box">
                <strong>🌿 {t('organicCure')}</strong>
                <p>{getLocalized(item.organicTreatment)}</p>
              </div>

              <div className="advisory-treatment-box chemical-box">
                <strong>🧪 {t('chemicalAdvice')}</strong>
                <p>{getLocalized(item.chemicalTreatment)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
