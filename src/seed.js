const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load .env from the parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Verify MongoDB URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  console.error('Please make sure .env file exists in:', path.join(__dirname, '..', '.env'));
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('MongoDB URI:', process.env.MONGODB_URI.substring(0, 50) + '...');

const User = require('./models/User');
const Product = require('./models/Product');
const ServiceItem = require('./models/ServiceItem');
const Coupon = require('./models/Coupon');
const Order = require('./models/Order');
const Cart = require('./models/Cart');

// Updated products - REMOVED Steam Pressing
const products = [
  {
    name: 'Laundry Services (Wash & Press)',
    slug: 'professional-laundry-services-in-dubai',
    description: 'Professional wash and press for all your clothing needs. We use eco-friendly detergents and modern equipment to ensure your clothes come out fresh, clean, and perfectly pressed.',
    price: 0,
    category: 'laundry',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 1,
    features: ['Eco-friendly detergents', 'Temperature controlled washing', 'Professional pressing', 'Free pickup & delivery'],
    icon: 'washing-machine',
  },
  {
    name: 'Dry Cleaning Services',
    slug: 'dry-cleaning-services-in-dubai',
    description: 'Expert dry cleaning for delicate and formal garments. Perfect for suits, dresses, and fabrics that require special care.',
    price: 0,
    category: 'dry-cleaning',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 2,
    features: ['Gentle on fabrics', 'Stain removal expertise', 'Preserves color and texture', 'Suitable for all formal wear'],
    icon: 'dry-clean',
  },
  {
    name: 'Shoe Cleaning & Spa',
    slug: 'shoe-and-bag-spa-services-in-dubai',
    description: 'Professional shoe cleaning, restoration, and spa treatment. From sneakers to leather shoes, we make them look like new.',
    price: 0,
    category: 'shoe-cleaning',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 3,
    features: ['Deep cleaning', 'Odor removal', 'Leather conditioning', 'Scuff repair', 'Waterproofing treatment'],
    icon: 'shoe',
  },
  {
    name: 'Carpet Cleaning',
    slug: 'carpet-cleaning-services-in-dubai',
    description: 'Professional carpet and rug cleaning services. Steam cleaning, stain removal, and deep sanitization for all carpet types.',
    price: 0,
    category: 'carpet-cleaning',
    isActive: true,
    isFeatured: false,
    turnaround: '48-72 hours',
    sortOrder: 4,
    features: ['Steam cleaning', 'Stain removal', 'Allergy treatment', 'Quick drying', 'Pet stain specialist'],
    icon: 'carpet',
  },
  {
    name: 'Curtain Cleaning',
    slug: 'curtain-cleaning-services-in-dubai',
    description: 'Expert curtain and drapery cleaning. We handle all fabrics including silk, velvet, and blackout curtains.',
    price: 0,
    category: 'curtain-cleaning',
    isActive: true,
    isFeatured: false,
    turnaround: '48-72 hours',
    sortOrder: 5,
    features: ['Gentle hand wash available', 'No shrinkage guarantee', 'Hardware preservation', 'Rehang service'],
    icon: 'curtains',
  },
  {
    name: 'Commercial Laundry',
    slug: 'commercial-laundry-services-in-dubai',
    description: 'Bulk laundry services for hotels, restaurants, salons, and businesses. Reliable, fast, and cost-effective.',
    price: 0,
    category: 'commercial',
    isActive: true,
    isFeatured: false,
    turnaround: '24-48 hours',
    sortOrder: 6,
    features: ['Bulk discounts', 'Scheduled pickup', 'Custom packaging', 'Quality assurance'],
    icon: 'commercial',
  },
  {
    name: 'Apparel Care',
    slug: 'apparel-care-services-in-dubai',
    description: 'Special care for designer and luxury apparel. Hand wash, gentle dry cleaning, and expert preservation.',
    price: 0,
    category: 'apparel',
    isActive: true,
    isFeatured: false,
    turnaround: '24-48 hours',
    sortOrder: 7,
    features: ['Hand wash option', 'Silk & wool specialist', 'Designer garment care', 'Stain protection'],
    icon: 'fashion',
  },
  {
    name: 'Uniform Services',
    slug: 'uniform-laundry-services-in-dubai',
    description: 'Professional uniform cleaning for corporate staff, medical professionals, and hospitality teams.',
    price: 0,
    category: 'uniform',
    isActive: true,
    isFeatured: false,
    turnaround: '24 hours',
    sortOrder: 8,
    features: ['Name tagging available', 'Same day service option', 'Bulk pricing', 'Weekly subscription'],
    icon: 'uniform',
  },
  {
    name: 'Accessories Cleaning',
    slug: 'accessories-cleaning-services-in-dubai',
    description: 'Clean hats, bags, ties, belts, and other accessories. Specialized care for every item type.',
    price: 0,
    category: 'accessories',
    isActive: true,
    isFeatured: false,
    turnaround: '24-48 hours',
    sortOrder: 9,
    features: ['Hand cleaning', 'Shape preservation', 'Material specific care', 'Restoration available'],
    icon: 'accessories',
  },
];

