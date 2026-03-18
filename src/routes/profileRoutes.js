
const express = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
  saveLocation
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/change-password', changePassword);
router.post('/locations', saveLocation);

module.exports = router;
