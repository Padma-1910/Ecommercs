const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// /api/products/:id/reviews
router.route('/').get(getProductReviews).post(protect, createReview);

// /api/reviews/:id
router.route('/:id').put(protect, updateReview).delete(protect, deleteReview);

module.exports = router;