// Updated service items - REMOVED Steam Pressing related items
const serviceItems = [
  // Men items for Laundry
  { name: 'T-shirts / Polo Shirts', category: 'men', price: 8, unit: 'Per Item', sortOrder: 0 },
  { name: 'Formal Shirts', category: 'men', price: 10, unit: 'Per Item', sortOrder: 1 },
  { name: 'Trousers / Pants', category: 'men', price: 12, unit: 'Per Item', sortOrder: 2 },
  { name: 'Jeans', category: 'men', price: 15, unit: 'Per Item', sortOrder: 3 },
  { name: 'Kandora / Dishdasha', category: 'men', price: 18, unit: 'Per Item', sortOrder: 4 },
  { name: 'Ghitra / Gutra', category: 'men', price: 10, unit: 'Per Item', sortOrder: 5 },
  { name: 'Suit (2 piece)', category: 'men', price: 45, unit: 'Per Set', sortOrder: 6 },
  { name: 'Blazer / Sport Coat', category: 'men', price: 25, unit: 'Per Item', sortOrder: 7 },
  { name: 'Sweater / Jumper', category: 'men', price: 18, unit: 'Per Item', sortOrder: 8 },
  { name: 'Shorts', category: 'men', price: 8, unit: 'Per Item', sortOrder: 9 },
  { name: 'Underwear (per piece)', category: 'men', price: 5, unit: 'Per Item', sortOrder: 10 },
  { name: 'Socks (per pair)', category: 'men', price: 4, unit: 'Per Pair', sortOrder: 11 },

  // Women items for Laundry
  { name: 'T-shirts / Blouses', category: 'women', price: 8, unit: 'Per Item', sortOrder: 0 },
  { name: 'Trousers / Pants', category: 'women', price: 12, unit: 'Per Item', sortOrder: 1 },
  { name: 'Jeans', category: 'women', price: 15, unit: 'Per Item', sortOrder: 2 },
  { name: 'Abaya', category: 'women', price: 25, unit: 'Per Item', sortOrder: 3 },
  { name: 'Scarf / Shayla', category: 'women', price: 8, unit: 'Per Item', sortOrder: 4 },
  { name: 'Casual Dress', category: 'women', price: 20, unit: 'Per Item', sortOrder: 5 },
  { name: 'Formal Dress / Gown', category: 'women', price: 35, unit: 'Per Item', sortOrder: 6 },
  { name: 'Skirt', category: 'women', price: 10, unit: 'Per Item', sortOrder: 7 },
  { name: 'Saree', category: 'women', price: 40, unit: 'Per Item', sortOrder: 8 },
  { name: 'Lehenga / Choli', category: 'women', price: 50, unit: 'Per Set', sortOrder: 9 },
  { name: 'Salwar Kameez', category: 'women', price: 25, unit: 'Per Set', sortOrder: 10 },
  { name: 'Hijab', category: 'women', price: 6, unit: 'Per Item', sortOrder: 11 },

  // Children items for Laundry
  { name: 'T-shirts / Shirts', category: 'children', price: 6, unit: 'Per Item', sortOrder: 0 },
  { name: 'Trousers / Pants', category: 'children', price: 6, unit: 'Per Item', sortOrder: 1 },
  { name: 'Jeans', category: 'children', price: 8, unit: 'Per Item', sortOrder: 2 },
  { name: 'Dress (Girls)', category: 'children', price: 10, unit: 'Per Item', sortOrder: 3 },
  { name: 'School Uniform', category: 'children', price: 8, unit: 'Per Item', sortOrder: 4 },
  { name: 'Shorts', category: 'children', price: 5, unit: 'Per Item', sortOrder: 5 },
  { name: 'Baby Onesie', category: 'children', price: 4, unit: 'Per Item', sortOrder: 6 },

  // Household items
  { name: 'Bed Sheet (Single)', category: 'household', price: 15, unit: 'Per Item', sortOrder: 0 },
  { name: 'Bed Sheet (Double)', category: 'household', price: 20, unit: 'Per Item', sortOrder: 1 },
  { name: 'Bed Sheet (King)', category: 'household', price: 25, unit: 'Per Item', sortOrder: 2 },
  { name: 'Pillow Cover', category: 'household', price: 6, unit: 'Per Pair', sortOrder: 3 },
  { name: 'Duvet / Comforter', category: 'household', price: 45, unit: 'Per Item', sortOrder: 4 },
  { name: 'Towel (Bath)', category: 'household', price: 8, unit: 'Per Item', sortOrder: 5 },
  { name: 'Towel (Hand)', category: 'household', price: 5, unit: 'Per Item', sortOrder: 6 },
  { name: 'Bath Mat', category: 'household', price: 10, unit: 'Per Item', sortOrder: 7 },
  { name: 'Table Cloth', category: 'household', price: 12, unit: 'Per Item', sortOrder: 8 },
  { name: 'Napkins (set of 4)', category: 'household', price: 8, unit: 'Per Set', sortOrder: 9 },
  { name: 'Blanket', category: 'household', price: 35, unit: 'Per Item', sortOrder: 10 },
  { name: 'Curtain (per panel)', category: 'household', price: 30, unit: 'Per Panel', sortOrder: 11 },
];

