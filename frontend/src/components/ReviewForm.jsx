import { useState } from 'react';
import { reviewService } from '../services/reviewService';
import StarRating from './StarRating';

export default function ReviewForm({ order, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        Leave a review
      </button>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await reviewService.create({ orderId: order._id, rating, comment });
      onSubmitted?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit review.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit}>
      <StarRating value={rating} onChange={setRating} size={22} />
      <textarea
        rows={2}
        placeholder="How was this harvest? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="review-form-actions">
        <button className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? 'Submitting...' : 'Submit review'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
