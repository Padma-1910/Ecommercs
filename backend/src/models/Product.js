const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  color: { type: String, default: 'Default' },
  size: { type: String, default: 'Standard' },
  sku: { type: String, default: '' },
  stock: { type: Number, default: 10, min: 0 },
  price: { type: Number, default: 0 },
});

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Please provide product brand'],
      trim: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please assign a category'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide product description'],
    },
    specifications: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    price: {
      type: Number,
      required: [true, 'Please provide base price'],
      min: [0, 'Price must be positive'],
      index: true,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    countInStock: {
      type: Number,
      required: [true, 'Please provide stock count'],
      min: [0, 'Stock cannot be negative'],
      default: 10,
    },
    images: {
      type: [String],
      required: [true, 'Please provide at least one product image'],
      validate: [(val) => val.length > 0, 'Must have at least one image'],
    },
    colors: {
      type: [String],
      default: ['Black', 'Silver', 'Blue'],
    },
    sizes: {
      type: [String],
      default: ['S', 'M', 'L', 'XL'],
    },
    variants: [VariantSchema],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFlashSale: {
      type: Boolean,
      default: false,
      index: true,
    },
    flashSaleEnd: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    deliveryInfo: {
      estimatedDays: { type: String, default: '2-4 business days' },
      freeShipping: { type: Boolean, default: true },
      returnPolicy: { type: String, default: '30-day return policy' },
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for search
ProductSchema.index({ name: 'text', brand: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