// Updated coupons - More attractive offers
const coupons = [
  {
    code: 'WELCOME10',
    description: '10% off on your first order',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 50,
    minPurchase: 50,
    validFrom: new Date(),
    validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    isActive: true,
    usageLimit: 1000,
    usageLimitPerUser: 1,
  },
  {
    code: 'FIRST20',
    description: 'AED 20 off on first order above AED 100',
    discountType: 'fixed',
    discountValue: 20,
    minPurchase: 100,
    validFrom: new Date(),
    validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    isActive: true,
    usageLimit: 500,
    usageLimitPerUser: 1,
  },
  {
    code: 'LAUNDRICA30',
    description: '30% off on all services (max AED 100 off)',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscount: 100,
    minPurchase: 150,
    validFrom: new Date(),
    validTo: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    isActive: true,
    usageLimit: 200,
    usageLimitPerUser: 1,
  },
  {
    code: 'SUMMER25',
    description: 'AED 25 off on orders above AED 75',
    discountType: 'fixed',
    discountValue: 25,
    minPurchase: 75,
    validFrom: new Date(),
    validTo: new Date(new Date().setMonth(new Date().getMonth() + 2)),
    isActive: true,
    usageLimit: 300,
    usageLimitPerUser: 2,
  },
  {
    code: 'BULK15',
    description: '15% off on bulk orders above AED 200 (max AED 150 off)',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 150,
    minPurchase: 200,
    validFrom: new Date(),
    validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    isActive: true,
    usageLimit: 100,
    usageLimitPerUser: 2,
  },
  {
    code: 'FREEDELIVERY',
    description: 'Free delivery on orders above AED 100',
    discountType: 'fixed',
    discountValue: 15,
    minPurchase: 100,
    validFrom: new Date(),
    validTo: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    isActive: true,
    usageLimit: 500,
    usageLimitPerUser: 3,
  },
  {
    code: 'WEEKEND20',
    description: '20% off weekend special',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 75,
    minPurchase: 80,
    validFrom: new Date(),
    validTo: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    isActive: true,
    usageLimit: 250,
    usageLimitPerUser: 1,
  },
];

