import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { productService } from '../services/productService';

export default function AddProduct() {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    await productService.create(data);
    navigate('/farmer/dashboard');
  };

  return (
    <div className="product-form-page">
      <h1>Add Product</h1>
      <ProductForm onSubmit={handleSubmit} submitLabel="Add Product" />
    </div>
  );
}
