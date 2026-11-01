import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { useLanguage } from '../context/LanguageContext';
import { resolveImageUrl } from '../utils/imageUrl';

const REGIONS = [
  'All Regions (Nationwide)',
  'South Ethiopia (Wolaita/Gamo)',
  'Oromia (Jimma/East Shewa)',
  'Amhara (Gojjam/Gondar)',
  'Sidama (Hawassa)',
  'Central Ethiopia',
  'Tigray',
  'Somali',
  'Addis Ababa',
];

const GRADES = [
  'All Grades',
  'Grade 1 (Export/Premium)',
  'Grade 2 (Standard Market)',
  'Grade 3 (Commercial)',
  'Organic Certified',
];

const initialFilters = {
  search: '',
  category: '',
  region: '',
  grade: '',
  minPrice: '',
  maxPrice: '',
};

export default function Products() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback((page = 1) => {
    setLoading(true);
    setError('');

    const params = Object.fromEntries(
      Object.entries(appliedFilters).filter(([, value]) => value !== '')
    );
    params.page = page;

    productService
      .getAll(params)
      .then((data) => {
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      })
      .catch(() => setError('Could not load products. Please try again.'))
      .finally(() => setLoading(false));
  }, [appliedFilters]);

  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = value.startsWith('All') ? '' : value;
    setFilters({ ...filters, [name]: cleanValue });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedFilters(filters);
  };

  const handleClear = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  return (
    <div className="products-page">
      <div className="page-intro">
        <span className="eyebrow">🇪🇹 National Agricultural Marketplace</span>
        <h1>{t('browseProducts')}</h1>
        <p>Direct harvests from smallholders and cooperative unions across Ethiopia.</p>
      </div>

      <form onSubmit={handleSearchSubmit} className="filters-form national-filters">
        <input
          name="search"
          placeholder={t('searchPlaceholder')}
          value={filters.search}
          onChange={handleFilterChange}
        />

        <select name="region" value={filters.region ? filters.region : 'All'} onChange={handleFilterChange}>
          {REGIONS.map((r) => (
            <option key={r} value={r.split(' ')[0] === 'All' ? '' : r.split(' ')[0]}>
              {r}
            </option>
          ))}
        </select>

        <select name="grade" value={filters.grade} onChange={handleFilterChange}>
          {GRADES.map((g) => (
            <option key={g} value={g.startsWith('All') ? '' : g}>
              {g}
            </option>
          ))}
        </select>

        <input
          name="category"
          placeholder="Crop Category (e.g. Grain, Coffee)"
          value={filters.category}
          onChange={handleFilterChange}
        />

        <input
          name="minPrice"
          type="number"
          placeholder="Min price (ETB)"
          value={filters.minPrice}
          onChange={handleFilterChange}
        />

        <input
          name="maxPrice"
          type="number"
          placeholder="Max price (ETB)"
          value={filters.maxPrice}
          onChange={handleFilterChange}
        />

        <button type="submit" className="btn btn-primary">Search</button>
        <button type="button" className="btn btn-secondary" onClick={handleClear}>
          Clear
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="page-loading">Loading marketplace listings...</div>
      ) : products.length === 0 ? (
        <div className="empty-card">No harvests match your search criteria. Try widening your filters.</div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <Link to={`/products/${product._id}`} key={product._id} className="product-card">
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
                  {!product.isAvailable && <span className="badge badge-muted card-badge">Sold out</span>}
                </div>
                <div className="product-card-body">
                  <div className="product-card-tags">
                    <span className="eyebrow">{product.category}</span>
                    <span className="badge badge-grade">{product.grade}</span>
                  </div>
                  <h3>{product.title}</h3>
                  <p className="product-card-price">
                    {product.price.toLocaleString()} ETB
                    <span> / {product.unit || 'Kg'} &middot; {product.quantity} avail</span>
                  </p>
                  <p className="product-card-location">📍 {product.location} ({product.region})</p>
                  <p className="product-seller">
                    {product.cooperativeName ? `🏢 ${product.cooperativeName}` : `👨‍🌾 ${product.owner?.name}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadProducts(pagination.page - 1)}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages} ({pagination.total} total items)
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadProducts(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}