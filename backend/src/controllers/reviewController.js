const Review = require('../models/Review');
const { Order } = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new review (Only verified buyers)
// @route   POST /api/products/:id/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { rating, comment, title } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      user: req.user.id,
      product: productId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product. You can update your existing review.',
      });
    }

    // Check if user has purchased the product
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      'orderItems.product': productId,
      isPaid: true,
    });

    if (!hasPurchased && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only verified customers who purchased this product can leave a review.',
      });
    }

    const review = await Review.create({
      user: req.user.id,
      product: productId,
      rating: Number(rating),
      title: title || '',
      comment,
      verifiedPurchase: !!hasPurchased,
    });

    const populatedReview = await Review.findById(review._id).populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: populatedReview,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this review' });
    }

    review.rating = req.body.rating !== undefined ? Number(req.body.rating) : review.rating;
    if (req.body.title !== undefined) review.title = req.body.title;
    if (req.body.comment !== undefined) review.comment = req.body.comment;

    await review.save();

    const populatedReview = await Review.findById(review._id).populate('user', 'name avatar');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review: populatedReview,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
