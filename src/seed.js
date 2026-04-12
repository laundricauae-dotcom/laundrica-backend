const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from the parent directory (where it actually exists)
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

const products = [
  {
    name: 'Laundry Services (Wash & Press)',
    slug: 'professional-laundry-services-in-dubai',
    description: 'Professional wash and press for all your clothing needs.',
    price: 0,
    category: 'laundry',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 1,
  },
  {
    name: 'Dry Cleaning Services',
    slug: 'dry-cleaning-services-in-dubai',
    description: 'Expert dry cleaning for delicate and formal garments.',
    price: 0,
    category: 'dry-cleaning',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 2,
  },
  {
    name: 'Steam Pressing Service',
    slug: 'steam-pressing-services-in-dubai',
    description: 'Professional steam pressing for wrinkle-free clothes.',
    price: 0,
    category: 'steam-pressing',
    isActive: true,
    isFeatured: true,
    turnaround: '24 hours',
    sortOrder: 3,
  },
  {
    name: 'Shoe Cleaning',
    slug: 'shoe-and-bag-spa-services-in-dubai',
    description: 'Professional shoe cleaning and restoration.',
    price: 0,
    category: 'shoe-cleaning',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 4,
  },
  {
    name: 'Carpet Cleaning',
    slug: 'carpet-cleaning-services-in-dubai',
    description: 'Professional carpet and rug cleaning services.',
    price: 0,
    category: 'carpet-cleaning',
    isActive: true,
    isFeatured: false,
    turnaround: '48-72 hours',
    sortOrder: 5,
  },
  {
    name: 'Curtain Cleaning',
    slug: 'curtain-cleaning-services-in-dubai',
    description: 'Expert curtain and drapery cleaning.',
    price: 0,
    category: 'curtain-cleaning',
    isActive: true,
    isFeatured: false,
    turnaround: '48-72 hours',
    sortOrder: 6,
  },
  {
    name: 'Commercial Laundry',
    slug: 'commercial-laundry-services-in-dubai',
    description: 'Bulk laundry services for businesses.',
    price: 0,
    category: 'commercial',
    isActive: true,
    isFeatured: false,
    turnaround: '24-48 hours',
    sortOrder: 7,
  },
  {
    name: 'Apparel Care',
    slug: 'apparel-care-services-in-dubai',
    description: 'Special care for designer and luxury apparel.',
    price: 0,
    category: 'apparel',
    isActive: true,
    isFeatured: false,
    turnaround: '24-48 hours',
    sortOrder: 8,
  },
  {
    name: 'Uniform Services',
    slug: 'uniform-laundry-services-in-dubai',
    description: 'Professional uniform cleaning for staff.',
    price: 0,
    category: 'uniform',
    isActive: true,
    isFeatured: false,
    turnaround: '24 hours',
    sortOrder: 9,
  },
  {
    name: 'Accessories Cleaning',
    slug: 'accessories-cleaning-services-in-dubai',
    description: 'Clean hats, bags, ties, and other accessories.',
    price: 0,
    category: 'accessories',
    isActive: true,
    isFeatured: false,
    turnaround: '24-48 hours',
    sortOrder: 10,
  },
];

const serviceItems = [
  // Men items for Laundry
  { name: 'T-shirts/Shirts', category: 'men', price: 6, unit: 'Per Item', sortOrder: 0 },
  { name: 'Trouser', category: 'men', price: 6, unit: 'Per Item', sortOrder: 1 },
  { name: 'Jeans', category: 'men', price: 8, unit: 'Per Item', sortOrder: 2 },
  { name: 'Kandora', category: 'men', price: 10, unit: 'Per Item', sortOrder: 3 },
  { name: 'Ghatra', category: 'men', price: 8, unit: 'Per Item', sortOrder: 4 },
  { name: 'Suit (2 piece)', category: 'men', price: 25, unit: 'Per Set', sortOrder: 5 },
  { name: 'Blazer', category: 'men', price: 15, unit: 'Per Item', sortOrder: 6 },
  { name: 'Sweater/Jumper', category: 'men', price: 10, unit: 'Per Item', sortOrder: 7 },
  { name: 'Shorts', category: 'men', price: 5, unit: 'Per Item', sortOrder: 8 },
  { name: 'Underwear', category: 'men', price: 3, unit: 'Per Item', sortOrder: 9 },
  
  // Women items for Laundry
  { name: 'T-shirts/Shirts', category: 'women', price: 6, unit: 'Per Item', sortOrder: 0 },
  { name: 'Trouser', category: 'women', price: 6, unit: 'Per Item', sortOrder: 1 },
  { name: 'Jeans', category: 'women', price: 8, unit: 'Per Item', sortOrder: 2 },
  { name: 'Abbaya/Burqah', category: 'women', price: 10, unit: 'Per Item', sortOrder: 3 },
  { name: 'Scarf/Dupatta', category: 'women', price: 6, unit: 'Per Item', sortOrder: 4 },
  { name: 'Dress (Casual)', category: 'women', price: 12, unit: 'Per Item', sortOrder: 5 },
  { name: 'Dress (Formal)', category: 'women', price: 15, unit: 'Per Item', sortOrder: 6 },
  { name: 'Skirt', category: 'women', price: 6, unit: 'Per Item', sortOrder: 7 },
  { name: 'Blouse', category: 'women', price: 6, unit: 'Per Item', sortOrder: 8 },
  { name: 'Saree', category: 'women', price: 20, unit: 'Per Item', sortOrder: 9 },
  { name: 'Lehenga', category: 'women', price: 25, unit: 'Per Item', sortOrder: 10 },
  
  // Children items for Laundry
  { name: 'T-shirts/Shirts', category: 'children', price: 4, unit: 'Per Item', sortOrder: 0 },
  { name: 'Trouser', category: 'children', price: 4, unit: 'Per Item', sortOrder: 1 },
  { name: 'Jeans', category: 'children', price: 5, unit: 'Per Item', sortOrder: 2 },
  { name: 'Dress', category: 'children', price: 6, unit: 'Per Item', sortOrder: 3 },
  { name: 'School Uniform', category: 'children', price: 5, unit: 'Per Item', sortOrder: 4 },
  { name: 'Shorts', category: 'children', price: 3, unit: 'Per Item', sortOrder: 5 },
  
  // Household items
  { name: 'Bed Sheet (Single)', category: 'household', price: 10, unit: 'Per Item', sortOrder: 0 },
  { name: 'Bed Sheet (Double)', category: 'household', price: 15, unit: 'Per Item', sortOrder: 1 },
  { name: 'Pillow Cover', category: 'household', price: 4, unit: 'Per Pair', sortOrder: 2 },
  { name: 'Duvet Cover', category: 'household', price: 20, unit: 'Per Item', sortOrder: 3 },
  { name: 'Towel Set', category: 'household', price: 12, unit: 'Per Set', sortOrder: 4 },
  { name: 'Bath Mat', category: 'household', price: 6, unit: 'Per Item', sortOrder: 5 },
  { name: 'Table Cloth', category: 'household', price: 8, unit: 'Per Item', sortOrder: 6 },
  { name: 'Napkins', category: 'household', price: 3, unit: 'Per Piece', sortOrder: 7 },
  { name: 'Blanket', category: 'household', price: 25, unit: 'Per Item', sortOrder: 8 },
];

