const mongoose = require('mongoose');
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

const Product = require('./models/Product');
const ServiceItem = require('./models/ServiceItem');
const Order = require('./models/Order');
const Cart = require('./models/Cart');

// Updated products - using only existing categories from your model
const products = [
  {
    name: 'Wash & Press',
    slug: 'wash-and-press-services-in-dubai',
    description: 'Everyday professional wear handled with precision heat and eco-safe detergents.',
    price: 0,
    category: 'laundry',  // existing category
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 1,
    features: ['Eco-friendly detergents', 'Temperature controlled washing', 'Professional pressing', 'Free pickup & delivery'],
    icon: 'washing-machine',
  },
  {
    name: 'Dry Cleaning',
    slug: 'dry-cleaning-services-in-dubai',
    description: 'Gentle non-solvent cleaning for your most delicate silks, wools, and tailored suits.',
    price: 0,
    category: 'dry-cleaning',  // existing category
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 2,
    features: ['Gentle on fabrics', 'Stain removal expertise', 'Preserves color and texture', 'Suitable for all formal wear'],
    icon: 'dry-clean',
  },
  {
    name: 'Wash & Fold',
    slug: 'wash-and-fold-services-in-dubai',
    description: 'Perfectly folded bulk laundry, saving you hours every week. Ready for the drawer.',
    price: 0,
    category: 'laundry',  // using existing 'laundry' category
    isActive: true,
    isFeatured: true,
    turnaround: '24 hours',
    sortOrder: 3,
    features: ['Perfectly folded', 'Bulk laundry service', 'Ready for drawer', 'Time-saving solution'],
    icon: 'fold',
  },
  {
    name: 'Steam Press',
    slug: 'steam-press-services-in-dubai',
    description: 'Vertical steaming and heavy pressing for items that need that extra crisp finish.',
    price: 0,
    category: 'laundry',  // using existing 'laundry' category
    isActive: true,
    isFeatured: true,
    turnaround: '24 hours',
    sortOrder: 4,
    features: ['Vertical steaming', 'Heavy pressing', 'Crisp finish', 'Wrinkle removal'],
    icon: 'iron',
  },
  {
    name: 'Shoe Care',
    slug: 'shoe-care-services-in-dubai',
    description: 'Deep cleaning and rejuvenation for leather, suede, and designer footwear.',
    price: 0,
    category: 'shoe-cleaning',  // existing category
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 5,
    features: ['Deep cleaning', 'Odor removal', 'Leather conditioning', 'Scuff repair', 'Waterproofing treatment'],
    icon: 'shoe',
  },
  {
    name: 'Carpet Care',
    slug: 'carpet-care-services-in-dubai',
    description: 'Industrial-grade extraction cleaning for rugs and carpets to remove deep-seated allergens.',
    price: 0,
    category: 'carpet-cleaning',  // existing category
    isActive: true,
    isFeatured: true,
    turnaround: '48-72 hours',
    sortOrder: 6,
    features: ['Steam cleaning', 'Stain removal', 'Allergy treatment', 'Quick drying', 'Pet stain specialist'],
    icon: 'carpet',
  },
];

// Service items - keeping exactly as they were
const serviceItems = [
  // Men items
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

  // Women items
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

  // Children items
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

// Sample orders
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
    await Product.deleteMany();
    await ServiceItem.deleteMany();
    await Order.deleteMany();
    await Cart.deleteMany();
    console.log('🗑️ Cleared existing data');

    // ========== CREATE PRODUCTS ==========
    const createdProducts = [];
    for (const product of products) {
      const created = await Product.create(product);
      createdProducts.push(created);
      console.log(`   📦 Product: ${product.name} (${product.category})`);
    }
    console.log(`✅ Products created: ${createdProducts.length}`);

    // ========== CREATE SERVICE ITEMS ==========
    // Associate service items with the Wash & Press service (laundry category)
    const laundryService = createdProducts.find(p => p.name === 'Wash & Press');
    if (laundryService) {
      for (const item of serviceItems) {
        await ServiceItem.create({
          ...item,
          serviceId: laundryService._id,
        });
      }
      console.log(`✅ Service items created: ${serviceItems.length} items for ${laundryService.name}`);
    } else {
      console.log('⚠️ Wash & Press service not found, skipping service items');
    }

    // ========== CREATE SAMPLE ORDERS ==========
    for (const orderData of sampleOrders) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const orderCount = await Order.countDocuments();
      const orderNumber = `ORD-${year}${month}-${(orderCount + 1).toString().padStart(5, '0')}`;

      await Order.create({
        ...orderData,
        orderNumber,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }
    console.log(`✅ Sample orders created: ${sampleOrders.length}`);

    // ========== PRINT SUMMARY ==========
    console.log('\n' + '='.repeat(50));
    console.log('🎉 DATABASE SEEDING COMPLETED!');
    console.log('='.repeat(50));

    console.log('\n📊 SUMMARY:');
    console.log(`   📦 Products: ${createdProducts.length}`);
    console.log(`   🧺 Service Items: ${serviceItems.length}`);
    console.log(`   📝 Orders: ${sampleOrders.length}`);

    console.log('\n🛍️ SERVICES AVAILABLE (Based on your image):');
    products.forEach(product => {
      console.log(`   • ${product.name} (${product.turnaround}) - Category: ${product.category}`);
    });

    console.log('\n🔗 API ENDPOINTS:');
    console.log(`   POST   /api/orders          - Create order`);
    console.log(`   GET    /api/orders/track/:id - Track order`);
    console.log(`   GET    /api/products        - Get all products`);
    console.log(`   GET    /api/services        - Get all services`);
    console.log(`   POST   /api/cart/:sessionId/add - Add to cart`);
    console.log(`   GET    /api/cart/:sessionId    - Get cart`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Seeding complete!');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();