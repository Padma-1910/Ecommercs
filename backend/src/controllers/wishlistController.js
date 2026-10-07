const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
      path: 'products',
      select: 'name slug price discountPrice discountPercentage images brand countInStock rating numReviews',
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }

    res.status(200).json({
      success: true,
      count: wishlist.products.length,
      wishlist: wishlist.products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add product to wishlist (or toggle)
// @route   POST /api/wishlist
// @access  Private
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [] });
    }

    const alreadyInWishlist = wishlist.products.some(
      (p) => p.toString() === productId
    );

    if (alreadyInWishlist) {
      // Toggle off
      wishlist.products = wishlist.products.filter(
        (p) => p.toString() !== productId
      );
      await wishlist.save();
      return res.status(200).json({
        success: true,
        action: 'removed',
        message: 'Removed from wishlist',
        count: wishlist.products.length,
      });
    }

    wishlist.products.push(productId);
    await wishlist.save();

    res.status(200).json({
      success: true,
      action: 'added',
      message: 'Added to wishlist',
      count: wishlist.products.length,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId
    );
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      count: wishlist.products.length,
    });
  } catch (err) {
    next(err);
  }
};
