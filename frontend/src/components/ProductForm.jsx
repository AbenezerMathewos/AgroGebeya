import { useState } from 'react';
import { uploadService } from '../services/uploadService';
import { resolveImageUrl } from '../utils/imageUrl';

const UNIT_OPTIONS = ['Quintal', 'Kg', 'Crate', 'Piece', 'Liter', 'Sack'];
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
const GRADE_OPTIONS = [
  'Grade 1 (Export/Premium)',
  'Grade 2 (Standard Market)',
  'Grade 3 (Commercial)',
  'Organic Certified',
  'Standard',
];

const emptyForm = {
  title: '',
  category: '',
  price: '',
  quantity: '',
  unit: 'Quintal',
  minOrderQuantity: 1,
  grade: 'Grade 2 (Standard Market)',
  region: 'Oromia',
  zone: '',
  woreda: '',
  location: '',
  description: '',
  imageUrl: '',
  isCooperativePooled: false,
  cooperativeName: '',
  isAvailable: true,
};

export default function ProductForm({ initialValues, onSubmit, submitLabel }) {
  const [formData, setFormData] = useState({
    ...emptyForm,
    ...initialValues,
    imageUrl: initialValues?.images?.[0] || '',
    isAvailable: initialValues?.isAvailable ?? true,
    minOrderQuantity: initialValues?.minOrderQuantity || 1,
    grade: initialValues?.grade || 'Grade 2 (Standard Market)',
    region: initialValues?.region || 'Oromia',
    zone: initialValues?.zone || '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [localPreview, setLocalPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const { url } = await uploadService.uploadImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Could not upload that image. Try a smaller file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        minOrderQuantity: Number(formData.minOrderQuantity || 1),
        images: formData.imageUrl ? [formData.imageUrl.trim()] : [],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const previewSrc = localPreview || (formData.imageUrl ? resolveImageUrl(formData.imageUrl) : '');

  return (
    <form onSubmit={handleSubmit} className="auth-form product-form">
      {error && <p className="form-error">{error}</p>}

      <label htmlFor="title">Produce Title (የምርት ስም)</label>
      <input
        id="title"
        name="title"
        placeholder="e.g. Premium White Teff, Washed Coffee, Red Ginger"
        value={formData.title}
        onChange={handleChange}
        required
      />

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="category">Crop Category</label>
          <input
            id="category"
            name="category"
            placeholder="e.g. Grain, Coffee, Spice, Fruit"
            value={formData.category}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-col">
          <label htmlFor="grade">Quality Grade (የጥራት ደረጃ)</label>
          <select id="grade" name="grade" value={formData.grade} onChange={handleChange}>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="price">Price (ETB)</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-col">
          <label htmlFor="quantity">Quantity Available</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-col">
          <label htmlFor="unit">Unit</label>
          <select id="unit" name="unit" value={formData.unit} onChange={handleChange}>
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="region">Region (ክልል)</label>
          <select id="region" name="region" value={formData.region} onChange={handleChange}>
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="form-col">
          <label htmlFor="zone">Zone (ዞን)</label>
          <input
            id="zone"
            name="zone"
            placeholder="e.g. Wolaita, Jimma, East Gojjam"
            value={formData.zone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-col">
          <label htmlFor="location">Specific Location / Warehouse</label>
          <input
            id="location"
            name="location"
            placeholder="e.g. Sodo Central Depot, Mana Station"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <label htmlFor="photo">Produce Photo</label>
      <div className="photo-upload">
        {previewSrc && (
          <div className="photo-upload-preview">
            <img src={previewSrc} alt="Preview" onError={(e) => (e.target.style.display = 'none')} />
          </div>
        )}
        <div className="photo-upload-controls">
          <label htmlFor="photo" className="btn btn-secondary btn-sm photo-upload-btn">
            {uploading ? 'Uploading...' : previewSrc ? 'Change photo' : 'Upload a photo'}
          </label>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            hidden
          />
          {uploadError && <p className="form-error">{uploadError}</p>}
        </div>
      </div>

      <label htmlFor="imageUrl">...or paste an image URL instead</label>
      <input
        id="imageUrl"
        name="imageUrl"
        type="url"
        placeholder="https://..."
        value={formData.imageUrl}
        onChange={(e) => {
          setLocalPreview('');
          handleChange(e);
        }}
      />

      <label htmlFor="description">Description & Harvest Notes</label>
      <textarea
        id="description"
        name="description"
        rows={3}
        placeholder="Tell buyers about moisture content, harvest date, grading, packaging (e.g. PICS bags)..."
        value={formData.description}
        onChange={handleChange}
      />

      <div className="form-row">
        <label className="checkbox-row" htmlFor="isCooperativePooled">
          <input
            id="isCooperativePooled"
            name="isCooperativePooled"
            type="checkbox"
            checked={formData.isCooperativePooled}
            onChange={handleChange}
          />
          This is a Cooperative Pooled Lot (የህብረት ስራ ማህበር የጋራ ምርት)
        </label>

        <label className="checkbox-row" htmlFor="isAvailable">
          <input
            id="isAvailable"
            name="isAvailable"
            type="checkbox"
            checked={formData.isAvailable}
            onChange={handleChange}
          />
          Currently available for sale
        </label>
      </div>

      {formData.isCooperativePooled && (
        <div className="field-group">
          <label htmlFor="cooperativeName">Primary Cooperative / Union Name</label>
          <input
            id="cooperativeName"
            name="cooperativeName"
            placeholder="e.g. Wolaita Smallholders Union, Lume Adama Union"
            value={formData.cooperativeName}
            onChange={handleChange}
          />
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={submitting || uploading}>
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}