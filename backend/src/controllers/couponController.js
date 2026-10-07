const Coupon = require('../models/Coupon');

// @desc    Validate coupon code
// @route   POST /api/coupons/validate
// @access  Public / Private
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, amount = 0 } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon does not exist' });
    }

    const result = coupon.calculateDiscount(Number(amount));
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: result.discountAmount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      expiryDate,
      usageLimit,
      isActive,
    } = req.body;

    const exists = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : 1000,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? Number(usageLimit) : 100,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update coupon (Admin)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
exports.updateCoupon = async (req, res, next) => {
  try {
    if (req.body.code) {
      req.body.code = req.body.code.trim().toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      coupon,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await coupon.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
