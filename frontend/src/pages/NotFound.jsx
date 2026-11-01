import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page-placeholder">
      <span className="page-placeholder-icon">🌾</span>
      <span className="eyebrow">404</span>
      <h1>This field hasn't been planted yet</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">
        Go back home
      </Link>
    </div>
  );
}
