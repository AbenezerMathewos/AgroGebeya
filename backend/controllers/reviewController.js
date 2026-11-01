const Review = require('../models/Review');
const Order = require('../models/Order');
const notifyUser = require('../utils/notify');

// A buyer may review a product once they have an order for it marked 'completed'.
exports.createReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating) {
      return res.status(400).json({ message: 'Order and rating are required' });
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review your own orders' });
    }
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed orders' });
    }

    const existing = await Review.findOne({ order: order._id });
    if (existing) return res.status(400).json({ message: 'You already reviewed this order' });

    const review = await Review.create({
      product: order.product,
      order: order._id,
      buyer: req.user._id,
      farmer: order.farmer,
      rating,
      comment: comment || '',
    });

    await notifyUser(order.farmer, {
      type: 'new_review',
      message: `${req.user.name} left a ${rating}\u2605 review on your product`,
      link: `/products/${order.product}`,
    });

    res.status(201).json({ review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You already reviewed this order' });
    }
    res.status(500).json({ message: 'Could not submit review', error: error.message });
  }
};

// Public: reviews for a single product, plus the average rating and count.
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('buyer', 'name')
      .sort({ createdAt: -1 });

    const count = reviews.length;
    const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    res.json({ reviews, average: Math.round(average * 10) / 10, count });
  } catch (error) {
    res.status(500).json({ message: 'Could not load reviews', error: error.message });
  }
};

// Public: a farmer's overall rating across all of their products.
exports.getFarmerSummary = async (req, res) => {
  try {
    const reviews = await Review.find({ farmer: req.params.farmerId });
    const count = reviews.length;
    const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    res.json({ average: Math.round(average * 10) / 10, count });
  } catch (error) {
    res.status(500).json({ message: 'Could not load farmer rating', error: error.message });
  }
};
