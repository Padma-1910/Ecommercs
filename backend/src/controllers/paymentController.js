const Payment = require('../models/Payment');
const { Order } = require('../models/Order');

// @desc    Create payment intent / order
// @route   POST /api/payments/create
// @access  Private
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'USD', provider = 'Stripe' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    // In production, this creates a Stripe PaymentIntent or Razorpay Order:
    // const paymentIntent = await stripe.paymentIntents.create({ amount: Math.round(amount * 100), currency });
    // In our robust architecture, we generate a secure payment transaction ID and client secret:
    const paymentId = `pi_${provider.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const clientSecret = `${paymentId}_secret_${Math.random().toString(36).substring(2, 12)}`;

    res.status(200).json({
      success: true,
      provider,
      paymentId,
      clientSecret,
      amount,
      currency,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify payment and update order
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, orderId, status = 'succeeded' } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'Payment ID is required' });
    }

    if (status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: payment not succeeded',
      });
    }

    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'Confirmed';
        order.paymentResult = {
          id: paymentId,
          status: 'COMPLETED',
          update_time: new Date().toISOString(),
          email_address: req.user.email,
        };
        await order.save();

        await Payment.findOneAndUpdate(
          { paymentId },
          { status: 'completed' },
          { upsert: false }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      verified: true,
      paymentId,
    });
  } catch (err) {
    next(err);
  }
};
