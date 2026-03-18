
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true 
  },
  items: [
    {
      productName: String,
      quantity: Number,
      price: Number,
      size: String,
      color: String,
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    }
  ],
  customerInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: false },
    email: { type: String, required: true },
    address: {
      street: { type: String },
      city: { type: String },
      zipCode: { type: String },
      country: { type: String },
      latitude: Number,
      longitude: Number
    }
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    provider: String
  },
  deliveryInfo: {
    provider: { type: String, default: 'shipday' },
    trackingId: String,
    status: String,
    eta: Date
  },
  status: {
    type: String,
    // Added 'awaiting_payment'
    enum: ['pending', 'awaiting_payment', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Order', OrderSchema);
