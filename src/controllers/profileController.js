
const profileService = require('../services/profileService');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get current user profile
// @route   GET /api/v1/profile/me
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await profileService.getProfile(req.user.id);
  res.status(200).json({ success: true, data: user });
});

// @desc    Update current user profile
// @route   PUT /api/v1/profile/me
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await profileService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data: user });
});

// @desc    Change password
// @route   PUT /api/v1/profile/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide both current and new passwords');
  }

  try {
    const token = await profileService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    res.status(200).json({ success: true, token, message: 'Password updated successfully' });
  } catch (err) {
    res.status(401);
    throw new Error(err.message);
  }
});

// @desc    Save Live Location
// @route   POST /api/v1/profile/locations
// @access  Private
exports.saveLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, label, city, country, street } = req.body;

  if (!latitude || !longitude) {
    res.status(400);
    throw new Error('Latitude and Longitude are required');
  }

  const newAddress = {
    label: label || 'Live Location',
    latitude,
    longitude,
    city,
    country,
    street,
    isDefault: false
  };

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $push: { savedAddresses: newAddress } },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: user.savedAddresses });
});
