const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getFreightTrips,
  createFreightTrip,
  bookFreightSpace,
  getMyTrips,
  updateTripStatus,
  deleteTrip,
} = require('../controllers/freightController');

router.get('/', getFreightTrips);
router.get('/my', protect, getMyTrips);
router.post('/', protect, createFreightTrip);
router.patch('/:id/book', protect, bookFreightSpace);
router.patch('/:id/status', protect, updateTripStatus);
router.delete('/:id', protect, deleteTrip);

module.exports = router;
