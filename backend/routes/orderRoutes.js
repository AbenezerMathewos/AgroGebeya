const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createOrder,
  getMyOrders,
  updateOrderStatus,
  payOrder,
  initializeChapaPayment,
  verifyChapaPayment,
  releaseEscrow,
} = require('../controllers/orderController');

// ── Public webhook callback (no JWT required) ─────────────────────────────
router.get('/pay/chapa/verify/:tx_ref', verifyChapaPayment);

// ── Authenticated routes ───────────────────────────────────────────────────
router.use(protect);

// ── Core order CRUD ──────────────────────────────────────────────────────────
router.post('/',     authorize('buyer', 'cooperative', 'farmer', 'admin'), createOrder);
router.get('/my',   authorize('buyer', 'farmer', 'cooperative', 'admin'), getMyOrders);
router.patch('/:id/status', authorize('buyer', 'farmer', 'cooperative', 'admin'), updateOrderStatus);
router.post('/:id/pay',     authorize('buyer', 'cooperative', 'farmer', 'admin'), payOrder); // Escrow payment simulation

// ── Chapa Real-Money Escrow Routes ───────────────────────────────────────────
// Initialize → buyer receives checkout_url, redirects to Chapa hosted page
router.post('/pay/chapa/initialize', authorize('buyer', 'cooperative', 'farmer', 'admin'), initializeChapaPayment);

// Release → buyer/admin confirms goods delivered; disburses funds to seller
router.put('/:id/release-escrow', authorize('buyer', 'cooperative', 'farmer', 'admin'), releaseEscrow);

module.exports = router;
