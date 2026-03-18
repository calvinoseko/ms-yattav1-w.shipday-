
const paymentService = require('../services/paymentService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Initiate Payment
// @route   POST /api/v1/payments/initiate
// @access  Private
exports.initiatePayment = asyncHandler(async (req, res) => {
  const { orderId, provider, phone } = req.body;

  if (!orderId || !provider) {
    res.status(400);
    throw new Error('Order ID and Provider are required');
  }

  // Use provided phone or fallback to user profile phone
  const phoneToUse = phone || req.user.phone;

  if (!phoneToUse) {
    res.status(400);
    throw new Error('Phone number is required for payment');
  }

  const payment = await paymentService.initiatePayment(
    req.user.id, 
    orderId, 
    provider, 
    { phone: phoneToUse }
  );

  res.status(200).json({ success: true, data: payment });
});

// @desc    M-Pesa Callback
// @route   POST /api/v1/payments/callback/mpesa
// @access  Public (Webhook)
exports.mpesaCallback = async (req, res) => {
  // Always respond 200 to Safaricom immediately to prevent retries
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  // Process asynchronously
  try {
    await paymentService.handleCallback('mpesa', req.body);
  } catch (error) {
    console.error('M-Pesa Callback Error:', error.message);
  }
};

// @desc    Get Supported Methods
// @route   GET /api/v1/payments/methods
// @access  Public
exports.getPaymentMethods = (req, res) => {
  res.status(200).json({
    success: true,
    data: [
      { id: 'mpesa', label: 'M-Pesa', active: true, icon: 'mpesa_logo_url' },
      { id: 'card', label: 'Credit/Debit Card', active: false }, // Disabled for phase 1
      { id: 'airtel', label: 'Airtel Money', active: false }
    ]
  });
};
