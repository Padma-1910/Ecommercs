const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  color: { type: String, default: 'Default' },
  size: { type: String, default: 'Standard' },
});

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderItems: [OrderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'USA' },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Stripe', 'Razorpay', 'Card', 'COD', 'PayPal', 'ApplePay'],
      default: 'Card',
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discountPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    couponCode: {
      type: String,
      default: '',
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Processing',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Returned',
      ],
      default: 'Pending',
      index: true,
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    returnRequest: {
      isRequested: { type: Boolean, default: false },
      reason: { type: String, default: '' },
      status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
      requestedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  Order: mongoose.model('Order', OrderSchema),
  OrderItemSchema,
};