const coupons = [
  {
    code: 'WELCOME10',
    description: '10% off on first order',
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
    code: 'FRESH20',
    description: 'AED 20 off on orders above AED 100',
    discountType: 'fixed',
    discountValue: 20,
    minPurchase: 100,
    validFrom: new Date(),
    validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    isActive: true,
    usageLimit: 500,
    usageLimitPerUser: 2,
  },
  {
    code: 'LAUNDRICA30',
    description: '30% off on all services',
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
    description: '15% off on bulk orders above AED 200',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 150,
    minPurchase: 200,
    validFrom: new Date(),
    validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    isActive: true,
    usageLimit: 100,
    usageLimitPerUser: 3,
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
    console.log('🗑️ Cleared existing data');
    
    // Create Admin User
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@laundrica.com',
      password: adminPassword,
      phone: '+971501234567',
      role: 'admin',
      isActive: true,
      address: {
        street: '123 Business Bay',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '00000',
        country: 'UAE',
      },
    });
    console.log('✅ Admin user created:', admin.email);
    
    // Create Staff User
    const staffPassword = await bcrypt.hash('Staff@123', 12);
    const staff = await User.create({
      name: 'Staff Member',
      email: 'staff@laundrica.com',
      password: staffPassword,
      phone: '+971501234568',
      role: 'staff',
      isActive: true,
      address: {
        street: '456 Staff Area',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '00000',
        country: 'UAE',
      },
    });
    console.log('✅ Staff user created:', staff.email);
    
    // Create Test Customer Users
    const customerPassword = await bcrypt.hash('Customer@123', 12);
    
    const customers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: customerPassword,
        phone: '+971501234569',
        role: 'user',
        isActive: true,
        address: {
          street: '789 Marina View',
          city: 'Dubai',
          state: 'Dubai',
          zipCode: '00000',
          country: 'UAE',
        },
      },
      {
        name: 'Sarah Ahmed',
        email: 'sarah@example.com',
        password: customerPassword,
        phone: '+971501234570',
        role: 'user',
        isActive: true,
        address: {
          street: '321 Jumeirah Beach',
          city: 'Dubai',
          state: 'Dubai',
          zipCode: '00000',
          country: 'UAE',
        },
      },
      {
        name: 'Mohammed Ali',
        email: 'mohammed@example.com',
        password: customerPassword,
        phone: '+971501234571',
        role: 'user',
        isActive: true,
        address: {
          street: '555 Downtown Dubai',
          city: 'Dubai',
          state: 'Dubai',
          zipCode: '00000',
          country: 'UAE',
        },
      },
    ];
    
    for (const customer of customers) {
      await User.create(customer);
    }
    console.log('✅ Test customers created:', customers.length);
    
    // Create products
    const createdProducts = [];
    for (const product of products) {
      const created = await Product.create(product);
      createdProducts.push(created);
    }
    console.log('✅ Products created:', createdProducts.length);
    
    // Create service items for each product
    const laundryService = createdProducts.find(p => p.category === 'laundry');
    if (laundryService) {
      for (const item of serviceItems) {
        await ServiceItem.create({
          ...item,
          serviceId: laundryService._id,
        });
      }
      console.log('✅ Service items created:', serviceItems.length);
    }
    
    // Create coupons
    for (const coupon of coupons) {
      await Coupon.create(coupon);
    }
    console.log('✅ Coupons created:', coupons.length);
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('\n👑 ADMIN ACCESS:');
    console.log('   Email: admin@laundrica.com');
    console.log('   Password: Admin@123');
    console.log('   Role: Admin');
    console.log('\n👔 STAFF ACCESS:');
    console.log('   Email: staff@laundrica.com');
    console.log('   Password: Staff@123');
    console.log('   Role: Staff');
    console.log('\n👤 CUSTOMER ACCESS (for testing):');
    console.log('   Email: john@example.com');
    console.log('   Password: Customer@123');
    console.log('   Email: sarah@example.com');
    console.log('   Password: Customer@123');
    console.log('   Email: mohammed@example.com');
    console.log('   Password: Customer@123');
    console.log('\n🔗 Admin Login URL: http://localhost:3000/admin/login');
    console.log('\n✅ Seeding complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();