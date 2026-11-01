const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createPoolContract,
  getOpenPools,
  getAllPools,
  contributeToPool,
  getFarmerContributions,
  getPoolById,
  updatePoolStatus,
} = require('../controllers/poolOrderController');

// ──────────────────────────────────────────────────────────────
//  Public routes
// ──────────────────────────────────────────────────────────────

// GET /api/pools — List all open pools (public — visible to farmers browsing)
router.get('/', getOpenPools);

// ──────────────────────────────────────────────────────────────
//  Authenticated sub-paths (MUST be declared before /:id)
// ──────────────────────────────────────────────────────────────

// GET /api/pools/my/contributions & /api/pools/my — Pools the logged-in farmer has contributed to
router.get('/my/contributions', protect, authorize('farmer', 'cooperative'), getFarmerContributions);
router.get('/my', protect, authorize('farmer', 'cooperative'), getFarmerContributions);

// GET /api/pools/admin/all — Admin sees all pools regardless of status
router.get('/admin/all', protect, authorize('admin'), getAllPools);

// ──────────────────────────────────────────────────────────────
//  Parameter routes
// ──────────────────────────────────────────────────────────────

// GET /api/pools/:id — Single pool detail (public)
router.get('/:id', getPoolById);

// POST /api/pools/:id/contribute — Farmer contributes partial yield to a pool
router.post('/:id/contribute', protect, authorize('farmer', 'cooperative'), contributeToPool);

// ──────────────────────────────────────────────────────────────
//  Authenticated — buyers / cooperatives / admin
// ──────────────────────────────────────────────────────────────

// POST /api/pools — Bulk buyer creates a new procurement pool contract
router.post('/', protect, authorize('buyer', 'cooperative', 'admin'), createPoolContract);

// PUT /api/pools/:id/status — Buyer / admin transitions pool lifecycle status
router.put('/:id/status', protect, authorize('buyer', 'admin'), updatePoolStatus);

module.exports = router;
