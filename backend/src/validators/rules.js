const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validateRequest,
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest,
];

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('price').isNumeric().withMessage('Price must be a valid number'),
  body('countInStock')
    .isInt({ min: 0 })
    .withMessage('Count in stock must be a non-negative integer'),
  body('category').notEmpty().withMessage('Category is required'),
  validateRequest,
];

const orderValidation = [
  body('orderItems').isArray({ min: 1 }).withMessage('Cart is empty'),
  body('shippingAddress.fullName').notEmpty().withMessage('Full name is required for shipping'),
  body('shippingAddress.addressLine1').notEmpty().withMessage('Address line 1 is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
  validateRequest,
];

module.exports = {
  validateRequest,
  registerValidation,
  loginValidation,
  productValidation,
  orderValidation,
};
