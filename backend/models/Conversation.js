const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessage: { type: String, default: '', trim: true },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// A buyer only ever has one thread with a farmer about a given product
conversationSchema.index({ product: 1, buyer: 1, farmer: 1 }, { unique: true });
conversationSchema.index({ buyer: 1, lastMessageAt: -1 });
conversationSchema.index({ farmer: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
