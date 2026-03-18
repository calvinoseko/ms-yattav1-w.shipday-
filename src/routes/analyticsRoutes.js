
const express = require('express');
const {
  getOverview,
  getRealTime,
  getSalesAnalytics,
  getProductPerformance,
  getCategoryPerformance,
  getUserAnalytics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

router.get('/overview', getOverview);
router.get('/realtime', getRealTime);
router.get('/sales', getSalesAnalytics);
router.get('/products', getProductPerformance);
router.get('/categories', getCategoryPerformance);
router.get('/users', getUserAnalytics);

module.exports = router;
