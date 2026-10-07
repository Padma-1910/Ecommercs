require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const app = require('./app');

// Models
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Coupon = require('./models/Coupon');
const { Order } = require('./models/Order');
const Review = require('./models/Review');

const PORT = process.env.PORT || 5000;

// ─── Inline seed data ──────────────────────────────────────────────────────────
const categoriesData = [
  { name: 'Electronics', slug: 'electronics', icon: 'laptop', description: 'Latest gadgets and tech devices', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fashion', slug: 'fashion', icon: 'shirt', description: 'Trendy clothing and accessories', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80' },
  { name: 'Home & Living', slug: 'home-living', icon: 'home', description: 'Furniture, decor and lifestyle products', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sports', slug: 'sports', icon: 'dumbbell', description: 'Sports gear and fitness equipment', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Beauty', slug: 'beauty', icon: 'sparkles', description: 'Skincare, makeup and grooming', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80' },
  { name: 'Books', slug: 'books', icon: 'book', description: 'Books, e-books and educational material', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80' },
];

const getProductsData = (cm) => [
  { name: 'ProBook Ultra X1 Laptop', slug: 'probook-ultra-x1-laptop', brand: 'TechCore', category: cm.electronics, description: 'Blazing-fast 15" laptop with 4K OLED display, AI chip, and all-day battery life.', price: 1299.99, discountPrice: 1099.99, discountPercentage: 15, countInStock: 24, images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=800&q=80'], colors: ['Space Gray', 'Silver', 'Midnight Black'], sizes: ['Standard'], rating: 4.8, numReviews: 142, isFeatured: true, isBestSeller: true, tags: ['laptop', 'ultrabook', 'tech'], specifications: [{ key: 'Processor', value: 'AI-X9 16-core' }, { key: 'RAM', value: '32GB DDR5' }, { key: 'Storage', value: '1TB NVMe SSD' }] },
  { name: 'SoundBlast Pro ANC Headphones', slug: 'soundblast-pro-anc-headphones', brand: 'Audiox', category: cm.electronics, description: 'Premium wireless headphones with best-in-class active noise cancellation. 40 hours battery.', price: 349.99, discountPrice: 249.99, discountPercentage: 29, countInStock: 52, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'], colors: ['Matte Black', 'Pearl White', 'Navy Blue'], sizes: ['Standard'], rating: 4.7, numReviews: 298, isFeatured: true, isBestSeller: true, isFlashSale: true, flashSaleEnd: new Date(Date.now() + 2 * 86400000), tags: ['headphones', 'anc', 'wireless'], specifications: [{ key: 'Battery', value: '40 Hours' }, { key: 'Connectivity', value: 'Bluetooth 5.3' }] },
  { name: 'SnapX 200 Pro Camera', slug: 'snapx-200-pro-camera', brand: 'OptaLens', category: cm.electronics, description: '48MP mirrorless camera with 8K video recording and in-body stabilization.', price: 2199.99, discountPrice: 1899.99, discountPercentage: 14, countInStock: 12, images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'], colors: ['Black'], sizes: ['Standard'], rating: 4.9, numReviews: 87, isFeatured: true, tags: ['camera', 'photography'], specifications: [{ key: 'Sensor', value: '48MP Full-Frame' }, { key: 'Video', value: '8K @ 30fps' }] },
  { name: 'SmartWatch Series 10', slug: 'smartwatch-series-10', brand: 'Chrono+', category: cm.electronics, description: 'Advanced smartwatch with ECG, GPS, blood oxygen, and always-on display.', price: 499.99, discountPrice: 399.99, discountPercentage: 20, countInStock: 68, images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'], colors: ['Midnight', 'Starlight', 'Product Red'], sizes: ['41mm', '45mm'], rating: 4.6, numReviews: 534, isFeatured: true, isBestSeller: true, isFlashSale: true, flashSaleEnd: new Date(Date.now() + 3 * 86400000), tags: ['smartwatch', 'wearable', 'health'], specifications: [{ key: 'Battery', value: '36 Hours' }, { key: 'Health', value: 'ECG, SpO2, Sleep' }] },
  { name: 'UltraTab Pro 12', slug: 'ultratab-pro-12', brand: 'TechCore', category: cm.electronics, description: '12.9" AMOLED tablet with M3 chip, 120Hz refresh, and stylus support.', price: 899.99, discountPrice: 799.99, discountPercentage: 11, countInStock: 35, images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80'], colors: ['Space Gray', 'Silver'], sizes: ['WiFi', 'Cellular'], rating: 4.5, numReviews: 211, isBestSeller: true, tags: ['tablet', 'productivity'], specifications: [{ key: 'Display', value: '12.9" AMOLED 120Hz' }, { key: 'Processor', value: 'M3 Chip' }] },
  { name: 'GamingPad X Pro Controller', slug: 'gamingpad-x-pro-controller', brand: 'PlayEdge', category: cm.electronics, description: 'Pro gaming controller with adaptive triggers, haptic feedback, and 15-hour battery.', price: 79.99, discountPrice: 59.99, discountPercentage: 25, countInStock: 90, images: ['https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=800&q=80'], colors: ['Midnight Black', 'Arctic White', 'Red Lava'], sizes: ['Standard'], rating: 4.4, numReviews: 673, isFlashSale: true, flashSaleEnd: new Date(Date.now() + 86400000), tags: ['gaming', 'controller'], specifications: [{ key: 'Battery', value: '15 Hours' }, { key: 'Connectivity', value: 'USB-C & Wireless' }] },
  { name: 'Alpine Trek Waterproof Jacket', slug: 'alpine-trek-waterproof-jacket', brand: 'PeakWear', category: cm.fashion, description: 'Lightweight Gore-Tex waterproof jacket for hiking. Breathable and packable.', price: 249.99, discountPrice: 189.99, discountPercentage: 24, countInStock: 44, images: ['https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80'], colors: ['Forest Green', 'Navy Blue', 'Slate Gray'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], rating: 4.6, numReviews: 189, isBestSeller: true, tags: ['jacket', 'outdoor', 'waterproof'], specifications: [{ key: 'Material', value: 'Gore-Tex 3L' }, { key: 'Weight', value: '480g' }] },
  { name: 'UrbanFlex Chino Trousers', slug: 'urbanflex-chino-trousers', brand: 'ModStyle', category: cm.fashion, description: 'Slim-fit stretch cotton chinos. Versatile for office and weekend wear.', price: 89.99, discountPrice: 69.99, discountPercentage: 22, countInStock: 76, images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80'], colors: ['Khaki', 'Navy', 'Charcoal', 'Olive'], sizes: ['28', '30', '32', '34', '36', '38'], rating: 4.3, numReviews: 315, tags: ['trousers', 'chino'], specifications: [{ key: 'Material', value: '97% Cotton, 3% Elastane' }] },
  { name: 'Luxe Cashmere Sweater', slug: 'luxe-cashmere-sweater', brand: 'Softwear', category: cm.fashion, description: '100% pure cashmere crewneck sweater. Timeless wardrobe staple.', price: 179.99, discountPrice: 139.99, discountPercentage: 22, countInStock: 38, images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80'], colors: ['Camel', 'Ivory', 'Burgundy', 'Slate Blue'], sizes: ['XS', 'S', 'M', 'L', 'XL'], rating: 4.8, numReviews: 142, isFeatured: true, tags: ['sweater', 'cashmere', 'luxury'], specifications: [{ key: 'Material', value: '100% Pure Cashmere' }] },
  { name: 'Classic Runner Sneakers', slug: 'classic-runner-sneakers', brand: 'StridePro', category: cm.fashion, description: 'Iconic low-top sneakers with responsive foam cushioning and breathable mesh.', price: 129.99, discountPrice: 99.99, discountPercentage: 23, countInStock: 110, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'], colors: ['White/Black', 'All Black', 'Navy/White'], sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12'], rating: 4.5, numReviews: 892, isBestSeller: true, isFlashSale: true, flashSaleEnd: new Date(Date.now() + 2 * 86400000), tags: ['sneakers', 'shoes'], specifications: [{ key: 'Upper', value: 'Breathable Mesh' }, { key: 'Sole', value: 'Responsive Foam' }] },
  { name: 'AeroBreeze Smart Fan', slug: 'aerobreeze-smart-fan', brand: 'AirIQ', category: cm['home-living'], description: 'WiFi-enabled tower fan with 12 speeds, sleep timer, and app control.', price: 199.99, discountPrice: 159.99, discountPercentage: 20, countInStock: 28, images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80'], colors: ['White', 'Graphite'], sizes: ['Standard'], rating: 4.4, numReviews: 176, tags: ['fan', 'smart home'], specifications: [{ key: 'Speed Levels', value: '12' }, { key: 'Connectivity', value: 'WiFi + App' }] },
  { name: 'Nordic Coffee Table', slug: 'nordic-coffee-table', brand: 'WoodCraft', category: cm['home-living'], description: 'Minimalist Scandinavian coffee table from solid oak. Lower shelf storage.', price: 329.99, discountPrice: 0, discountPercentage: 0, countInStock: 15, images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'], colors: ['Natural Oak', 'Walnut', 'White Oak'], sizes: ['Standard'], rating: 4.7, numReviews: 63, isFeatured: true, tags: ['furniture', 'table', 'nordic'], specifications: [{ key: 'Material', value: 'Solid Oak' }, { key: 'Dimensions', value: '120 x 60 x 45 cm' }] },
  { name: 'BrewMaster Pour-Over Kit', slug: 'brewmaster-pour-over-coffee-kit', brand: 'CafeCraft', category: cm['home-living'], description: 'Complete pour-over coffee kit with gooseneck kettle, carafe, and scale.', price: 89.99, discountPrice: 74.99, discountPercentage: 17, countInStock: 47, images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80'], colors: ['Matte Black', 'Silver'], sizes: ['Standard'], rating: 4.9, numReviews: 228, isFeatured: true, isBestSeller: true, tags: ['coffee', 'kitchen'], specifications: [{ key: 'Kettle Capacity', value: '1L' }, { key: 'Carafe', value: '600ml' }] },
  { name: 'PowerLift Adjustable Dumbbells', slug: 'powerlift-pro-adjustable-dumbbells', brand: 'FitForge', category: cm.sports, description: 'Adjustable dumbbells replacing 15 pairs. Quick dial 5–52.5 lbs.', price: 549.99, discountPrice: 449.99, discountPercentage: 18, countInStock: 21, images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80'], colors: ['Standard'], sizes: ['5-52.5 lbs Pair'], rating: 4.8, numReviews: 397, isFeatured: true, isBestSeller: true, tags: ['dumbbells', 'weights', 'gym'], specifications: [{ key: 'Weight Range', value: '5–52.5 lbs' }, { key: 'Adjustment', value: 'Dial Select' }] },
  { name: 'AeroFlex Yoga Mat Pro', slug: 'aeroflex-yoga-mat-pro', brand: 'ZenFit', category: cm.sports, description: 'Extra-wide 26" premium TPE yoga mat with alignment lines and carry strap.', price: 79.99, discountPrice: 59.99, discountPercentage: 25, countInStock: 83, images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'], colors: ['Midnight Purple', 'Ocean Blue', 'Forest Green', 'Rose Gold'], sizes: ['Standard (68")', 'XL (74")'], rating: 4.6, numReviews: 512, isFlashSale: true, flashSaleEnd: new Date(Date.now() + 4 * 86400000), tags: ['yoga', 'mat', 'fitness'], specifications: [{ key: 'Material', value: 'Eco TPE' }, { key: 'Thickness', value: '6mm' }] },
  { name: 'TrailBlaze Pro Running Shoes', slug: 'trailblaze-pro-running-shoes', brand: 'KineticRun', category: cm.sports, description: 'Carbon fiber plate running shoes. Featherlight 195g for personal bests.', price: 199.99, discountPrice: 169.99, discountPercentage: 15, countInStock: 57, images: ['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80'], colors: ['Neon Yellow', 'Electric Blue', 'All Black'], sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12'], rating: 4.7, numReviews: 304, isBestSeller: true, tags: ['running', 'shoes'], specifications: [{ key: 'Weight', value: '195g' }, { key: 'Plate', value: 'Carbon Fiber' }] },
  { name: 'GlowRx Vitamin C Serum', slug: 'glowrx-vitamin-c-serum', brand: 'DermLux', category: cm.beauty, description: '20% stabilized Vitamin C serum with Niacinamide and Hyaluronic Acid.', price: 69.99, discountPrice: 54.99, discountPercentage: 21, countInStock: 124, images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80'], colors: ['Standard'], sizes: ['30ml', '60ml'], rating: 4.8, numReviews: 761, isFeatured: true, isBestSeller: true, isFlashSale: true, flashSaleEnd: new Date(Date.now() + 1.5 * 86400000), tags: ['serum', 'skincare', 'vitamin c'], specifications: [{ key: 'Key Ingredients', value: 'Vit C 20%, Niacinamide 5%, HA' }] },
  { name: 'HydraGlow Moisturizer SPF 50', slug: 'hydraglow-moisturizer-spf-50', brand: 'SkinRich', category: cm.beauty, description: 'Lightweight oil-free daily moisturizer with SPF 50 and Ceramides.', price: 49.99, discountPrice: 39.99, discountPercentage: 20, countInStock: 98, images: ['https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80'], colors: ['Standard'], sizes: ['50ml', '100ml'], rating: 4.5, numReviews: 423, tags: ['moisturizer', 'sunscreen', 'skincare'], specifications: [{ key: 'SPF', value: '50 Broad Spectrum' }] },
  { name: 'The Full Stack Developer Blueprint', slug: 'the-full-stack-developer-blueprint', brand: 'TechPress', category: cm.books, description: 'Comprehensive 600-page guide to modern full-stack development.', price: 49.99, discountPrice: 34.99, discountPercentage: 30, countInStock: 200, images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80'], colors: ['Paperback', 'Hardcover'], sizes: ['Standard'], rating: 4.7, numReviews: 289, isFeatured: true, tags: ['book', 'programming'], specifications: [{ key: 'Pages', value: '612' }, { key: 'Edition', value: '3rd 2026' }] },
  { name: 'Atomic Habits – Expanded Edition', slug: 'atomic-habits-expanded-edition', brand: 'LifePublish', category: cm.books, description: '#1 Bestseller with 50+ new habit-building strategies. Updated 2026 edition.', price: 29.99, discountPrice: 22.99, discountPercentage: 23, countInStock: 350, images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80'], colors: ['Paperback', 'Hardcover'], sizes: ['Standard'], rating: 4.9, numReviews: 2341, isBestSeller: true, tags: ['book', 'self-help', 'habits'], specifications: [{ key: 'Pages', value: '368' }, { key: 'Author', value: 'James Clear' }] },
];

const couponsData = [
  { code: 'WELCOME20', discountType: 'percentage', discountValue: 20, minOrderValue: 50, maxDiscount: 100, expiryDate: new Date(Date.now() + 30 * 86400000), usageLimit: 500 },
  { code: 'SAVE50', discountType: 'fixed', discountValue: 50, minOrderValue: 200, maxDiscount: 50, expiryDate: new Date(Date.now() + 15 * 86400000), usageLimit: 100 },
  { code: 'FLASH15', discountType: 'percentage', discountValue: 15, minOrderValue: 0, maxDiscount: 75, expiryDate: new Date(Date.now() + 7 * 86400000), usageLimit: 200 },
];

// ─── Auto-seed function ────────────────────────────────────────────────────────
const autoSeed = async () => {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    console.log(`[Seed] Database already seeded (admin: ${existingAdmin.email}). Skipping.`);
    return;
  }

  console.log('[Seed] Fresh database detected — seeding sample data…');

  // Admin user
  const admin = await User.create({ name: 'Admin User', email: 'admin@shopflow.com', password: 'Admin@1234', role: 'admin', phone: '+1-555-0100', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', isEmailVerified: true });

  // Customer users
  const customers = await User.create([
    { name: 'Alice Johnson', email: 'alice@example.com', password: 'Customer@123', phone: '+1-555-0201', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=400&q=80' },
    { name: 'Bob Martinez', email: 'bob@example.com', password: 'Customer@123', phone: '+1-555-0202', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
    { name: 'Carol Williams', email: 'carol@example.com', password: 'Customer@123', phone: '+1-555-0203', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80' },
  ]);

  // Categories
  const createdCats = await Category.create(categoriesData);
  const cm = {};
  createdCats.forEach(c => { cm[c.slug] = c._id; });

  // Products
  const productsData = getProductsData(cm);
  const products = await Product.create(productsData);

  // Coupons
  await Coupon.create(couponsData);

  // Sample paid orders
  const p0 = products[0]; const p1 = products[1];
  await Order.create([
    { user: customers[0]._id, orderItems: [{ product: p0._id, name: p0.name, image: p0.images[0], price: p0.discountPrice || p0.price, quantity: 1, color: 'Space Gray', size: 'Standard' }], shippingAddress: { fullName: 'Alice Johnson', phone: '+1-555-0201', addressLine1: '123 Main St', city: 'New York', state: 'NY', postalCode: '10001', country: 'USA' }, paymentMethod: 'Card', paymentResult: { id: 'pi_seed_001', status: 'COMPLETED', update_time: new Date().toISOString() }, itemsPrice: p0.discountPrice || p0.price, shippingPrice: 0, taxPrice: 87.99, discountPrice: 0, totalPrice: ((p0.discountPrice || p0.price) + 87.99), isPaid: true, paidAt: new Date(), status: 'Delivered', isDelivered: true, deliveredAt: new Date(), trackingNumber: 'TRK-20241001' },
    { user: customers[1]._id, orderItems: [{ product: p1._id, name: p1.name, image: p1.images[0], price: p1.discountPrice || p1.price, quantity: 2, color: 'Matte Black', size: 'Standard' }], shippingAddress: { fullName: 'Bob Martinez', phone: '+1-555-0202', addressLine1: '456 Oak Ave', city: 'Los Angeles', state: 'CA', postalCode: '90001', country: 'USA' }, paymentMethod: 'Card', paymentResult: { id: 'pi_seed_002', status: 'COMPLETED', update_time: new Date().toISOString() }, itemsPrice: (p1.discountPrice || p1.price) * 2, shippingPrice: 0, taxPrice: 39.99, discountPrice: 0, totalPrice: ((p1.discountPrice || p1.price) * 2 + 39.99), isPaid: true, paidAt: new Date(), status: 'Shipped', isDelivered: false, trackingNumber: 'TRK-20241002' },
    { user: customers[2]._id, orderItems: [{ product: products[3]._id, name: products[3].name, image: products[3].images[0], price: products[3].discountPrice || products[3].price, quantity: 1, color: 'Forest Green', size: 'M' }], shippingAddress: { fullName: 'Carol Williams', phone: '+1-555-0203', addressLine1: '789 Pine Dr', city: 'Chicago', state: 'IL', postalCode: '60601', country: 'USA' }, paymentMethod: 'COD', paymentResult: { id: 'pi_seed_003', status: 'PENDING' }, itemsPrice: products[3].discountPrice || products[3].price, shippingPrice: 9.99, taxPrice: 15.19, discountPrice: 0, totalPrice: ((products[3].discountPrice || products[3].price) + 9.99 + 15.19), isPaid: false, status: 'Confirmed', trackingNumber: 'TRK-20241003' },
  ]);

  // Reviews (only for users with paid orders)
  await Review.create([
    { user: customers[0]._id, product: p0._id, rating: 5, title: 'Exceptional laptop!', comment: 'Absolutely love this laptop. Blazing fast and the display is stunning. Worth every penny.', verifiedPurchase: true },
    { user: customers[1]._id, product: p1._id, rating: 5, title: "Best headphones I've owned", comment: 'The ANC is incredible. Bought 2 pairs for me and my partner. Crystal clear audio.', verifiedPurchase: true },
  ]);

  console.log('[Seed] ✅ Database seeded successfully!');
  console.log('[Seed]    Admin    : admin@shopflow.com / Admin@1234');
  console.log('[Seed]    Customer : alice@example.com / Customer@123');
};

// ─── Server startup ────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  await autoSeed(); // auto-seed if fresh DB

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 ShopFlow API running on port ${PORT}`);
    console.log(`   Mode   : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health : http://localhost:${PORT}/api/health`);
    console.log(`   Admin  : http://localhost:5174\n`);
  });

  const gracefulShutdown = (signal) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      const { disconnectDB } = require('./config/db');
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    console.error('[Server] Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
};

startServer();
