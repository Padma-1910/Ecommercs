const express = require('express');
const router = express.Router();
const { getStats, getCustomers, updateCustomerStatus } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/customers', getCustomers);
router.put('/customers/:id/status', updateCustomerStatus);

module.exports = router;
