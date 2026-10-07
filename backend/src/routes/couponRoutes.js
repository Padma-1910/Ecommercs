const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');

router.post('/validate', validateCoupon);
router
  .route('/')
  .get(protect, authorize('admin'), getCoupons)
  .post(protect, authorize('admin'), createCoupon);

router
  .route('/:id')
  .put(protect, authorize('admin'), updateCoupon)
  .delete(protect, authorize('admin'), deleteCoupon);

module.exports = router;
