import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_USERS = [
  { label: '🧑‍🌾 Farmer', email: 'farmer@agrogebeya.et', pw: 'Farmer123456' },
  { label: '🏢 Buyer', email: 'buyer@agrogebeya.et', pw: 'Buyer123456' },
  { label: '🤝 Cooperative', email: 'cooperative@agrogebeya.et', pw: 'Coop123456' },
  { label: '🚚 Transporter', email: 'transporter@agrogebeya.et', pw: 'Transporter123456' },
  { label: '🛡️ Admin', email: 'admin@agrogebeya.et', pw: 'Admin123456' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDemoSelect = (demo) => {
    setFormData({ email: demo.email, password: demo.pw });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>Login</h1>

      {/* 1-Click Role Quick Fill for Defense / Evaluation */}
      <div style={{
        margin: '0.85rem 0 1.25rem',
        padding: '0.75rem 0.9rem',
        background: 'var(--surface, rgba(255, 255, 255, 0.65))',
        border: '1px solid var(--border, #cbd5e1)',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--forest-800, #065f46)' }}>
          ⚡ Quick Demo Login (Capstone Evaluation):
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
          {DEMO_USERS.map((demo) => {
            const isSelected = formData.email === demo.email;
            return (
              <button
                key={demo.email}
                type="button"
                onClick={() => handleDemoSelect(demo)}
                style={{
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: isSelected ? '1.5px solid #047857' : '1px solid #cbd5e1',
                  background: isSelected ? '#047857' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#1e293b',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 6px rgba(4, 120, 87, 0.25)' : 'none'
                }}
              >
                {demo.label}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p className="form-error">{error}</p>}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}
