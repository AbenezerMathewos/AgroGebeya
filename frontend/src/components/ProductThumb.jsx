import { resolveImageUrl } from '../utils/imageUrl';

export default function ProductThumb({ product, size = 44 }) {
  const src = product?.images?.[0] ? resolveImageUrl(product.images[0]) : '';

  return (
    <div className="product-thumb" style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={product.title} onError={(e) => (e.target.style.display = 'none')} />
      ) : (
        <span>🌾</span>
      )}
    </div>
  );
}