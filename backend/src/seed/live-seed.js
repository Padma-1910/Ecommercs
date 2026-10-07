/**
 * Live API seeder — seeds data into the running backend server via REST API.
 * Run: node src/seed/live-seed.js
 */
const http = require('http');

const BASE = 'http://localhost:5000/api';

const request = (method, path, body, token) => new Promise((resolve, reject) => {
  const bodyStr = body ? JSON.stringify(body) : '';
  const url = new URL(BASE + path);
  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname + url.search,
    method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
      catch { resolve({ status: res.statusCode, data }); }
    });
  });
  req.on('error', reject);
  req.write(bodyStr);
  req.end();
});

async function seed() {
  console.log('🌱 Live-seeding via REST API...\n');

  // 1. Register admin
  console.log('Creating admin account...');
  let adminToken;
  try {
    const r = await request('POST', '/auth/register', { name: 'Admin User', email: 'admin@shopflow.com', password: 'Admin@1234', phone: '+1-555-0100' });
    if (r.data.token) {
      adminToken = r.data.token;
      // Manually set admin role would require DB access; use env-seeded admin
      console.log('  ✅ Admin registered (role upgrade needs db access — use npm run seed for full setup)');
    } else {
      // Try login
      const lr = await request('POST', '/auth/login', { email: 'admin@shopflow.com', password: 'Admin@1234' });
      adminToken = lr.data.token;
      console.log('  ✅ Admin login successful');
    }
  } catch (e) { console.log('  ⚠️  Admin auth issue:', e.message); }

  if (!adminToken) { console.log('❌ Cannot continue without admin token. Run npm run seed first.'); return; }

  // 2. Create categories
  console.log('\nCreating categories...');
  const categories = [
    { name: 'Electronics', description: 'Latest gadgets', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80' },
    { name: 'Fashion', description: 'Trendy clothing', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80' },
    { name: 'Home & Living', description: 'Home and lifestyle', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' },
    { name: 'Sports', description: 'Sports gear', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80' },
    { name: 'Beauty', description: 'Skincare and beauty', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80' },
    { name: 'Books', description: 'Books and learning', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80' },
  ];

  const categoryIds = {};
  for (const cat of categories) {
    const r = await request('POST', '/categories', cat, adminToken);
    if (r.data.category) {
      categoryIds[cat.name.toLowerCase().replace(/[^a-z]/g, '-').replace(/-+/g, '-')] = r.data.category._id;
      console.log(`  ✅ ${cat.name}`);
    } else {
      // Already exists — fetch it
      const lr = await request('GET', '/categories', null, adminToken);
      (lr.data.categories || []).forEach(c => {
        categoryIds[c.slug] = c._id;
      });
    }
  }

  // Fetch all categories to get IDs
  const catRes = await request('GET', '/categories', null, adminToken);
  (catRes.data.categories || []).forEach(c => { categoryIds[c.slug] = c._id; });
  console.log('  📦 Category IDs loaded:', Object.keys(categoryIds).join(', '));

  // 3. Create sample products
  console.log('\nCreating products...');
  const products = [
    { name: 'ProBook Ultra X1 Laptop', brand: 'TechCore', category: categoryIds['electronics'], price: 1299.99, discountPrice: 1099.99, countInStock: 24, description: 'Blazing-fast 15" laptop with 4K OLED display.', images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80'], isFeatured: true, isBestSeller: true },
    { name: 'SoundBlast ANC Headphones', brand: 'Audiox', category: categoryIds['electronics'], price: 349.99, discountPrice: 249.99, countInStock: 52, description: 'Premium wireless headphones with ANC.', images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'], isFlashSale: true },
    { name: 'SmartWatch Series 10', brand: 'Chrono+', category: categoryIds['electronics'], price: 499.99, discountPrice: 399.99, countInStock: 68, description: 'Advanced smartwatch with health monitoring.', images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'], isFeatured: true, isBestSeller: true },
    { name: 'Alpine Trek Jacket', brand: 'PeakWear', category: categoryIds['fashion'], price: 249.99, discountPrice: 189.99, countInStock: 44, description: 'Lightweight waterproof jacket for outdoor adventures.', images: ['https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80'], isBestSeller: true },
    { name: 'Classic Runner Sneakers', brand: 'StridePro', category: categoryIds['fashion'], price: 129.99, discountPrice: 99.99, countInStock: 110, description: 'Iconic low-top sneakers with responsive foam.', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'], isBestSeller: true, isFlashSale: true },
    { name: 'Nordic Coffee Table', brand: 'WoodCraft', category: categoryIds['home-living'], price: 329.99, countInStock: 15, description: 'Minimalist Scandinavian coffee table in solid oak.', images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'], isFeatured: true },
    { name: 'BrewMaster Coffee Kit', brand: 'CafeCraft', category: categoryIds['home-living'], price: 89.99, discountPrice: 74.99, countInStock: 47, description: 'Complete pour-over coffee kit.', images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80'], isFeatured: true, isBestSeller: true },
    { name: 'PowerLift Adjustable Dumbbells', brand: 'FitForge', category: categoryIds['sports'], price: 549.99, discountPrice: 449.99, countInStock: 21, description: 'Adjustable dumbbells replacing 15 weight pairs.', images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80'], isFeatured: true, isBestSeller: true },
    { name: 'AeroFlex Yoga Mat', brand: 'ZenFit', category: categoryIds['sports'], price: 79.99, discountPrice: 59.99, countInStock: 83, description: 'Extra-wide premium TPE yoga mat.', images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'], isFlashSale: true },
    { name: 'GlowRx Vitamin C Serum', brand: 'DermLux', category: categoryIds['beauty'], price: 69.99, discountPrice: 54.99, countInStock: 124, description: '20% stabilized Vitamin C serum.', images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80'], isFeatured: true, isBestSeller: true, isFlashSale: true },
    { name: 'Atomic Habits Expanded', brand: 'LifePublish', category: categoryIds['books'], price: 29.99, discountPrice: 22.99, countInStock: 350, description: 'Updated bestseller on habit building.', images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80'], isBestSeller: true },
    { name: 'Full Stack Developer Blueprint', brand: 'TechPress', category: categoryIds['books'], price: 49.99, discountPrice: 34.99, countInStock: 200, description: 'Comprehensive guide to modern full-stack development.', images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80'], isFeatured: true },
  ];

  for (const p of products) {
    if (!p.category) { console.log(`  ⚠️  Skipping ${p.name} - missing category`); continue; }
    const r = await request('POST', '/products', p, adminToken);
    if (r.data.product) console.log(`  ✅ ${p.name}`);
    else console.log(`  ⚠️  ${p.name}: ${r.data.message || 'already exists'}`);
  }

  // 4. Create coupons
  console.log('\nCreating coupons...');
  const coupons = [
    { code: 'WELCOME20', discountType: 'percentage', discountValue: 20, minOrderValue: 50, maxDiscount: 100, expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(), usageLimit: 500 },
    { code: 'SAVE50', discountType: 'fixed', discountValue: 50, minOrderValue: 200, maxDiscount: 50, expiryDate: new Date(Date.now() + 15*24*60*60*1000).toISOString(), usageLimit: 100 },
    { code: 'FLASH15', discountType: 'percentage', discountValue: 15, minOrderValue: 0, maxDiscount: 75, expiryDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(), usageLimit: 200 },
  ];
  for (const c of coupons) {
    const r = await request('POST', '/coupons', c, adminToken);
    console.log(r.data.coupon ? `  ✅ ${c.code}` : `  ⚠️  ${c.code}: ${r.data.message}`);
  }

  console.log('\n🎉 Live seed complete!');
  console.log('   Admin: admin@shopflow.com / Admin@1234');
}

seed().catch(console.error);
