import { useEffect, useState } from 'react';
import { reviewService } from '../services/reviewService';
import StarRating from './StarRating';

export default function ReviewList({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reviewService
      .getForProduct(productId)
      .then((data) => {
        setReviews(data.reviews);
        setAverage(data.average);
        setCount(data.count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return null;

  return (
    <div className="review-list">
      <div className="review-list-heading">
        <h2>Reviews</h2>
        {count > 0 && (
          <span className="review-summary">
            <StarRating value={average} /> {average} <span>({count} review{count === 1 ? '' : 's'})</span>
          </span>
        )}
      </div>

      {count === 0 ? (
        <p className="empty-card">No reviews yet. Reviews appear once a buyer completes an order for this product.</p>
      ) : (
        <div className="review-items">
          {reviews.map((review) => (
            <div className="review-item" key={review._id}>
              <div className="review-item-heading">
                <strong>{review.buyer?.name || 'Buyer'}</strong>
                <StarRating value={review.rating} size={14} />
              </div>
              <p className="review-item-date">{new Date(review.createdAt).toLocaleDateString()}</p>
              {review.comment && <p className="review-item-comment">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
