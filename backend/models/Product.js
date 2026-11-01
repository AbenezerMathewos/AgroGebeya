const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      trim: true,
      default: 'Kg',
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 0.1,
    },
    grade: {
      type: String,
      enum: ['Grade 1 (Export/Premium)', 'Grade 2 (Standard Market)', 'Grade 3 (Commercial)', 'Organic Certified', 'Standard'],
      default: 'Grade 2 (Standard Market)',
    },
    region: {
      type: String,
      required: true,
      default: 'Oromia',
      trim: true,
    },
    zone: {
      type: String,
      required: true,
      default: 'Central',
      trim: true,
    },
    woreda: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    harvestDate: {
      type: Date,
      default: Date.now,
    },
    availableUntil: Date,
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isCooperativePooled: {
      type: Boolean,
      default: false,
    },
    cooperativeName: {
      type: String,
      trim: true,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Supports "search products" across title, category, location, region, and zone
productSchema.index({ title: 'text', category: 'text', description: 'text', location: 'text' });
productSchema.index({ region: 1, category: 1, isAvailable: 1 });

module.exports = mongoose.model('Product', productSchema);

