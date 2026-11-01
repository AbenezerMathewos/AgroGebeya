const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createReview, getProductReviews, getFarmerSummary } = require('../controllers/reviewController');

router.get('/product/:productId', getProductReviews);
router.get('/farmer/:farmerId/summary', getFarmerSummary);
router.post('/', protect, authorize('buyer'), createReview);

module.exports = router;
