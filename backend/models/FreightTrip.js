const mongoose = require('mongoose');

const freightTripSchema = new mongoose.Schema(
  {
    transporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverPhone: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ['Isuzu NPR (35-50 Quintals)', 'FSR Truck (70-100 Quintals)', 'Sino-Truck (250-400 Quintals)', 'Pickup / Van (10-20 Quintals)'],
      default: 'Isuzu NPR (35-50 Quintals)',
    },
    plateNumber: {
      type: String,
      trim: true,
      default: '',
    },
    originRegion: {
      type: String,
      required: true,
      trim: true,
    },
    originCity: {
      type: String,
      required: true,
      trim: true,
    },
    destinationRegion: {
      type: String,
      required: true,
      trim: true,
    },
    destinationCity: {
      type: String,
      required: true,
      trim: true,
    },
    departureDate: {
      type: Date,
      required: true,
    },
    totalCapacityQuintals: {
      type: Number,
      required: true,
      min: 1,
    },
    availableCapacityQuintals: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    isReturnTripDiscount: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['scheduled', 'full', 'in_transit', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

freightTripSchema.index({ originCity: 1, destinationCity: 1, departureDate: 1, status: 1 });

module.exports = mongoose.model('FreightTrip', freightTripSchema);
