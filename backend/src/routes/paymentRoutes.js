const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  verifyPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/create', createPaymentIntent);
router.post('/verify', verifyPayment);

module.exports = router;
