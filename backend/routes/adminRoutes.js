const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  getAllProducts,
  deleteUser,
  deleteProductAsAdmin,
  getDashboardStats,
} = require('../controllers/adminController');

// Every route here requires a valid token AND an admin role
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/products', getAllProducts);
router.delete('/users/:id', deleteUser);
router.delete('/products/:id', deleteProductAsAdmin);

module.exports = router;
