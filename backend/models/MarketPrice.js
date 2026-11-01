const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    crop: { type: String, required: true, trim: true },
    market: { type: String, required: true, trim: true },
    region: { type: String, default: 'South Ethiopia', trim: true },
    marketType: {
      type: String,
      enum: ['Central Terminal (Wholesale)', 'Regional Hub', 'Primary Farmgate'],
      default: 'Regional Hub',
    },
    lowPrice: { type: Number, required: true, min: 0 },
    highPrice: { type: Number, required: true, min: 0 },
    averagePrice: { type: Number, default: 0 },
    unit: { type: String, default: 'Quintal', trim: true },
    trend: {
      type: String,
      enum: ['rising', 'falling', 'stable'],
      default: 'stable',
    },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

marketPriceSchema.index({ crop: 1, market: 1, region: 1, recordedAt: -1 });
module.exports = mongoose.model('MarketPrice', marketPriceSchema);

