import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const REGION_OPTIONS = [
  'South Ethiopia',
  'Oromia',
  'Amhara',
  'Sidama',
  'Central Ethiopia',
  'Tigray',
  'Somali',
  'Afar',
  'Benishangul-Gumuz',
  'Gambela',
  'Harari',
  'Addis Ababa',
  'Dire Dawa',
];

export default function Register() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'buyer',
    region: 'Addis Ababa',
    zone: '',
    cooperativeName: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="page-intro">
        <span className="eyebrow">🌱 AgroGebeya Ethiopia</span>
        <h1>{t('register')}</h1>
        <p>Join the national digital agriculture network & escrow marketplace.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p className="form-error">{error}</p>}

        <label htmlFor="name">Full Name / Contact Person</label>
        <input
          id="name"
          name="name"
          placeholder="e.g. Abebe Balcha"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <div className="form-row">
          <div className="form-col">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="user@agrogebeya.et"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-col">
            <label htmlFor="phone">Phone Number (Telebirr/CBE linked)</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+251911..."
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={6}
          placeholder="At least 6 characters"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <div className="form-row">
          <div className="form-col">
            <label htmlFor="role">I am joining as a...</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange}>
              <option value="buyer">Commercial / Wholesale Buyer (ነጋዴ / ሸማች)</option>
              <option value="farmer">Smallholder Farmer (አምራች አርሶ አደር)</option>
              <option value="cooperative">Cooperative Union (የገበሬዎች ህብረት ስራ ማህበር)</option>
              <option value="transporter">Logistics & Truck Driver (የጭነት አሽከርካሪ)</option>
            </select>
          </div>

          <div className="form-col">
            <label htmlFor="region">Primary Region</label>
            <select id="region" name="region" value={formData.region} onChange={handleChange}>
              {REGION_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-col">
            <label htmlFor="zone">Zone (ዞን)</label>
            <input
              id="zone"
              name="zone"
              placeholder="e.g. Wolaita, Jimma, Shewa"
              value={formData.zone}
              onChange={handleChange}
            />
          </div>
          {formData.role === 'cooperative' && (
            <div className="form-col">
              <label htmlFor="cooperativeName">Union / Cooperative Name</label>
              <input
                id="cooperativeName"
                name="cooperativeName"
                placeholder="e.g. Damot Union"
                value={formData.cooperativeName}
                onChange={handleChange}
              />
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account...' : t('register')}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">{t('login')} here</Link>
      </p>
    </div>
  );
}

