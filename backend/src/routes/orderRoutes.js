const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  requestReturn,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { orderValidation } = require('../validators/rules');

router.use(protect);

router.get('/all', authorize('admin'), getAllOrders);
router.route('/').get(getMyOrders).post(orderValidation, createOrder);
router.route('/:id').get(getOrderById);
router.route('/:id/status').put(authorize('admin'), updateOrderStatus);
router.route('/:id/cancel').post(cancelOrder);
router.route('/:id/return').post(requestReturn);

module.exports = router;
