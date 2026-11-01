import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { chatService } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import OrderPanel from '../components/OrderPanel';
import ReviewList from '../components/ReviewList';
import EscrowTrustTimeline from '../components/EscrowTrustTimeline';
import ProformaInvoiceModal from '../components/ProformaInvoiceModal';
import { resolveImageUrl } from '../utils/imageUrl';


export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [chatError, setChatError] = useState('');
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const messageSeller = async () => {
    if (!user) return navigate('/login');
    setMessaging(true);
    setChatError('');
    try {
      const { conversation } = await chatService.startConversation(product._id);
      navigate(`/messages/${conversation._id}`);
    } catch (err) {
      setChatError(err.response?.data?.message || 'Could not start a conversation right now.');
    } finally {
      setMessaging(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    productService
      .getById(id)
      .then((data) => setProduct(data.product))
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading">Loading produce details...</div>;
  if (error) return <p className="form-error">{error}</p>;
  if (!product) return null;

  const image = product.images?.[0] ? resolveImageUrl(product.images[0]) : '';
  const currentUserId = user?._id || user?.id;
  const isOwner = currentUserId && product.owner && currentUserId.toString() === (product.owner._id || product.owner).toString();

  return (
    <div className="product-details-page">
      <Link to="/products" className="back-link">
        &larr; Back to marketplace
      </Link>

      <div className="product-details-grid">
        <div className="product-details-media">
          {image ? (
            <img src={image} alt={product.title} onError={(e) => (e.target.style.display = 'none')} />
          ) : (
            <div className="product-details-media placeholder-media">
              <span>🌾</span>
            </div>
          )}
          {product.isCooperativePooled && (
            <div className="coop-badge-banner">
              🏢 Pooled by {product.cooperativeName || 'Primary Farmers Union'}
            </div>
          )}
        </div>

        <div className="product-details-main">
          <div className="product-details-heading">
            <div className="badge-row">
              <span className="eyebrow">{product.category}</span>
              <span className="badge badge-grade">{product.grade}</span>
            </div>
            {!product.isAvailable && <span className="badge badge-muted">Sold out</span>}
          </div>

          <h1>{product.title}</h1>

          <p className="product-details-price">
            {product.price.toLocaleString()} ETB <span>/ {product.unit || 'Kg'}</span>
          </p>

          <dl className="product-detail-list">
            <dt>Available Volume</dt>
            <dd>
              <strong>{product.quantity} {product.unit || 'Kg'}</strong>
              {product.minOrderQuantity > 1 && (
                <span className="min-order-note"> (Min order: {product.minOrderQuantity} {product.unit})</span>
              )}
            </dd>

            <dt>Origin Region</dt>
            <dd>📍 {product.location}, {product.zone} ({product.region})</dd>

            <dt>Producer / Union</dt>
            <dd>
              {product.cooperativeName ? `🏢 ${product.cooperativeName}` : `👨‍🌾 ${product.owner?.name}`}
              {product.owner?.phone && <span className="seller-phone"> (📞 {product.owner.phone})</span>}
            </dd>

            {product.harvestDate && (
              <>
                <dt>Harvest Date</dt>
                <dd>🗓️ {new Date(product.harvestDate).toLocaleDateString()}</dd>
              </>
            )}

            {product.description && (
              <>
                <dt>Description</dt>
                <dd className="product-desc-text">{product.description}</dd>
              </>
            )}
          </dl>

          <div className="product-actions-box">
            {!isOwner && (
              <button className="btn btn-secondary btn-sm" onClick={messageSeller} disabled={messaging}>
                💬 {messaging ? 'Starting chat...' : t('messageSeller')}
              </button>
            )}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setInvoiceOpen(true)}
              title="Generate printable ECX Pro-Forma Invoice & Bill of Lading"
            >
              📄 Export ECX Pro-Forma Invoice
            </button>
          </div>
          {chatError && <p className="form-error">{chatError}</p>}
        </div>

        <div className="product-details-side">
          <OrderPanel product={product} />
        </div>
      </div>

      {/* Interactive Telebirr Escrow Protocol */}
      <EscrowTrustTimeline />

      <ReviewList productId={product._id} />

      {/* Official ECX Pro-Forma Invoice Modal */}
      <ProformaInvoiceModal
        isOpen={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        product={product}
      />
    </div>
  );
}