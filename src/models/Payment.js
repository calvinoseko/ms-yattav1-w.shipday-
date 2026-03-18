
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    enum: ['mpesa', 'card', 'airtel'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'KES'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  // Stores provider specific IDs (e.g., CheckoutRequestID for M-Pesa)
  providerReference: {
    type: String,
    index: true
  },
  // Stores the final transaction receipt (e.g., M-Pesa Receipt Number)
  transactionId: {
    type: String
  },
  // Store raw metadata for debugging/auditing
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate successful payments for the same order
PaymentSchema.index({ order: 1, status: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);
