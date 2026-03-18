
const mongoose = require('mongoose');
const slugify = require('slugify');

const VariantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  color: { type: String, required: true },
  stock: { type: Number, required: true, min: 0, default: 0 }
}, { _id: false });

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  isMain: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    index: true 
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  }],
  primaryCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  // Variants: Size + Color combinations
  variants: [VariantSchema],
  
  // Legacy arrays (optional, kept for search indexing)
  sizes: {
    type: [String],
    index: true
  },
  colors: {
    type: [String],
    index: true
  },
  
  // Total stock (sum of variants)
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    index: true
  },
  
  // New Image Structure
  images: [ImageSchema],
  
  // Main thumbnail (Cached from images array for easy frontend access)
  image: {
    type: String
  },
  
  rating: {
    type: Number,
    required: true,
    default: 0
  },
  numReviews: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'out_of_stock', 'archived'],
    default: 'active',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  soldCount: {
    type: Number,
    default: 0
  }
});

// Create slug from name
ProductSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  
  // Auto-calculate total stock and populate searchable arrays if variants exist
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((acc, v) => acc + v.stock, 0);
    this.sizes = [...new Set(this.variants.map(v => v.size))];
    this.colors = [...new Set(this.variants.map(v => v.color))];
    
    if (this.stock === 0) this.status = 'out_of_stock';
    else if (this.status === 'out_of_stock') this.status = 'active';
  }

  // Handle Main Image Logic
  if (this.images && this.images.length > 0) {
    // Check if a main image is set
    const mainImage = this.images.find(img => img.isMain);
    
    if (mainImage) {
      // Ensure only one main image (if multiple were somehow set, though UI should prevent this)
      this.images.forEach(img => {
        if (img._id !== mainImage._id) img.isMain = false;
      });
      this.image = mainImage.url;
    } else {
      // Default first image to main if none selected
      this.images[0].isMain = true;
      this.image = this.images[0].url;
    }
  } else {
      // Fallback if legacy logic pushes specific image string to 'image' field but not array
      if (!this.image) this.image = 'no-photo.jpg';
  }

  next();
});

module.exports = mongoose.model('Product', ProductSchema);
