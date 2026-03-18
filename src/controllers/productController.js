
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Order = require('../models/Order');
const aiCategorizationService = require('../services/aiCategorizationService');
const eventService = require('../services/eventService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all products with Advanced Filtering
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude from direct matching
  const removeFields = ['select', 'sort', 'page', 'limit', 'categoryPath'];
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Base Query
  let mongoQuery = JSON.parse(queryStr);
  mongoQuery.status = 'active';

  // --- Category Path Filtering ---
  if (req.query.categoryPath) {
    const category = await Category.findOne({ 
      $or: [{ slug: req.query.categoryPath }, { path: req.query.categoryPath }] 
    });

    if (category) {
      const childCategories = await Category.find({
        path: new RegExp(`^${category.path}`)
      }).select('_id');

      const categoryIds = childCategories.map(c => c._id);
      mongoQuery.categories = { $in: categoryIds };
    }
  }

  query = Product.find(mongoQuery).populate('categories', 'name slug path');

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  const products = await query;

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('categories', 'name slug path parentId');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const userId = req.user ? req.user.id : null;
  eventService.log('view_product', 'product', product._id, userId);

  // Fetch reviews separately
  const reviews = await Review.find({ productId: product._id })
    .populate('userId', 'name')
    .sort('-createdAt');

  const productObj = product.toObject();
  productObj.reviews = reviews;

  res.status(200).json({
    success: true,
    data: productObj
  });
});

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private (Admin)
exports.createProduct = asyncHandler(async (req, res, next) => {
  // If images provided as array of strings (legacy/simple), convert to object structure
  if (req.body.images && req.body.images.length > 0 && typeof req.body.images[0] === 'string') {
      req.body.images = req.body.images.map((url, index) => ({
          url,
          isMain: index === 0
      }));
  }

  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Add images to product
// @route   POST /api/v1/products/:id/images
// @access  Private (Admin)
exports.addProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const { images } = req.body; // Expects array of { url }
  
  if (!images || !Array.isArray(images)) {
      res.status(400);
      throw new Error('Please provide an array of images');
  }

  // Add new images
  images.forEach(img => {
      product.images.push({
          url: img.url,
          isMain: false // Default to false, can be set later
      });
  });

  await product.save();

  res.status(200).json({
    success: true,
    data: product.images
  });
});

// @desc    Set Main Image
// @route   PATCH /api/v1/products/:id/images/:imageId/main
// @access  Private (Admin)
exports.setMainImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const imageId = req.params.imageId;

  // Check if image exists
  const imageExists = product.images.id(imageId);
  if (!imageExists) {
      res.status(404);
      throw new Error('Image not found');
  }

  // Reset all to false
  product.images.forEach(img => img.isMain = false);
  
  // Set selected to true
  const img = product.images.id(imageId);
  img.isMain = true;

  // The pre-save hook will update the root 'image' field
  await product.save();

  res.status(200).json({
    success: true,
    data: product.images
  });
});

// @desc    Delete Image
// @route   DELETE /api/v1/products/:id/images/:imageId
// @access  Private (Admin)
exports.deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const imageId = req.params.imageId;
  
  // Find image to remove
  const imageToRemove = product.images.id(imageId);
  if (!imageToRemove) {
      res.status(404);
      throw new Error('Image not found');
  }

  // Remove the image
  product.images.pull(imageId);

  // If we deleted the main image, let the pre-save hook assign a new one (it defaults to the first available)
  
  await product.save();

  res.status(200).json({
    success: true,
    data: product.images
  });
});

// @desc    Create product review
// @route   POST /api/v1/products/:id/reviews
// @access  Private
exports.createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // 1. Verify Eligibility: User must have a 'delivered' or 'completed' order containing this product
  const orders = await Order.find({
    user: req.user.id,
    status: { $in: ['delivered', 'completed'] },
    'items.product': productId
  });

  if (orders.length === 0) {
    res.status(400);
    throw new Error('You can only review products you have purchased and received.');
  }

  // Use the most recent eligible order
  const eligibleOrder = orders[0];

  // 2. Check if already reviewed for this order
  const alreadyReviewed = await Review.findOne({
    userId: req.user.id,
    productId: productId,
    orderId: eligibleOrder._id
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product for this order');
  }

  const review = await Review.create({
    userId: req.user.id,
    productId,
    orderId: eligibleOrder._id,
    rating: Number(rating),
    comment,
    isVerifiedPurchase: true
  });

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    AI Auto Categorize Product
// @route   POST /api/v1/products/:id/ai-categorize
// @access  Private (Admin)
exports.aiCategorizeProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const suggestions = await aiCategorizationService.suggestCategories(product);

  res.status(200).json({
    success: true,
    data: suggestions
  });
});
