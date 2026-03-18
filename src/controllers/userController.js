
const userService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all users (Admin)
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  res.status(200).json({ success: true, ...result });
});

// @desc    Update user status (activate/deactivate)
// @route   PATCH /api/v1/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (isActive === undefined) {
    res.status(400);
    throw new Error('Please provide isActive boolean');
  }

  const user = await userService.updateUserStatus(req.params.id, isActive);
  res.status(200).json({ success: true, data: user });
});
