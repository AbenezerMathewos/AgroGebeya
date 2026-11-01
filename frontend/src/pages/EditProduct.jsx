import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { productService } from '../services/productService';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService
      .getById(id)
      .then((data) => setProduct(data.product))
      .catch(() => setError('Could not load this product.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data) => {
    await productService.update(id, data);
    navigate('/farmer/dashboard');
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!product) return null;

  return (
    <div className="product-form-page">
      <Link to="/farmer/dashboard">&larr; Back to my products</Link>
      <h1>Edit Product</h1>
      <ProductForm initialValues={product} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </div>
  );
}
