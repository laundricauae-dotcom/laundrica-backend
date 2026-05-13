const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Product = require('./models/Product');
const ServiceItem = require('./models/ServiceItem');
const Order = require('./models/Order');
const Cart = require('./models/Cart');

const products = [
  {
    name: 'Wash & Press',
    slug: 'wash-and-press-services-in-dubai',
    description:
      'Professional laundry cleaning with premium detergents and expert garment care.',
    price: 0,
    category: 'laundry',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBaHDEQVLbQfnwFR9_VyvfLd-ko007XGQDbe8hwTsWY87HzOxSF5OEi1VIUhphuEPzTyIEYGuar_lQbl5IcLFr6Dnz7X7Z7pctJxklYiZfa-c9MxeiY35ivv9-1g0LOse4jxv133UHtIinIC088t7NfjZ_PC9rleHHBGmlsZ69ybT_UKrJ4utQTtvinL1UeEgulkfcg2nUWiJ2DIJYYhlitbNGfkogR5s0XfbMFFqM3gQtqlpbRweKf5r0np3KX1dvRGk_0eUCe4tVi',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 1,
  },

  {
    name: 'Dry Cleaning',
    slug: 'dry-cleaning-services-in-dubai',
    description:
      'Delicate dry cleaning service for suits, silk, gowns, and premium garments.',
    price: 0,
    category: 'dry-cleaning',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCDSmGE2TtzW6YVlJMSyDumNuxjDafzBKzMdR4qG3eqVcTjAah0uNIQZPkLuWeHPHol4b4KvmlsPFC_KN3p7tWQBQ6QwwY9XUZtHuIIRZFMG-vCYoyJ0_b_XudUiAoeNPHtFhFaLpyFciaiUZmTUIz8SpnuLdtIr0RiWN6TrQRdNdIb0l8hb8_Ixsen9jOJTPqkeWMIP7psQVAw1npMZJXsAkH52LwBCa_R3N1DEIzyDhvtApslLYMdiQNPrDDyWg663DoZ--vmdfsf',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 2,
  },

  {
    name: 'Wash & Fold',
    slug: 'wash-and-fold-services-in-dubai',
    description:
      'Bulk laundry washed, dried, and folded perfectly for daily convenience.',
    price: 0,
    category: 'wash-and-fold',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDP4Fl1mcL71ms-0aDco1bos4KJFJEZx5OQnJIOBWlWluJMOTU3XhoRrxAQvDa2yackx6UDbMN2aeY0HX3vJrKxXZZvOxDngQlZRCw6IC4qNlNInPtj13VA8r8kN-3-D0Jxrt44nDI5JAqB96hap1m-Sa8t_3oq6LroL8Ag9vqpd38eVyGtjT49EfXZUUUEmpo9H8CJRr1964I_IjjhCECEuvi3KYyJIWnmLx6Um420B0z6GG4nyB3DmF5ORn7DB6p1qP9FsFWioqH3',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48hours',
    sortOrder: 3,
  },

  {
    name: 'Steam Ironing',
    slug: 'steam-press-services-in-dubai',
    description:
      'Professional steam ironing for wrinkle-free crisp finishing.',
    price: 0,
    category: 'steam-ironing',
    image:
      'https://static.vecteezy.com/system/resources/thumbnails/075/548/139/small/closeup-electric-steam-iron-pressing-blue-shirt-with-powerful-vapor-mist-photo.jpeg',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 4,
  },

  {
    name: 'Shoe Care',
    slug: 'shoe-care-services-in-dubai',
    description:
      'Deep cleaning and restoration for sneakers, leather shoes, and luxury footwear.',
    price: 0,
    category: 'shoe-cleaning',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAyptsqgZUbgwL6Bq4bEsstny-6nDqBiqN5cBGYnfUgzSDXYcQRlm_pDhIj6-7C68tcWLpUVUoyuqYl-KtPTYiEtKvAJKV-rN_GAYoaYWEJWdkhtUtLShsLIqrzAO6qwGzS6zO7N7uSjdF1P9-5EztAjqUgYK-p6ctAHvjW1HY9dOh0XDdiAVOm2igRfKnzzKg7pled4rUzMo9aRGOi5PSI77IxhAP5ks-Hikp_CL0RfODVncfmgpsv7pnnGfj_ibEbUbaBjB1zew3f',
    isActive: true,
    isFeatured: true,
    turnaround: 'Depending on shoe type',
    sortOrder: 5,
  },

  {
    name: 'Carpet Cleaning',
    slug: 'carpet-care-services-in-dubai',
    description:
      'Deep carpet shampooing and stain removal with industrial cleaning.',
    price: 0,
    category: 'carpet-cleaning',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA45R7mYBYS5a_-9pcT1PdHvi75OrnW6SgurkHhCX-fJ_ymGD8x0ZZuqiCo5Rh908iElZhzYe3KP3UjAx1wUQ4w_Gkwp_0eqEpz_6SyRfDVW2dl0ja2MyCknffKUydongro0YT2wxCiDPDXKNyOovJkMUoqOJr4ZA-NfMZLhrLsPSzz1PycN1W0-fHxB0FkSehzYFH-4oAoWgJiJMcL_xJ9Sn_AkpjsLYsdhmJFybGq8Ju4kHUF-wp0f_OGW_HJf2FKgFPDwm8vZA6D',
    isActive: true,
    isFeatured: true,
    turnaround: 'depending on carpet size and condition',
    sortOrder: 6,
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ MongoDB Connected');

    await Product.deleteMany({});
    await ServiceItem.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});

    console.log('🗑 Old data deleted');

    const createdProducts = await Product.insertMany(products);

    console.log('✅ Products seeded');

    createdProducts.forEach((product) => {
      console.log(`✔ ${product.name} → ${product.category}`);
    });

    console.log('🎉 Database seeding completed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedDatabase();