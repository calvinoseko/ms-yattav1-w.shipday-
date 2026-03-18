
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const mpesaProvider = require('./providers/mpesaProvider');
// Future: const airtelProvider = require('./providers/airtelProvider');

class PaymentService {
  
  _getProvider(providerName) {
    switch (providerName) {
      case 'mpesa': return mpesaProvider;
      // case 'airtel': return airtelProvider;
      default: throw new Error(`Provider ${providerName} not supported`);
    }
  }

  async initiatePayment(userId, orderId, providerName, paymentDetails) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    
    // Check if order is already paid
    if (order.status === 'paid' || order.status === 'shipped') {
      throw new Error('Order is already paid');
    }

    // Check for existing pending payment to avoid spamming
    const existingPayment = await Payment.findOne({ 
      order: orderId, 
      status: 'pending',
      createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) } // 2 mins debounce
    });
    
    if (existingPayment) {
       // Return existing payment info instead of creating new one
       return existingPayment;
    }

    const provider = this._getProvider(providerName);

    // Call Provider API
    const result = await provider.initiatePayment({
      amount: order.totalAmount,
      phone: paymentDetails.phone, // Assuming phone passed for M-Pesa
      orderId: order._id
    });

    // Create Payment Record
    const payment = await Payment.create({
      user: userId,
      order: orderId,
      provider: providerName,
      amount: order.totalAmount,
      status: 'pending',
      providerReference: result.providerReference,
      metadata: result.metadata
    });

    // Update Order Status
    order.status = 'awaiting_payment';
    await order.save();

    return payment;
  }

  async handleCallback(providerName, payload) {
    const provider = this._getProvider(providerName);
    
    if (!provider.verifyCallback(payload)) {
      throw new Error('Invalid callback signature');
    }

    const result = provider.parseCallback(payload);

    // Find Payment
    const payment = await Payment.findOne({ providerReference: result.providerReference });
    if (!payment) {
      // Log orphan callback
      console.warn(`Payment not found for Ref: ${result.providerReference}`);
      return;
    }

    if (payment.status !== 'pending') {
      // Idempotency: Payment already processed
      return;
    }

    // Update Payment
    payment.status = result.success ? 'completed' : 'failed';
    payment.metadata = { ...payment.metadata, callback: result.raw };
    if (result.transactionId) {
      payment.transactionId = result.transactionId;
    }
    await payment.save();

    // Update Order
    if (result.success) {
      const order = await Order.findById(payment.order);
      if (order) {
        order.status = 'paid';
        order.paymentResult = {
          id: result.transactionId,
          status: 'completed',
          update_time: new Date().toISOString(),
          provider: providerName
        };
        await order.save();
        
        // Trigger Events (Analytics)
        const eventService = require('./eventService');
        eventService.log('purchase', 'order', order._id, payment.user, { amount: payment.amount });
      }
    }
  }
}

module.exports = new PaymentService();
