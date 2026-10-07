require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { Order } = require('../models/Order');
const Review = require('../models/Review');

const categories = [
  { name: 'Electronics', slug: 'electronics', icon: 'laptop', description: 'Latest gadgets and tech devices', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fashion', slug: 'fashion', icon: 'shirt', description: 'Trendy clothing and accessories', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80' },
  { name: 'Home & Living', slug: 'home-living', icon: 'home', description: 'Furniture, decor and lifestyle products', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sports', slug: 'sports', icon: 'dumbbell', description: 'Sports gear and fitness equipment', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Beauty', slug: 'beauty', icon: 'sparkles', description: 'Skincare, makeup and grooming', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80' },
  { name: 'Books', slug: 'books', icon: 'book', description: 'Books, e-books and educational material', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80' },
];

const getProducts = (categoryMap) => [
  // Electronics
  {
    name: 'ProBook Ultra X1 Laptop',
    slug: 'probook-ultra-x1-laptop',
    brand: 'TechCore',
    category: categoryMap['electronics'],
    description: 'Blazing-fast 15" laptop powered by the latest AI chip. Featuring a stunning 4K OLED display, all-day battery life, and a sleek aluminum chassis.',
    price: 1299.99,
    discountPrice: 1099.99,
    discountPercentage: 15,
    countInStock: 24,
    images: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=800&q=80',
    ],
    colors: ['Space Gray', 'Silver', 'Midnight Black'],
    sizes: ['Standard'],
    specifications: [{ key: 'Processor', value: 'AI-X9 16-core' }, { key: 'RAM', value: '32GB DDR5' }, { key: 'Storage', value: '1TB NVMe SSD' }, { key: 'Display', value: '15.6" 4K OLED' }],
    rating: 4.8, numReviews: 142, isFeatured: true, isBestSeller: true, tags: ['laptop', 'ultrabook', 'tech'],
  },
  {
    name: 'SoundBlast Pro ANC Headphones',
    slug: 'soundblast-pro-anc-headphones',
    brand: 'Audiox',
    category: categoryMap['electronics'],
    description: 'Premium wireless headphones with best-in-class active noise cancellation. Up to 40 hours battery life and crystal-clear Hi-Res audio.',
    price: 349.99,
    discountPrice: 249.99,
    discountPercentage: 29,
    countInStock: 52,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
    ],
    colors: ['Matte Black', 'Pearl White', 'Navy Blue'],
    sizes: ['Standard'],
    specifications: [{ key: 'Driver Size', value: '40mm' }, { key: 'Battery', value: '40 Hours' }, { key: 'Connectivity', value: 'Bluetooth 5.3' }, { key: 'ANC', value: 'Adaptive 3-Level' }],
    rating: 4.7, numReviews: 298, isFeatured: true, isBestSeller: true, isFlashSale: true,
    flashSaleEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), tags: ['headphones', 'anc', 'wireless'],
  },
  {
    name: 'SnapX 200 Pro Camera',
    slug: 'snapx-200-pro-camera',
    brand: 'OptaLens',
    category: categoryMap['electronics'],
    description: '48MP mirrorless camera with 8K video recording, in-body stabilization, and a professional-grade sensor for breathtaking photography.',
    price: 2199.99,
    discountPrice: 1899.99,
    discountPercentage: 14,
    countInStock: 12,
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'],
    colors: ['Black'],
    sizes: ['Standard'],
    specifications: [{ key: 'Sensor', value: '48MP Full-Frame' }, { key: 'Video', value: '8K @ 30fps' }, { key: 'ISO', value: '100–51200' }, { key: 'Mount', value: 'E-mount' }],
    rating: 4.9, numReviews: 87, isFeatured: true, tags: ['camera', 'photography', 'mirrorless'],
  },
  {
    name: 'SmartWatch Series 10',
    slug: 'smartwatch-series-10',
    brand: 'Chrono+',
    category: categoryMap['electronics'],
    description: 'Advanced smartwatch with health monitoring, GPS, ECG sensor, blood oxygen, and a stunning always-on Super Retina display.',
    price: 499.99,
    discountPrice: 399.99,
    discountPercentage: 20,
    countInStock: 68,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
    colors: ['Midnight', 'Starlight', 'Product Red'],
    sizes: ['41mm', '45mm'],
    specifications: [{ key: 'Display', value: 'LTPO OLED' }, { key: 'Battery', value: '36 Hours' }, { key: 'Health', value: 'ECG, SpO2, Sleep' }, { key: 'Water Resistance', value: '100m' }],
    rating: 4.6, numReviews: 534, isFeatured: true, isBestSeller: true, isFlashSale: true,
    flashSaleEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), tags: ['smartwatch', 'wearable', 'health'],
  },
  {
    name: 'UltraTab Pro 12',
    slug: 'ultratab-pro-12',
    brand: 'TechCore',
    category: categoryMap['electronics'],
    description: '12.9" AMOLED tablet with M3 chip, 120Hz refresh, quad speakers, and optional stylus support. Perfect for creative professionals.',
    price: 899.99,
    discountPrice: 799.99,
    discountPercentage: 11,
    countInStock: 35,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80'],
    colors: ['Space Gray', 'Silver'],
    sizes: ['Standard', 'Cellular'],
    rating: 4.5, numReviews: 211, isFeatured: false, isBestSeller: true, tags: ['tablet', 'ipad', 'productivity'],
    specifications: [{ key: 'Display', value: '12.9" AMOLED 120Hz' }, { key: 'Processor', value: 'M3 Chip' }, { key: 'Storage', value: '256GB' }, { key: 'Battery', value: '10,758mAh' }],
  },
  {
    name: 'GamingPad X Pro Controller',
    slug: 'gamingpad-x-pro-controller',
    brand: 'PlayEdge',
    category: categoryMap['electronics'],
    description: 'Professional gaming controller with adaptive triggers, haptic feedback, 3D audio jack, and ultra-responsive buttons for competitive play.',
    price: 79.99,
    discountPrice: 59.99,
    discountPercentage: 25,
    countInStock: 90,
    images: ['https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=800&q=80'],
    colors: ['Midnight Black', 'Arctic White', 'Red Lava'],
    sizes: ['Standard'],
    rating: 4.4, numReviews: 673, isFlashSale: true,
    flashSaleEnd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), tags: ['gaming', 'controller', 'console'],
    specifications: [{ key: 'Connectivity', value: 'USB-C & Wireless' }, { key: 'Battery', value: '15 Hours' }, { key: 'Compatibility', value: 'PC, Console, Mobile' }],
  },
  // Fashion
  {
    name: 'Alpine Trek Waterproof Jacket',
    slug: 'alpine-trek-waterproof-jacket',
    brand: 'PeakWear',
    category: categoryMap['fashion'],
    description: 'Lightweight Gore-Tex waterproof jacket ideal for hiking and outdoor adventures. Breathable, durable, and packable in its own pocket.',
    price: 249.99,
    discountPrice: 189.99,
    discountPercentage: 24,
    countInStock: 44,
    images: ['https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80'],
    colors: ['Forest Green', 'Navy Blue', 'Slate Gray'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.6, numReviews: 189, isBestSeller: true, tags: ['jacket', 'outdoor', 'waterproof'],
    specifications: [{ key: 'Material', value: 'Gore-Tex 3L' }, { key: 'Weight', value: '480g' }, { key: 'Pockets', value: '4 Zip Pockets' }],
  },
  {
    name: 'UrbanFlex Chino Trousers',
    slug: 'urbanflex-chino-trousers',
    brand: 'ModStyle',
    category: categoryMap['fashion'],
    description: 'Slim-fit chinos crafted from premium stretch cotton. Versatile enough for office and weekend wear with a modern tapered silhouette.',
    price: 89.99,
    discountPrice: 69.99,
    discountPercentage: 22,
    countInStock: 76,
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80'],
    colors: ['Khaki', 'Navy', 'Charcoal', 'Olive'],
    sizes: ['28', '30', '32', '34', '36', '38'],
    rating: 4.3, numReviews: 315, tags: ['trousers', 'chino', 'casual'],
    specifications: [{ key: 'Material', value: '97% Cotton, 3% Elastane' }, { key: 'Fit', value: 'Slim Tapered' }],
  },
  {
    name: 'Luxe Cashmere Sweater',
    slug: 'luxe-cashmere-sweater',
    brand: 'Softwear',
    category: categoryMap['fashion'],
    description: '100% pure cashmere crewneck sweater. Exceptionally soft, warm and lightweight. A timeless wardrobe staple available in classic neutrals.',
    price: 179.99,
    discountPrice: 139.99,
    discountPercentage: 22,
    countInStock: 38,
    images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80'],
    colors: ['Camel', 'Ivory', 'Burgundy', 'Slate Blue'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.8, numReviews: 142, isFeatured: true, tags: ['sweater', 'cashmere', 'luxury'],
    specifications: [{ key: 'Material', value: '100% Pure Cashmere' }, { key: 'Care', value: 'Dry Clean Only' }],
  },
  {
    name: 'Classic Runner Sneakers',
    slug: 'classic-runner-sneakers',
    brand: 'StridePro',
    category: categoryMap['fashion'],
    description: 'Iconic low-top sneakers with responsive foam cushioning and a breathable mesh upper. Timeless style meets all-day comfort.',
    price: 129.99,
    discountPrice: 99.99,
    discountPercentage: 23,
    countInStock: 110,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
    colors: ['White/Black', 'All Black', 'Navy/White'],
    sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12'],
    rating: 4.5, numReviews: 892, isBestSeller: true, isFlashSale: true,
    flashSaleEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), tags: ['sneakers', 'shoes', 'running'],
    specifications: [{ key: 'Upper', value: 'Breathable Mesh' }, { key: 'Sole', value: 'Responsive Foam' }, { key: 'Closure', value: 'Lace-Up' }],
  },
  // Home & Living
  {
    name: 'AeroBreeze Smart Fan',
    slug: 'aerobreeze-smart-fan',
    brand: 'AirIQ',
    category: categoryMap['home-living'],
    description: 'WiFi-enabled tower fan with 12 airflow speeds, sleep timer, oscillation, and app control. Ultra-quiet DC motor for bedroom use.',
    price: 199.99,
    discountPrice: 159.99,
    discountPercentage: 20,
    countInStock: 28,
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80'],
    colors: ['White', 'Graphite'],
    sizes: ['Standard'],
    rating: 4.4, numReviews: 176, tags: ['fan', 'smart home', 'cooling'],
    specifications: [{ key: 'Speed Levels', value: '12' }, { key: 'Connectivity', value: 'WiFi + App' }, { key: 'Noise Level', value: '<25dB' }],
  },
  {
    name: 'Nordic Coffee Table',
    slug: 'nordic-coffee-table',
    brand: 'WoodCraft',
    category: categoryMap['home-living'],
    description: 'Minimalist Scandinavian coffee table crafted from solid oak with a matte finish. Features a lower shelf for storage and a timeless design.',
    price: 329.99,
    discountPrice: 0,
    discountPercentage: 0,
    countInStock: 15,
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'],
    colors: ['Natural Oak', 'Walnut', 'White Oak'],
    sizes: ['Standard'],
    rating: 4.7, numReviews: 63, isFeatured: true, tags: ['furniture', 'table', 'nordic'],
    specifications: [{ key: 'Material', value: 'Solid Oak' }, { key: 'Dimensions', value: '120 x 60 x 45 cm' }, { key: 'Finish', value: 'Matte Lacquer' }],
  },
  {
    name: 'BrewMaster Pour-Over Coffee Kit',
    slug: 'brewmaster-pour-over-coffee-kit',
    brand: 'CafeCraft',
    category: categoryMap['home-living'],
    description: 'Complete pour-over coffee kit with precision gooseneck kettle, borosilicate carafe, reusable metal filter, and electronic scale.',
    price: 89.99,
    discountPrice: 74.99,
    discountPercentage: 17,
    countInStock: 47,
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80'],
    colors: ['Matte Black', 'Silver'],
    sizes: ['Standard'],
    rating: 4.9, numReviews: 228, isFeatured: true, isBestSeller: true, tags: ['coffee', 'kitchen', 'brewing'],
    specifications: [{ key: 'Kettle Capacity', value: '1L' }, { key: 'Carafe', value: '600ml Borosilicate' }, { key: 'Filter', value: 'Reusable Stainless Steel' }],
  },
  // Sports
  {
    name: 'PowerLift Pro Adjustable Dumbbells',
    slug: 'powerlift-pro-adjustable-dumbbells',
    brand: 'FitForge',
    category: categoryMap['sports'],
    description: 'Space-saving adjustable dumbbells that replace 15 pairs of weights. Quick dial adjustment from 5–52.5 lbs. Built for serious home gym setups.',
    price: 549.99,
    discountPrice: 449.99,
    discountPercentage: 18,
    countInStock: 21,
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80'],
    colors: ['Standard'],
    sizes: ['5-52.5 lbs Pair'],
    rating: 4.8, numReviews: 397, isFeatured: true, isBestSeller: true, tags: ['dumbbells', 'weights', 'gym'],
    specifications: [{ key: 'Weight Range', value: '5–52.5 lbs' }, { key: 'Adjustment', value: 'Dial Select' }, { key: 'Material', value: 'Cast Iron + ABS' }],
  },
  {
    name: 'AeroFlex Yoga Mat Pro',
    slug: 'aeroflex-yoga-mat-pro',
    brand: 'ZenFit',
    category: categoryMap['sports'],
    description: 'Extra-wide 26" premium TPE yoga mat with alignment lines, non-slip texture on both sides, and carry strap. 6mm cushioning for joints.',
    price: 79.99,
    discountPrice: 59.99,
    discountPercentage: 25,
    countInStock: 83,
    images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'],
    colors: ['Midnight Purple', 'Ocean Blue', 'Forest Green', 'Rose Gold'],
    sizes: ['Standard (68")', 'XL (74")'],
    rating: 4.6, numReviews: 512, isFlashSale: true,
    flashSaleEnd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), tags: ['yoga', 'mat', 'fitness'],
    specifications: [{ key: 'Material', value: 'Eco TPE' }, { key: 'Thickness', value: '6mm' }, { key: 'Width', value: '26"' }],
  },
  {
    name: 'TrailBlaze Pro Running Shoes',
    slug: 'trailblaze-pro-running-shoes',
    brand: 'KineticRun',
    category: categoryMap['sports'],
    description: 'Carbon fiber plate running shoes with nitrogen-infused foam for elite performance. Featherlight 195g build for personal bests on any surface.',
    price: 199.99,
    discountPrice: 169.99,
    discountPercentage: 15,
    countInStock: 57,
    images: ['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80'],
    colors: ['Neon Yellow', 'Electric Blue', 'All Black'],
    sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12'],
    rating: 4.7, numReviews: 304, isBestSeller: true, tags: ['running', 'shoes', 'athletic'],
    specifications: [{ key: 'Weight', value: '195g' }, { key: 'Plate', value: 'Carbon Fiber' }, { key: 'Drop', value: '8mm' }],
  },
  // Beauty
  {
    name: 'GlowRx Vitamin C Serum',
    slug: 'glowrx-vitamin-c-serum',
    brand: 'DermLux',
    category: categoryMap['beauty'],
    description: '20% stabilized Vitamin C serum with Niacinamide and Hyaluronic Acid. Brightens skin, fades dark spots and boosts collagen in 4 weeks.',
    price: 69.99,
    discountPrice: 54.99,
    discountPercentage: 21,
    countInStock: 124,
    images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80'],
    colors: ['Standard'],
    sizes: ['30ml', '60ml'],
    rating: 4.8, numReviews: 761, isFeatured: true, isBestSeller: true, isFlashSale: true,
    flashSaleEnd: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000), tags: ['serum', 'skincare', 'vitamin c'],
    specifications: [{ key: 'Key Ingredients', value: 'Vit C 20%, Niacinamide 5%, HA' }, { key: 'Skin Type', value: 'All Types' }, { key: 'Shelf Life', value: '24 Months' }],
  },
  {
    name: 'HydraGlow Moisturizer SPF 50',
    slug: 'hydraglow-moisturizer-spf-50',
    brand: 'SkinRich',
    category: categoryMap['beauty'],
    description: 'Lightweight oil-free daily moisturizer with SPF 50 broad-spectrum protection. Non-comedogenic, fragrance-free, with Ceramides and Peptides.',
    price: 49.99,
    discountPrice: 39.99,
    discountPercentage: 20,
    countInStock: 98,
    images: ['https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80'],
    colors: ['Standard'],
    sizes: ['50ml', '100ml'],
    rating: 4.5, numReviews: 423, tags: ['moisturizer', 'sunscreen', 'skincare'],
    specifications: [{ key: 'SPF', value: '50 Broad Spectrum' }, { key: 'Key Ingredients', value: 'Ceramides, Peptides' }, { key: 'Skin Type', value: 'All / Oily' }],
  },
  // Books
  {
    name: 'The Full Stack Developer Blueprint',
    slug: 'the-full-stack-developer-blueprint',
    brand: 'TechPress',
    category: categoryMap['books'],
    description: 'A comprehensive 600-page guide to modern full-stack development covering React, Node.js, databases, cloud deployment and system design patterns.',
    price: 49.99,
    discountPrice: 34.99,
    discountPercentage: 30,
    countInStock: 200,
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80'],
    colors: ['Paperback', 'Hardcover'],
    sizes: ['Standard'],
    rating: 4.7, numReviews: 289, isFeatured: true, tags: ['book', 'programming', 'web development'],
    specifications: [{ key: 'Pages', value: '612' }, { key: 'Publisher', value: 'TechPress' }, { key: 'Edition', value: '3rd 2026' }, { key: 'Language', value: 'English' }],
  },
  {
    name: 'Atomic Habits – Expanded Edition',
    slug: 'atomic-habits-expanded-edition',
    brand: 'LifePublish',
    category: categoryMap['books'],
    description: 'Updated and expanded version of the #1 bestseller. Features 50+ new habit-building strategies and case studies from elite athletes and entrepreneurs.',
    price: 29.99,
    discountPrice: 22.99,
    discountPercentage: 23,
    countInStock: 350,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80'],
    colors: ['Paperback', 'Hardcover'],
    sizes: ['Standard'],
    rating: 4.9, numReviews: 2341, isBestSeller: true, tags: ['book', 'self-help', 'habits'],
    specifications: [{ key: 'Pages', value: '368' }, { key: 'Author', value: 'James Clear' }, { key: 'Edition', value: 'Expanded 2026' }],
  },
];

