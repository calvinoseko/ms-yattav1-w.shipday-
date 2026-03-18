
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['view_product', 'add_to_cart', 'purchase', 'login', 'category_assign'],
    index: true // Mandatory Index
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  entityType: {
    type: String,
    enum: ['product', 'order', 'category', 'user'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true // Mandatory Index
  },
  metadata: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // Mandatory Index
  }
});

// Compound index for frequent analytics queries (e.g., "views for product X in last hour")
EventSchema.index({ entityId: 1, eventType: 1, createdAt: -1 });

module.exports = mongoose.model('Event', EventSchema);
