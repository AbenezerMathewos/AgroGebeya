const PoolOrder   = require('../models/PoolOrder');
const notifyUser  = require('../utils/notify');

const POOL_COMMISSION_RATE = 0.05;

// ────────────────────────────────────────────────────────────────────────────
// @route   POST /api/pools
// @desc    Bulk buyer creates an open cooperative procurement contract
// @access  Private (buyer, admin, cooperative)
// ────────────────────────────────────────────────────────────────────────────
exports.createPoolContract = async (req, res) => {
  try {
    const {
      cropName,
      variety,
      description,
      targetQuantity,
      unit,
      unitPrice,
      deadline,
      deliveryRegion,
      notes,
    } = req.body;

    if (!cropName || !targetQuantity) {
      return res.status(400).json({ message: 'cropName and targetQuantity are required' });
    }
    if (Number(targetQuantity) <= 0) {
      return res.status(400).json({ message: 'targetQuantity must be a positive number' });
    }

    const qty    = Number(targetQuantity);
    const price  = Number(unitPrice)  || 0;
    const totalContractValue = Math.round(qty * price * 100) / 100;
    const totalCommission    = Math.round(totalContractValue * POOL_COMMISSION_RATE * 100) / 100;

    const pool = await PoolOrder.create({
      cropName,
      variety:        variety        || '',
      description:    description    || '',
      buyer:          req.user._id,
      targetQuantity: qty,
      currentQuantity: 0,
      unit:            unit           || 'Quintal',
      unitPrice:       price,
      deadline:        deadline       ? new Date(deadline) : undefined,
      deliveryRegion:  deliveryRegion || 'Addis Ababa',
      status:          'open',
      totalContractValue,
      totalCommission,
      platformCommissionRate: POOL_COMMISSION_RATE,
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: `Pool contract created for ${qty} ${unit || 'Quintals'} of ${cropName}. Waiting for farmer contributions.`,
      pool,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not create pool contract', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @route   GET /api/pools
// @desc    Get all open pools with remaining capacity
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
exports.getOpenPools = async (req, res) => {
  try {
    const { crop, region } = req.query;
    const filter = { status: 'open' };

    if (crop)   filter.cropName      = { $regex: crop,   $options: 'i' };
    if (region) filter.deliveryRegion = { $regex: region, $options: 'i' };

    const pools = await PoolOrder.find(filter)
      .populate('buyer', 'name email cooperativeName region')
      .populate('contributors.farmer', 'name phone region zone')
      .sort({ createdAt: -1 });

    // Attach virtual remainingCapacity plainly for clients that don't use virtuals
    const enriched = pools.map((p) => ({
      ...p.toObject(),
      remainingCapacity: Math.max(0, p.targetQuantity - p.currentQuantity),
      contributorCount:  p.contributors.length,
    }));

    res.json({ pools: enriched });
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch open pools', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @route   GET /api/pools/all
// @desc    Get all pools (admin overview — any status)
// @access  Private (admin)
// ────────────────────────────────────────────────────────────────────────────
exports.getAllPools = async (req, res) => {
  try {
    const pools = await PoolOrder.find()
      .populate('buyer', 'name email region')
      .populate('contributors.farmer', 'name phone region zone')
      .sort({ createdAt: -1 });

    res.json({ pools });
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch pools', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @route   POST /api/pools/:id/contribute
// @desc    Farmer joins an open pool with a partial yield contribution
// @access  Private (farmer, cooperative)
// ────────────────────────────────────────────────────────────────────────────
exports.contributeToPool = async (req, res) => {
  try {
    const pool = await PoolOrder.findById(req.params.id)
      .populate('buyer', 'name email');

    if (!pool) return res.status(404).json({ message: 'Pool contract not found' });

    if (pool.status !== 'open') {
      return res.status(400).json({ message: `Cannot contribute to a pool with status "${pool.status}"` });
    }

    const { quantity, qualityGrade } = req.body;
    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      return res.status(400).json({ message: 'A valid positive quantity is required' });
    }

    const remaining = pool.targetQuantity - pool.currentQuantity;
    if (qty > remaining) {
      return res.status(400).json({
        message: `Contribution exceeds remaining pool capacity. Only ${remaining} ${pool.unit} more needed.`,
        remainingCapacity: remaining,
      });
    }

    // Prevent a farmer from contributing twice (update if already contributed)
    const existingIdx = pool.contributors.findIndex(
      (c) => c.farmer.toString() === req.user._id.toString()
    );

    const payoutDue = Math.round(qty * pool.unitPrice * (1 - POOL_COMMISSION_RATE) * 100) / 100;

    if (existingIdx !== -1) {
      // Update existing contribution
      const existing = pool.contributors[existingIdx];
      pool.currentQuantity -= existing.quantity; // undo old qty first
      existing.quantity    = qty;
      existing.qualityGrade = qualityGrade || existing.qualityGrade;
      existing.payoutDue   = payoutDue;
      existing.joinedAt    = new Date();
    } else {
      pool.contributors.push({
        farmer:       req.user._id,
        quantity:     qty,
        qualityGrade: qualityGrade || 'Grade B',
        payoutDue,
        joinedAt:     new Date(),
      });
    }

    pool.currentQuantity += qty;

    // Transition to pool_filled when target is met
    if (pool.currentQuantity >= pool.targetQuantity) {
      pool.status = 'pool_filled';
    }

    await pool.save();

    // Notify buyer when pool is fully filled
    if (pool.status === 'pool_filled') {
      await notifyUser(pool.buyer._id, {
        type:    'pool_filled',
        message: `🎉 Pool for ${pool.cropName} (${pool.targetQuantity} ${pool.unit}) is now FULLY FILLED with ${pool.contributors.length} contributor(s)!`,
        link:    '/pools',
      });
    }

    const populatedPool = await PoolOrder.findById(pool._id)
      .populate('buyer', 'name email cooperativeName')
      .populate('contributors.farmer', 'name phone region zone');

    res.json({
      success: true,
      message: `Contributed ${qty} ${pool.unit} of ${pool.cropName}. Your payout (after 5% commission): ${payoutDue.toLocaleString()} ETB.`,
      remainingCapacity: Math.max(0, pool.targetQuantity - pool.currentQuantity),
      poolStatus: pool.status,
      pool: populatedPool,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not contribute to pool', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @route   GET /api/pools/my
// @desc    Farmer views all pools they have contributed to and payout status
// @access  Private (farmer, cooperative)
// ────────────────────────────────────────────────────────────────────────────
exports.getFarmerContributions = async (req, res) => {
  try {
    const pools = await PoolOrder.find({
      'contributors.farmer': req.user._id,
    })
      .populate('buyer', 'name email cooperativeName region')
      .populate('contributors.farmer', 'name phone region zone')
      .sort({ createdAt: -1 });

    // Shape response to surface only this farmer's slice
    const myContributions = pools.map((pool) => {
      const mySlice = pool.contributors.find(
        (c) => c.farmer._id.toString() === req.user._id.toString()
      );
      return {
        _id:            pool._id,
        cropName:       pool.cropName,
        variety:        pool.variety,
        buyer:          pool.buyer,
        targetQuantity: pool.targetQuantity,
        currentQuantity: pool.currentQuantity,
        unit:            pool.unit,
        unitPrice:       pool.unitPrice,
        deadline:        pool.deadline,
        poolStatus:      pool.status,
        myQuantity:      mySlice?.quantity     || 0,
        myQualityGrade:  mySlice?.qualityGrade || '',
        myPayoutDue:     mySlice?.payoutDue    || 0,
        myIsPaid:        mySlice?.isPaid       || false,
        myPaidAt:        mySlice?.paidAt       || null,
        myJoinedAt:      mySlice?.joinedAt     || null,
      };
    });

    res.json({ contributions: myContributions });
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch farmer contributions', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @route   GET /api/pools/:id
// @desc    Get a single pool contract with full contributor list
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
exports.getPoolById = async (req, res) => {
  try {
    const pool = await PoolOrder.findById(req.params.id)
      .populate('buyer', 'name email cooperativeName region')
      .populate('contributors.farmer', 'name phone region zone');

    if (!pool) return res.status(404).json({ message: 'Pool contract not found' });

    res.json({ pool });
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch pool contract', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/pools/:id/status
// @desc    Update pool lifecycle status (admin or buyer)
// @access  Private (admin, buyer)
// ────────────────────────────────────────────────────────────────────────────
exports.updatePoolStatus = async (req, res) => {
  try {
    const pool = await PoolOrder.findById(req.params.id);
    if (!pool) return res.status(404).json({ message: 'Pool contract not found' });

    const isBuyer = pool.buyer.toString() === req.user._id.toString();
    if (!isBuyer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the buyer or admin can update pool status' });
    }

    const { status } = req.body;
    const valid = ['open', 'pool_filled', 'in_transit', 'delivered', 'cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Invalid pool status', validOptions: valid });
    }

    pool.status = status;
    await pool.save();

    res.json({ success: true, message: `Pool status updated to "${status}"`, pool });
  } catch (error) {
    res.status(500).json({ message: 'Could not update pool status', error: error.message });
  }
};
