const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getProducts,
  getMyProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// Public browse/search
router.get('/', getProducts);

// IMPORTANT: /my must be registered before /:id, or Express will try to
// treat "my" as a product id and getProductById will 400 on it.
router.get('/my', protect, authorize('farmer'), getMyProducts);

router.get('/:id', getProductById);

router.post('/', protect, authorize('farmer'), createProduct);
router.put('/:id', protect, authorize('farmer'), updateProduct);
router.delete('/:id', protect, authorize('farmer', 'admin'), deleteProduct);

module.exports = router;