const coupons = [
  {
    code: 'WELCOME20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 50,
    maxDiscount: 100,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    usageLimit: 500,
    isActive: true,
  },
  {
    code: 'SAVE50',
    discountType: 'fixed',
    discountValue: 50,
    minOrderValue: 200,
    maxDiscount: 50,
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    usageLimit: 100,
    isActive: true,
  },
  {
    code: 'FLASH15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 0,
    maxDiscount: 75,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    usageLimit: 200,
    isActive: true,
  },
];

const seed = async () => {
  try {
    console.log('🌱 Starting database seed...');
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Product.deleteMany(),
      Order.deleteMany(),
      Review.deleteMany(),
      Coupon.deleteMany(),
    ]);
    console.log('✅ Cleared existing data');

    // Create admin user (password is hashed by pre-save hook)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@shopflow.com',
      password: 'Admin@1234',
      role: 'admin',
      phone: '+1-555-0100',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      isEmailVerified: true,
    });
    console.log(`✅ Admin created: admin@shopflow.com / Admin@1234`);

    // Create customer users
    const customerData = [
      { name: 'Alice Johnson', email: 'alice@example.com', password: 'Customer@123', phone: '+1-555-0201', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=400&q=80' },
      { name: 'Bob Martinez', email: 'bob@example.com', password: 'Customer@123', phone: '+1-555-0202', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
      { name: 'Carol Williams', email: 'carol@example.com', password: 'Customer@123', phone: '+1-555-0203', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80' },
    ];
    const customers = await User.create(customerData);
    console.log(`✅ ${customers.length} customer accounts created`);

    // Create categories
    const createdCats = await Category.create(categories);
    const categoryMap = {};
    createdCats.forEach((c) => { categoryMap[c.slug] = c._id; });
    console.log(`✅ ${createdCats.length} categories created`);

    // Create products
    const productDocs = getProducts(categoryMap);
    const createdProducts = await Product.create(productDocs);
    console.log(`✅ ${createdProducts.length} products created`);

    // Create coupons
    await Coupon.create(coupons);
    console.log(`✅ ${coupons.length} coupons created`);

    // Create sample orders and reviews for realistic data
    const sampleProduct = createdProducts[0];
    const sampleProduct2 = createdProducts[1];

    // Sample orders (already paid)
    await Order.create([
      {
        user: customers[0]._id,
        orderItems: [{
          product: sampleProduct._id, name: sampleProduct.name,
          image: sampleProduct.images[0], price: sampleProduct.discountPrice || sampleProduct.price,
          quantity: 1, color: 'Space Gray', size: 'Standard',
        }],
        shippingAddress: { fullName: 'Alice Johnson', phone: '+1-555-0201', addressLine1: '123 Main St', city: 'New York', state: 'NY', postalCode: '10001', country: 'USA' },
        paymentMethod: 'Card', paymentResult: { id: 'pi_seed_001', status: 'COMPLETED', update_time: new Date().toISOString() },
        itemsPrice: 1099.99, shippingPrice: 0, taxPrice: 87.99, discountPrice: 0, totalPrice: 1187.98,
        isPaid: true, paidAt: new Date(), status: 'Delivered', isDelivered: true, deliveredAt: new Date(),
        trackingNumber: 'TRK-20241001',
      },
      {
        user: customers[1]._id,
        orderItems: [{
          product: sampleProduct2._id, name: sampleProduct2.name,
          image: sampleProduct2.images[0], price: sampleProduct2.discountPrice || sampleProduct2.price,
          quantity: 2, color: 'Matte Black', size: 'Standard',
        }],
        shippingAddress: { fullName: 'Bob Martinez', phone: '+1-555-0202', addressLine1: '456 Oak Ave', city: 'Los Angeles', state: 'CA', postalCode: '90001', country: 'USA' },
        paymentMethod: 'Card', paymentResult: { id: 'pi_seed_002', status: 'COMPLETED', update_time: new Date().toISOString() },
        itemsPrice: 499.98, shippingPrice: 0, taxPrice: 39.99, discountPrice: 0, totalPrice: 539.97,
        isPaid: true, paidAt: new Date(), status: 'Shipped', isDelivered: false,
        trackingNumber: 'TRK-20241002',
      },
    ]);
    console.log('✅ Sample orders created');

    // Create reviews (only for users with paid orders)
    const reviews = await Review.create([
      { user: customers[0]._id, product: sampleProduct._id, rating: 5, title: 'Exceptional laptop!', comment: 'Absolutely love this laptop. Blazing fast and the display is stunning.', verifiedPurchase: true },
      { user: customers[1]._id, product: sampleProduct2._id, rating: 5, title: 'Best headphones I\'ve owned', comment: 'The ANC is incredible. Bought 2 pairs for me and my partner.', verifiedPurchase: true },
    ]);
    console.log(`✅ ${reviews.length} sample reviews created`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   Admin    : admin@shopflow.com / Admin@1234');
    console.log('   Customer : alice@example.com / Customer@123\n');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seed();
