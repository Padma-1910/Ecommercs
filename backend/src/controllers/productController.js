const Product = require('../models/Product');
const Category = require('../models/Category');

// Helper to make URL slug
const createSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      sort,
      page = 1,
      limit = 12,
      isFeatured,
      isBestSeller,
      isFlashSale,
    } = req.query;

    const query = {};

    // Search keyword in name, brand, description
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { brand: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    // Category filter (support both ObjectId and slug)
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) {
          query.category = cat._id;
        }
      }
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Flags
    if (isFeatured === 'true') query.isFeatured = true;
    if (isBestSeller === 'true') query.isBestSeller = true;
    if (isFlashSale === 'true') query.isFlashSale = true;

    // Sorting
    let sortBy = { createdAt: -1 };
    if (sort === 'price-asc') sortBy = { price: 1 };
    else if (sort === 'price-desc') sortBy = { price: -1 };
    else if (sort === 'rating') sortBy = { rating: -1 };
    else if (sort === 'popular') sortBy = { numReviews: -1 };
    else if (sort === 'newest') sortBy = { createdAt: -1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product by ID or slug
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    let product;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(req.params.id).populate('category');
    } else {
      product = await Product.findOne({ slug: req.params.id }).populate('category');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Fetch related products from the same category
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
    })
      .limit(4)
      .select('name price discountPrice discountPercentage images rating numReviews brand');

    res.status(200).json({
      success: true,
      product,
      relatedProducts,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get featured products
// @route   GET /api/products/meta/featured
// @access  Public
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true })
      .populate('category', 'name slug')
      .limit(8);
    res.status(200).json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
};

// @desc    Get best-selling products
// @route   GET /api/products/meta/best-sellers
// @access  Public
exports.getBestSellers = async (req, res, next) => {
  try {
    const products = await Product.find({ isBestSeller: true })
      .populate('category', 'name slug')
      .limit(8);
    res.status(200).json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
};

// @desc    Get flash sale products
// @route   GET /api/products/meta/flash-sales
// @access  Public
exports.getFlashSaleProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isFlashSale: true })
      .populate('category', 'name slug')
      .limit(8);
    res.status(200).json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      brand,
      category,
      description,
      price,
      discountPrice,
      discountPercentage,
      countInStock,
      images,
      colors,
      sizes,
      specifications,
      isFeatured,
      isBestSeller,
      isFlashSale,
      flashSaleEnd,
      tags,
    } = req.body;

    let slug = createSlug(name);
    let existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const calculatedDiscount =
      discountPrice && discountPrice > 0
        ? Math.round(((price - discountPrice) / price) * 100)
        : discountPercentage || 0;

    const product = await Product.create({
      name,
      slug,
      brand,
      category,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      discountPercentage: calculatedDiscount,
      countInStock: Number(countInStock),
      images: images && images.length ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
      colors: colors || ['Default'],
      sizes: sizes || ['Standard'],
      specifications: specifications || [],
      isFeatured: !!isFeatured,
      isBestSeller: !!isBestSeller,
      isFlashSale: !!isFlashSale,
      flashSaleEnd: flashSaleEnd || null,
      tags: tags || [],
    });

    const populatedProduct = await Product.findById(product._id).populate('category');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: populatedProduct,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (req.body.name && req.body.name !== product.name) {
      req.body.slug = createSlug(req.body.name);
    }

    if (req.body.price || req.body.discountPrice) {
      const p = req.body.price !== undefined ? Number(req.body.price) : product.price;
      const dp = req.body.discountPrice !== undefined ? Number(req.body.discountPrice) : product.discountPrice;
      if (dp > 0 && p > dp) {
        req.body.discountPercentage = Math.round(((p - dp) / p) * 100);
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product removed successfully',
    });
  } catch (err) {
    next(err);
  }
};