// Sample orders for testing
const sampleOrders = [
  {
    sessionId: uuidv4(),
    items: [
      { name: 'T-shirts / Polo Shirts', price: 8, quantity: 3, category: 'men' },
      { name: 'Jeans', price: 15, quantity: 2, category: 'men' },
    ],
    subtotal: 54,
    deliveryFee: 0,
    tax: 2.7,
    total: 56.7,
    customerInfo: {
      name: 'Ahmed Hassan',
      phone: '+97150123456',
      email: 'ahmed@example.com',
      address: 'Dubai Marina, JBR, Dubai',
      city: 'Dubai',
      notes: 'Please call before delivery',
    },
    status: 'completed',
    whatsappSent: true,
    zohoSynced: false,
  },
  {
    sessionId: uuidv4(),
    items: [
      { name: 'Abaya', price: 25, quantity: 1, category: 'women' },
      { name: 'Scarf / Shayla', price: 8, quantity: 2, category: 'women' },
      { name: 'Formal Dress', price: 35, quantity: 1, category: 'women' },
    ],
    subtotal: 76,
    deliveryFee: 0,
    tax: 3.8,
    total: 79.8,
    customerInfo: {
      name: 'Fatima Ahmed',
      phone: '+97150123457',
      email: 'fatima@example.com',
      address: 'Jumeirah Beach Road, Villa 45, Dubai',
      city: 'Dubai',
      notes: 'Deliver after 5 PM',
    },
    status: 'processing',
    whatsappSent: true,
    zohoSynced: false,
  },
  {
    sessionId: uuidv4(),
    items: [
      { name: 'School Uniform', price: 8, quantity: 4, category: 'children' },
      { name: 'Bed Sheet (King)', price: 25, quantity: 2, category: 'household' },
    ],
    subtotal: 82,
    deliveryFee: 0,
    tax: 4.1,
    total: 86.1,
    customerInfo: {
      name: 'Mohammed Al Maktoum',
      phone: '+97150123458',
      email: 'mohammed@example.com',
      address: 'Emirates Hills, Dubai',
      city: 'Dubai',
      notes: '',
    },
    status: 'pending',
    whatsappSent: false,
    zohoSynced: false,
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await ServiceItem.deleteMany();
    await Coupon.deleteMany();
    await Order.deleteMany();
    await Cart.deleteMany();
    console.log('🗑️ Cleared existing data');

    // ========== CREATE USERS (Optional - for future admin if needed) ==========
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const admin = await User.create({
      name: 'Laundrica Admin',
      email: 'admin@laundrica.com',
      password: adminPassword,
      phone: '+971501234567',
      role: 'admin',
      isActive: true,
      address: {
        street: 'Business Bay',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '00000',
        country: 'UAE',
      },
    });
    console.log('✅ Admin user created (optional):', admin.email);

    // ========== CREATE PRODUCTS ==========
    const createdProducts = [];
    for (const product of products) {
      const created = await Product.create(product);
      createdProducts.push(created);
      console.log(`   📦 Product: ${product.name}`);
    }
    console.log(`✅ Products created: ${createdProducts.length}`);

    // ========== CREATE SERVICE ITEMS ==========
    // Associate service items with the Laundry service
    const laundryService = createdProducts.find(p => p.category === 'laundry');
    if (laundryService) {
      for (const item of serviceItems) {
        await ServiceItem.create({
          ...item,
          serviceId: laundryService._id,
        });
      }
      console.log(`✅ Service items created: ${serviceItems.length} items for ${laundryService.name}`);
    }

    // ========== CREATE COUPONS ==========
    for (const coupon of coupons) {
      await Coupon.create(coupon);
    }
    console.log(`✅ Coupons created: ${coupons.length}`);

    // ========== CREATE SAMPLE ORDERS ==========
    for (const orderData of sampleOrders) {
      // Generate order number
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const orderCount = await Order.countDocuments();
      const orderNumber = `ORD-${year}${month}-${(orderCount + 1).toString().padStart(5, '0')}`;

      await Order.create({
        ...orderData,
        orderNumber,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
      });
    }
    console.log(`✅ Sample orders created: ${sampleOrders.length}`);

    // ========== PRINT SUMMARY ==========
    console.log('\n' + '='.repeat(50));
    console.log('🎉 DATABASE SEEDING COMPLETED!');
    console.log('='.repeat(50));

    console.log('\n📊 SUMMARY:');
    console.log(`   👤 Admin User: 1`);
    console.log(`   📦 Products: ${createdProducts.length}`);
    console.log(`   🧺 Service Items: ${serviceItems.length}`);
    console.log(`   🎫 Coupons: ${coupons.length}`);
    console.log(`   📝 Orders: ${sampleOrders.length}`);

    console.log('\n🔑 ADMIN LOGIN (if using admin panel later):');
    console.log(`   Email: admin@laundrica.com`);
    console.log(`   Password: Admin@123`);

    console.log('\n🎟️ ACTIVE COUPONS:');
    coupons.forEach(coupon => {
      console.log(`   • ${coupon.code} - ${coupon.description}`);
    });

    console.log('\n🛍️ SERVICES AVAILABLE:');
    products.forEach(product => {
      console.log(`   • ${product.name} (${product.turnaround})`);
    });

    console.log('\n📞 WHATSAPP BUSINESS NUMBER:');
    console.log(`   ${process.env.WHATSAPP_BUSINESS_NUMBER || '971501234567'}`);
    console.log(`   (Set in .env file)`);

    console.log('\n🔗 API ENDPOINTS:');
    console.log(`   POST   /api/orders          - Create order`);
    console.log(`   GET    /api/orders/track/:id - Track order`);
    console.log(`   GET    /api/products        - Get all products`);
    console.log(`   GET    /api/services        - Get all services`);
    console.log(`   POST   /api/cart/:sessionId/add - Add to cart`);
    console.log(`   GET    /api/cart/:sessionId    - Get cart`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Seeding complete! Server is ready.');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();