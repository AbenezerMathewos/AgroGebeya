const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getMarketPrices,
  getArbitrageRadar,
  createMarketPrice,
  deleteMarketPrice,
  predictMarketPrice,
} = require('../controllers/marketPriceController');

router.get('/', getMarketPrices);
router.get('/arbitrage', getArbitrageRadar);
router.get('/predict/:crop', predictMarketPrice);
router.post('/', protect, authorize('admin'), createMarketPrice);
router.delete('/:id', protect, authorize('admin'), deleteMarketPrice);

module.exports = router;

