
const express = require('express');
const { 
  getProducts, 
  getProduct, 
  createProduct, 
  createProductReview,
  aiCategorizeProduct,
  addProductImages,
  setMainImage,
  deleteProductImage
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(getProducts)
  .post(protect, authorize('admin'), createProduct);

router
  .route('/:id')
  .get(getProduct);

// Image Management Routes
router.route('/:id/images').post(protect, authorize('admin'), addProductImages);
router.route('/:id/images/:imageId/main').patch(protect, authorize('admin'), setMainImage);
router.route('/:id/images/:imageId').delete(protect, authorize('admin'), deleteProductImage);

router.route('/:id/reviews').post(protect, createProductReview);

router
  .route('/:id/ai-categorize')
  .post(protect, authorize('admin'), aiCategorizeProduct);

module.exports = router;
