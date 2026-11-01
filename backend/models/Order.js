const mongoose = require('mongoose');

const PLATFORM_COMMISSION_RATE = 0.05; // 5% platform take-rate

const orderSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    buyer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    farmer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },

    quantity:  { type: Number, required: true, min: 0.01 },
    unit:      { type: String, default: 'Kg', trim: true },
    unitPrice: { type: Number, default: 0 },

    // ── Financial / Monetization Fields ──────────────────────────────────────
    itemsPrice:             { type: Number, required: true, default: 0 },  // subtotal (qty × unitPrice)
    platformCommissionRate: { type: Number, default: PLATFORM_COMMISSION_RATE }, // 0.05 = 5%
    commissionAmount:       { type: Number, default: 0 },  // itemsPrice × rate
    sellerPayoutAmount:     { type: Number, default: 0 },  // itemsPrice − commission
    totalAmount:            { type: Number, required: true, default: 0 }, // = itemsPrice (extend for shipping)

    // Legacy field retained for backward-compat
    totalPrice: { type: Number, default: 0 },

    // ── Fulfillment ───────────────────────────────────────────────────────────
    fulfillment: {
      type: String,
      enum: ['pickup', 'delivery', 'freight_pool'],
      default: 'pickup',
    },
    deliveryAddress: {
      region:          { type: String, default: '' },
      city:            { type: String, default: '' },
      specificAddress: { type: String, default: '' },
    },
    contactPhone: { type: String, required: true, trim: true },

    // ── Payment & Escrow ──────────────────────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ['chapa', 'telebirr', 'cbe_birr', 'cash_on_delivery'],
      default: 'chapa',
    },
    paymentStatus: {
      type: String,
      enum: ['pending_payment', 'escrow_held', 'released_to_farmer', 'refunded'],
      default: 'pending_payment',
    },
    paymentReference: { type: String, default: '', trim: true }, // Chapa tx_ref
    chapaCheckoutUrl: { type: String, default: '' },              // Chapa redirect URL
    isPaid:           { type: Boolean, default: false },
    paidAt:           { type: Date },

    // Explicit escrow lifecycle field (maps to paymentStatus for reporting)
    escrowStatus: {
      type: String,
      enum: ['held_in_escrow', 'released_to_seller', 'refunded'],
      default: 'held_in_escrow',
    },

    // Legacy: kept for backward-compat with existing documents
    escrowTransactionId: { type: String, default: '' },

    // ── Order Lifecycle ───────────────────────────────────────────────────────
    note: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_transit', 'declined', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// ── Compound indexes ──────────────────────────────────────────────────────────
orderSchema.index({ farmer: 1, status: 1, createdAt: -1 });
orderSchema.index({ buyer: 1, createdAt: -1 });
// sparse: true allows multiple docs with empty/null paymentReference while
// still enforcing uniqueness for actual tx_ref values
orderSchema.index({ paymentReference: 1 }, { unique: true, sparse: true });

// ── Pre-save hook: keep financial fields internally consistent ────────────────
orderSchema.pre('save', function (next) {
  if (!this.itemsPrice && (this.totalPrice || this.totalAmount)) {
    this.itemsPrice = this.totalPrice || this.totalAmount || 0;
  }
  if (this.isModified('itemsPrice') || this.isModified('platformCommissionRate') || this.isNew || !this.totalAmount) {
    const price = Number(this.itemsPrice) || Number(this.totalPrice) || 0;
    const rate = Number(this.platformCommissionRate) || PLATFORM_COMMISSION_RATE;
    this.commissionAmount   = Math.round(price * rate * 100) / 100;
    this.sellerPayoutAmount = Math.round((price - this.commissionAmount) * 100) / 100;
    this.totalAmount        = price;
    this.totalPrice         = price;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
