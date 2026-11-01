const User = require('../models/User');
const Product = require('../models/Product');

// @route   GET /api/admin/users
// @desc    View all users
// @access  Private (admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users', error: error.message });
  }
};

// @route   GET /api/admin/products
// @desc    View all products
// @access  Private (admin)
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 });
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching products', error: error.message });
  }
};

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (and their products, so listings don't orphan)
// @access  Private (admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be deleted here' });
    }

    await Product.deleteMany({ owner: user._id });
    await user.deleteOne();

    res.status(200).json({ message: 'User and their products deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    res.status(500).json({ message: 'Server error deleting user', error: error.message });
  }
};

// @route   DELETE /api/admin/products/:id
// @desc    Delete any product (e.g. spam/inappropriate listings)
// @access  Private (admin)
exports.deleteProductAsAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    res.status(500).json({ message: 'Server error deleting product', error: error.message });
  }
};

// @route   GET /api/admin/stats
// @desc    Dashboard statistics: total users, farmers, buyers, products, cooperatives, transporters, pools
// @access  Private (admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const PoolOrder = require('../models/PoolOrder');
    const [totalUsers, totalFarmers, totalBuyers, totalCooperatives, totalTransporters, totalProducts, totalPools] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'cooperative' }),
      User.countDocuments({ role: 'transporter' }),
      Product.countDocuments(),
      PoolOrder.countDocuments().catch(() => 0),
    ]);

    res.status(200).json({
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalCooperatives,
      totalTransporters,
      totalProducts,
      totalPools,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching dashboard stats', error: error.message });
  }
};
