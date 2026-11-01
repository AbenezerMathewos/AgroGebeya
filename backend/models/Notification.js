const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['order_new', 'order_status', 'order_payment', 'new_message', 'new_review', 'pool_filled', 'pool_contribution'],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: '' }, // frontend route to send the user to when clicked
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
