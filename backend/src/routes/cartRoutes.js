const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getCart).post(addToCart).delete(clearCart);
router.route('/apply-coupon').post(applyCoupon);
router.route('/remove-coupon').post(removeCoupon);
router.route('/:itemId').put(updateCartItem).delete(removeCartItem);

module.exports = router;
