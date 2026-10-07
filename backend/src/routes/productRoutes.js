const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getBestSellers,
  getFlashSaleProducts,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { productValidation } = require('../validators/rules');

// Meta lists
router.get('/meta/featured', getFeaturedProducts);
router.get('/meta/best-sellers', getBestSellers);
router.get('/meta/flash-sales', getFlashSaleProducts);

// Collection routes
router
  .route('/')
  .get(getProducts)
  .post(protect, authorize('admin'), productValidation, createProduct);

// Specific product routes
router
  .route('/:id')
  .get(getProductById)
  .put(protect, authorize('admin'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;
