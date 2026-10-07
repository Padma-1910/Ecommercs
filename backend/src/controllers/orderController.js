const { Order } = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      couponCode,
      paymentResult,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items specified' });
    }

    // Verify products and calculate price server-side
    let itemsPrice = 0;
    const verifiedItems = [];

    for (const item of orderItems) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.name || item.product} not found`,
        });
      }

      if (dbProduct.countInStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product "${dbProduct.name}" is out of stock or requested quantity unavailable`,
        });
      }

      const currentPrice =
        dbProduct.discountPrice > 0 ? dbProduct.discountPrice : dbProduct.price;
      itemsPrice += currentPrice * item.quantity;

      verifiedItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        image: dbProduct.images[0] || item.image,
        price: currentPrice,
        quantity: item.quantity,
        color: item.color || 'Default',
        size: item.size || 'Standard',
      });
    }

    // Handle coupon if any
    let discountPrice = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
      if (coupon) {
        const val = coupon.calculateDiscount(itemsPrice);
        if (val.valid) {
          discountPrice = val.discountAmount;
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const shippingPrice = itemsPrice > 100 ? 0 : 9.99;
    const taxPrice = Math.round((itemsPrice - discountPrice) * 0.08 * 100) / 100;
    const totalPrice = Math.max(0, Math.round((itemsPrice - discountPrice + shippingPrice + taxPrice) * 100) / 100);

    const isPaid = paymentMethod === 'COD' ? false : true;
    const paidAt = isPaid ? new Date() : null;

    const order = await Order.create({
      user: req.user.id,
      orderItems: verifiedItems,
      shippingAddress,
      paymentMethod,
      paymentResult: paymentResult || {
        id: `PAY-${Date.now()}`,
        status: isPaid ? 'COMPLETED' : 'PENDING',
        update_time: new Date().toISOString(),
        email_address: req.user.email,
      },
      itemsPrice: Math.round(itemsPrice * 100) / 100,
      shippingPrice,
      taxPrice,
      discountPrice,
      totalPrice,
      couponCode: couponCode || '',
      isPaid,
      paidAt,
      status: isPaid ? 'Confirmed' : 'Pending',
      trackingNumber: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
    });

    // Record Payment
    await Payment.create({
      order: order._id,
      user: req.user.id,
      amount: totalPrice,
      currency: 'USD',
      provider: paymentMethod,
      paymentId: order.paymentResult.id || `TXN-${Date.now()}`,
      status: isPaid ? 'completed' : 'pending',
      receiptUrl: `https://checkout.receipts.local/${order._id}`,
    });

    // Decrease stock for each product
    for (const item of verifiedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: -item.quantity },
      });
    }

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], coupon: null, discountAmount: 0 }
    );

    // Create Notification
    await Notification.create({
      user: req.user.id,
      title: 'Order Placed Successfully! 🎉',
      message: `Your order #${order._id.toString().slice(-6)} has been placed for $${totalPrice.toFixed(2)}.`,
      type: 'order',
      link: `/orders/${order._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name images slug');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only owner or admin can view
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel order (Customer)
// @route   POST /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const cancelableStatuses = ['Pending', 'Confirmed', 'Processing'];
    if (!cancelableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in '${order.status}' status. It has already shipped or completed.`,
      });
    }

    order.status = 'Cancelled';
    order.cancellationReason = reason || 'Customer requested cancellation';
    await order.save();

    // Restock products
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: item.quantity },
      });
    }

    // Notify user
    await Notification.create({
      user: order.user,
      title: 'Order Cancelled',
      message: `Your order #${order._id.toString().slice(-6)} has been cancelled.`,
      type: 'order',
      link: `/orders/${order._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request return (Customer)
// @route   POST /api/orders/:id/return
// @access  Private
exports.requestReturn = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Returns can only be requested for Delivered orders',
      });
    }

    order.returnRequest = {
      isRequested: true,
      reason: reason || 'Not satisfied with item',
      status: 'pending',
      requestedAt: new Date(),
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Return request submitted successfully. Our team will review it shortly.',
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/all
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber, returnStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status) {
      order.status = status;
      if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = new Date();
      }
      if (status === 'Returned') {
        // Restock
        for (const item of order.orderItems) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { countInStock: item.quantity },
          });
        }
      }
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (returnStatus && order.returnRequest) {
      order.returnRequest.status = returnStatus;
      if (returnStatus === 'approved') {
        order.status = 'Returned';
      }
    }

    await order.save();

    // Notify user
    await Notification.create({
      user: order.user,
      title: `Order Status Updated: ${order.status}`,
      message: `Your order #${order._id.toString().slice(-6)} is now ${order.status}.`,
      type: 'order',
      link: `/orders/${order._id}`,
    });

    res.status(200).json({
      success: true,
      message: `Order status updated to ${order.status}`,
      order,
    });
  } catch (err) {
    next(err);
  }
};
