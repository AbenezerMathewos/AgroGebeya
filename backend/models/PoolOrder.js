const mongoose = require('mongoose');

const POOL_COMMISSION_RATE = 0.05; // 5% platform take-rate on cooperative pool payouts

/**
 * PoolOrder — Cooperative Virtual Yield Pooling Engine
 *
 * Enables smallholder farmers to collectively fulfill bulk B2B procurement
 * contracts (e.g., Soddo University cafeteria ordering 500 Quintals of Enset/Maize)
 * that no single smallholder could supply alone.
 */
const poolOrderSchema = new mongoose.Schema(
  {
    // ── Contract Details ──────────────────────────────────────────────────────
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    variety: { type: String, trim: true, default: '' }, // e.g. "Magna Teff", "Washed Arabica"
    description: { type: String, trim: true, default: '' },

    // ── Parties ───────────────────────────────────────────────────────────────
    buyer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Buyer is required'],
    },

    // ── Volume & Pricing ──────────────────────────────────────────────────────
    targetQuantity: {
      type:     Number,
      required: [true, 'Target quantity is required'],
      min:      [1, 'Minimum target quantity is 1 unit'],
    },
    currentQuantity: { type: Number, default: 0, min: 0 },
    unit:            { type: String, default: 'Quintal', trim: true },
    unitPrice:       { type: Number, default: 0, min: 0 }, // ETB per unit agreed with buyer

    // ── Logistics ─────────────────────────────────────────────────────────────
    deadline:      { type: Date },
    deliveryRegion: { type: String, trim: true, default: 'Addis Ababa' },

    // ── Status Lifecycle ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['open', 'pool_filled', 'in_transit', 'delivered', 'cancelled'],
      default: 'open',
    },

    // ── Contributors Array ────────────────────────────────────────────────────
    contributors: [
      {
        farmer: {
          type:     mongoose.Schema.Types.ObjectId,
          ref:      'User',
          required: true,
        },
        quantity: {
          type:     Number,
          required: [true, 'Contribution quantity is required'],
          min:      [0.01, 'Quantity must be positive'],
        },
        qualityGrade: {
          type: String,
          enum: ['Grade A', 'Grade B', 'Grade C'],
          default: 'Grade B',
        },
        payoutDue: {
          // Calculated: quantity × unitPrice × (1 - commissionRate)
          type: Number,
          default: 0,
        },
        isPaid:   { type: Boolean, default: false },
        paidAt:   { type: Date },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    // ── Financial Summary ─────────────────────────────────────────────────────
    totalContractValue:   { type: Number, default: 0 }, // targetQuantity × unitPrice
    totalCommission:      { type: Number, default: 0 }, // totalContractValue × 5%
    platformCommissionRate: { type: Number, default: POOL_COMMISSION_RATE },

    // ── Audit ─────────────────────────────────────────────────────────────────
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
poolOrderSchema.index({ status: 1, deadline: 1 });
poolOrderSchema.index({ buyer: 1, createdAt: -1 });
poolOrderSchema.index({ 'contributors.farmer': 1 });

// ── Virtual: remaining capacity ───────────────────────────────────────────────
poolOrderSchema.virtual('remainingCapacity').get(function () {
  return Math.max(0, this.targetQuantity - this.currentQuantity);
});

poolOrderSchema.set('toJSON',   { virtuals: true });
poolOrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PoolOrder', poolOrderSchema);
