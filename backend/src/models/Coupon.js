const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
      required: true,
    },
    discountValue: {
      type: Number,
      required: [true, 'Please provide discount value'],
      min: [1, 'Discount value must be at least 1'],
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 1000,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Please set coupon expiry date'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    usageLimit: {
      type: Number,
      default: 100,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Method to calculate discount for an order amount
CouponSchema.methods.calculateDiscount = function (orderAmount) {
  if (orderAmount < this.minOrderValue) {
    return { valid: false, reason: `Minimum order value of $${this.minOrderValue} required` };
  }
  if (!this.isActive || new Date() > this.expiryDate) {
    return { valid: false, reason: 'Coupon has expired or is inactive' };
  }
  if (this.usedCount >= this.usageLimit) {
    return { valid: false, reason: 'Coupon usage limit has been reached' };
  }

  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = Math.min(this.discountValue, orderAmount);
  }

  return {
    valid: true,
    discountAmount: Math.round(discount * 100) / 100,
  };
};

module.exports = mongoose.model('Coupon', CouponSchema);
