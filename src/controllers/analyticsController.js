
const analyticsService = require('../services/analyticsService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get Dashboard Overview
// @route   GET /api/v1/admin/analytics/overview
// @access  Private/Admin
exports.getOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDashboardOverview();
  res.status(200).json({ success: true, data });
});

// @desc    Get Real-Time Analytics
// @route   GET /api/v1/admin/analytics/realtime
// @access  Private/Admin
exports.getRealTime = asyncHandler(async (req, res) => {
  const data = await analyticsService.getRealTimeAnalytics();
  res.status(200).json({ success: true, data });
});

// @desc    Get Sales Analytics
// @route   GET /api/v1/admin/analytics/sales
// @access  Private/Admin
exports.getSalesAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy } = req.query;
  const data = await analyticsService.getSalesAnalytics({ startDate, endDate, groupBy });
  res.status(200).json({ success: true, data });
});

// @desc    Get Product Performance
// @route   GET /api/v1/admin/analytics/products
// @access  Private/Admin
exports.getProductPerformance = asyncHandler(async (req, res) => {
  const data = await analyticsService.getProductPerformance();
  res.status(200).json({ success: true, data });
});

// @desc    Get Category Performance
// @route   GET /api/v1/admin/analytics/categories
// @access  Private/Admin
exports.getCategoryPerformance = asyncHandler(async (req, res) => {
  const data = await analyticsService.getCategoryPerformance();
  res.status(200).json({ success: true, data });
});

// @desc    Get User Analytics
// @route   GET /api/v1/admin/analytics/users
// @access  Private/Admin
exports.getUserAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getUserAnalytics();
  res.status(200).json({ success: true, data });
});
