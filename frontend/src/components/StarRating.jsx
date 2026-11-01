// Read-only stars when onChange isn't passed; interactive picker when it is.
export default function StarRating({ value = 0, onChange, size = 18 }) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = typeof onChange === 'function';

  return (
    <span className="star-rating" style={{ fontSize: size }}>
      {stars.map((star) => (
        <span
          key={star}
          className={star <= Math.round(value) ? 'star filled' : 'star'}
          onClick={interactive ? () => onChange(star) : undefined}
          role={interactive ? 'button' : undefined}
          aria-label={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
        >
          ★
        </span>
      ))}
    </span>
  );
}
