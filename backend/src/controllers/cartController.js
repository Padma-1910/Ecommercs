const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// Helper to calculate cart totals
const formatCartResponse = async (cart) => {
  let subtotal = 0;
  const items = cart.items || [];

  for (const item of items) {
    const itemPrice =
      item.product && item.product.discountPrice > 0
        ? item.product.discountPrice
        : item.price;
    subtotal += itemPrice * item.quantity;
  }

  let discountAmount = 0;
  let couponInfo = null;

  if (cart.coupon) {
    const coupon = await Coupon.findById(cart.coupon);
    if (coupon && coupon.isActive && new Date() <= coupon.expiryDate) {
      const result = coupon.calculateDiscount(subtotal);
      if (result.valid) {
        discountAmount = result.discountAmount;
        couponInfo = {
          id: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        };
      }
    }
  }

  const shippingFee = subtotal > 100 || items.length === 0 ? 0 : 9.99;
  const tax = Math.round((subtotal - discountAmount) * 0.08 * 100) / 100;
  const total = Math.max(0, Math.round((subtotal - discountAmount + shippingFee + tax) * 100) / 100);

  return {
    _id: cart._id,
    user: cart.user,
    items: cart.items,
    itemCount: items.reduce((acc, it) => acc + it.quantity, 0),
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    shippingFee,
    tax,
    total,
    coupon: couponInfo,
  };
};

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price discountPrice discountPercentage images brand countInStock slug')
      .populate('coupon');

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const formatted = await formatCartResponse(cart);
    res.status(200).json({
      success: true,
      cart: formatted,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, color, size, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.countInStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.countInStock} items available in stock`,
      });
    }

    const price = product.discountPrice > 0 ? product.discountPrice : product.price;

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if same item variant already in cart
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.color === (color || 'Default') &&
        item.size === (size || 'Standard')
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        product: productId,
        color: color || 'Default',
        size: size || 'Standard',
        quantity: Number(quantity),
        price,
      });
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name price discountPrice discountPercentage images brand countInStock slug')
      .populate('coupon');

    const formatted = await formatCartResponse(populatedCart);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart: formatted,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex((it) => it._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = Number(quantity);
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name price discountPrice discountPercentage images brand countInStock slug')
      .populate('coupon');

    const formatted = await formatCartResponse(populatedCart);

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: formatted,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
exports.removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name price discountPrice discountPercentage images brand countInStock slug')
      .populate('coupon');

    const formatted = await formatCartResponse(populatedCart);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: formatted,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      cart.coupon = null;
      cart.discountAmount = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart: { items: [], itemCount: 0, subtotal: 0, total: 0, discountAmount: 0, shippingFee: 0, tax: 0 },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Apply coupon to cart
// @route   POST /api/cart/apply-coupon
// @access  Private
exports.applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide coupon code' });
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    const subtotal = cart.items.reduce((sum, item) => {
      const p = item.product.discountPrice > 0 ? item.product.discountPrice : item.price;
      return sum + p * item.quantity;
    }, 0);

    const validation = coupon.calculateDiscount(subtotal);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.reason });
    }

    cart.coupon = coupon._id;
    cart.discountAmount = validation.discountAmount;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name price discountPrice discountPercentage images brand countInStock slug')
      .populate('coupon');

    const formatted = await formatCartResponse(populatedCart);

    res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" applied! You saved $${validation.discountAmount}`,
      cart: formatted,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove coupon from cart
// @route   POST /api/cart/remove-coupon
// @access  Private
exports.removeCoupon = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.coupon = null;
      cart.discountAmount = 0;
      await cart.save();
    }

    const populatedCart = await Cart.findById(cart._id).populate('items.product');
    const formatted = await formatCartResponse(populatedCart);

    res.status(200).json({
      success: true,
      message: 'Coupon removed',
      cart: formatted,
    });
  } catch (err) {
    next(err);
  }
};
