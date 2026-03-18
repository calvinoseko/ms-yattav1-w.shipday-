
const express = require('express');
const { getUsers, updateUserStatus } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.patch('/:id/status', updateUserStatus);

module.exports = router;
