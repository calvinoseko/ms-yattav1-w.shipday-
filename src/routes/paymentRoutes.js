
const express = require('express');
const { initiatePayment, mpesaCallback, getPaymentMethods } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/methods', getPaymentMethods);
router.post('/initiate', protect, initiatePayment);
router.post('/callback/mpesa', mpesaCallback);

module.exports = router;
