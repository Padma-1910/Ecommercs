const express = require('express');
const router = express.Router();
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/addressController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getAddresses).post(addAddress);
router.route('/:id').put(updateAddress).delete(deleteAddress);
router.route('/:id/default').put(setDefaultAddress);

module.exports = router;
