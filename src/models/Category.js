
const mongoose = require('mongoose');
const slugify = require('slugify');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    trim: true
  },
  slug: {
    type: String,
    index: true
  },
  // Materialized Path Pattern
  path: {
    type: String,
    index: true, // Critical for regex querying sub-trees
    default: '' 
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  level: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  metadata: {
    gender: String,
    season: String,
    style: String,
    description: String
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

// Create slug from name
CategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  this.updatedAt = Date.now();
  next();
});

// Compound index for active children lookup
CategorySchema.index({ parentId: 1, isActive: 1 });
// Index for path filtering
CategorySchema.index({ path: 1 });

module.exports = mongoose.model('Category', CategorySchema);
