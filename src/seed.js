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

// Service products (main categories)
const products = [
  {
    name: 'Wash & Press',
    slug: 'wash-and-press-services-in-dubai',
    description: 'Professional laundry cleaning with premium detergents and expert garment care.',
    price: 0,
    category: 'laundry',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaHDEQVLbQfnwFR9_VyvfLd-ko007XGQDbe8hwTsWY87HzOxSF5OEi1VIUhphuEPzTyIEYGuar_lQ5blIcLFr6Dnz7X7Z7pctJxklYiZfa-c9MxeiY35ivv9-1g0LOse4jxv133UHtIinIC088t7NfjZ_PC9rleHHBGmlsZ69ybT_UKrJ4utQTtvinL1UeEgulkfcg2nUWiJ2DIJYYhlitbNGfkogR5s0XfbMFFqM3gQtqlpbRweKf5r0np3KX1dvRGk_0eUCe4tVi',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 1,
    serviceType: 'wash-press'
  },
  {
    name: 'Press Only (Steam Ironing)',
    slug: 'press-only-steam-ironing-services-in-dubai',
    description: 'Professional steam ironing for wrinkle-free crisp finishing.',
    price: 0,
    category: 'steam-ironing',
    image: 'https://static.vecteezy.com/system/resources/thumbnails/075/548/139/small/closeup-electric-steam-iron-pressing-blue-shirt-with-powerful-vapor-mist-photo.jpeg',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 2,
    serviceType: 'press-only'
  },
  {
    name: 'Dry Cleaning',
    slug: 'dry-cleaning-services-in-dubai',
    description: 'Delicate dry cleaning service for suits, silk, gowns, and premium garments.',
    price: 0,
    category: 'dry-cleaning',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDSmGE2TtzW6YVlJMSyDumNuxjDafzBKzMdR4qG3eqVcTjAah0uNIQZPkLuWeHPHol4b4KvmlsPFC_KN3p7tWQBQ6QwwY9XUZtHuIIRZFMG-vCYoyJ0_b_XudUiAoeNPHtFhFaLpyFciaiUZmTUIz8SpnuLdtIr0RiWN6TrQRdNdIb0l8hb8_Ixsen9jOJTPqkeWMIP7psQVAw1npMZJXsAkH52LwBCa_R3N1DEIzyDhvtApslLYMdiQNPrDDyWg663DoZ--vmdfsf',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 3,
    serviceType: 'dry-clean'
  },
  {
    name: 'Wash & Fold',
    slug: 'wash-and-fold-services-in-dubai',
    description: 'Bulk laundry washed, dried, and folded perfectly for daily convenience.',
    price: 0,
    category: 'wash-and-fold',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDP4Fl1mcL71ms-0aDco1bos4KJFJEZx5OQnJIOBWlWluJMOTU3XhoRrxAQvDa2yackx6UDbMN2aeY0HX3vJrKxXZZvOxDngQlZRCw6IC4qNlNInPtj13VA8r8kN-3-D0Jxrt44nDI5JAqB96hap1m-Sa8t_3oq6LroL8Ag9vqpd38eVyGtjT49EfXZUUUEmpo9H8CJRr1964I_IjjhCECEuvi3KYyJIWnmLx6Um420B0z6GG4nyB3DmF5ORn7DB6p1qP9FsFWioqH3',
    isActive: true,
    isFeatured: true,
    turnaround: '24-48 hours',
    sortOrder: 4,
    serviceType: 'wash-fold'
  },
  {
    name: 'Shoe Care',
    slug: 'shoe-care-services-in-dubai',
    description: 'Deep cleaning and restoration for sneakers, leather shoes, and luxury footwear.',
    price: 0,
    category: 'shoe-cleaning',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyptsqgZUbgwL6Bq4bEsstny-6nDqBiqN5cBGYnfUgzSDXYcQRlm_pDhIj6-7C68tcWLpUVUoyuqYl-KtPTYiEtKvAJKV-rN_GAYoaYWEJWdkhtUtLShsLIqrzAO6qwGzS6zO7N7uSjdF1P9-5EztAjqUgYK-p6ctAHvjW1HY9dOh0XDdiAVOm2igRfKnzzKg7pled4rUzMo9aRGOi5PSI77IxhAP5ks-Hikp_CL0RfODVncfmgpsv7pnnGfj_ibEbUbaBjB1zew3f',
    isActive: true,
    isFeatured: true,
    turnaround: 'Depending on shoe type',
    sortOrder: 5,
    serviceType: 'shoe-care'
  },
  {
    name: 'Carpet Cleaning',
    slug: 'carpet-care-services-in-dubai',
    description: 'Deep carpet shampooing and stain removal with industrial cleaning.',
    price: 0,
    category: 'carpet-cleaning',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA45R7mYBYS5a_-9pcT1PdHvi75OrnW6SgurkHhCX-fJ_ymGD8x0ZZuqiCo5Rh908iElZhzYe3KP3UjAx1wUQ4w_Gkwp_0eqEpz_6SyRfDVW2dl0ja2MyCknffKUydongro0YT2wxCiDPDXKNyOovJkMUoqOJr4ZA-NfMZLhrLsPSzz1PycN1W0-fHxB0FkSehzYFH-4oAoWgJiJMcL_xJ9Sn_AkpjsLYsdhmJFybGq8Ju4kHUF-wp0f_OGW_HJf2FKgFPDwm8vZA6D',
    isActive: true,
    isFeatured: true,
    turnaround: 'depending on carpet size and condition',
    sortOrder: 6,
    serviceType: 'carpet'
  },
];

// Define the exact order for each category
const ITEM_ORDER = {
  men: [
    'T-Shirt',
    'Shirt',
    'Trousers',
    'Pants',
    'Jeans',
    'Shorts',
    'Pyjama',
    'Lungi',
    'Handkerchief',
    'Kandoora',
    'Thobe / Dishdasha',
    'Ghatra',
    'Scarf / Muffler',
    'Suit 2 Piece',
    'Suit 3 Piece',
    'Blazer',
    'Waist Coat',
    'Tie',
    'Cap',
    'Jacket',
    'Coat',
    'Long Coat',
    'Leather Jacket (Special)',
    'Pyjama (Woolen)',
    'Sweater',
    'Pullover / Hoodie',
    'Inner Wear (Woolen)',
    'Undershirt',
    'Underwear',
    'Pair of Socks',
    'Gym Wear / Sportswear',
    'Sports Jersey / Team Kit',
    'Swimwear / Trunks'
  ],
  women: [
    'T-Shirt',
    'Shirt',
    'Trousers',
    'Pant',
    'Jeans',
    'Leggings',
    'Crop Top',
    'Handkerchief',
    'Abaya',
    'Abaya (Special)',
    'Hijab',
    'Niqab',
    'Scarf / Dupatta',
    'Salwar',
    'Kameez',
    'Saree',
    'Skirt Half',
    'Skirt Full',
    'Full Dress (Normal)',
    'Full Dress (Woolen)',
    'Party Dress (Special)',
    'Evening Gown',
    'Wedding Dress / Bridal Gown',
    'Kimono / Dressing Gown',
    'Blouse',
    'Top (Woolen)',
    'Cardigan',
    'Sweater',
    'Pullover / Hoodie',
    'Pyjama (Woolen)',
    'Suit 2 Piece',
    'Suit 3 Piece',
    'Blazer',
    'Coat',
    'Jacket',
    'Long Coat',
    'Bra and Inners',
    'Underwear',
    'Swimsuit / Burkini',
    'Gym Wear / Sportswear',
    'Sports Jersey / Team Kit'
  ],
  children: [
    'T-Shirt',
    'Shirt',
    'Trousers / Pants',
    'Jeans',
    'Shorts',
    'Dress',
    'Skirt',
    'Leggings',
    'Jumpsuit / Playsuit',
    'Romper',
    'Onesie / Bodysuit',
    'Kandoora',
    'Thobe / Dishdasha',
    'Abaya',
    'Salwar Kameez',
    'Traditional / Ceremonial Dress',
    'Ghatra / Scarf',
    'School Shirt',
    'School Trousers / Skirt',
    'School Blazer / Jacket',
    'School Tie',
    'School PE Kit / Sports Uniform',
    'Jacket',
    'Coat',
    'Hoodie / Pullover',
    'Sweater / Cardigan'
  ],
  household: [
    'Bed Sheet Single',
    'Bed Sheet Double',
    'Duvet Cover Single',
    'Duvet Cover Double',
    'Pillow Cover / Cushion Cover',
    'Mattress Protector / Topper',
    'Baby Blanket',
    'Duvet Small',
    'Duvet Medium',
    'Duvet Large',
    'Blanket Single',
    'Blanket Double',
    'Pillow',
    'Cushion',
    'Bath Towel Medium',
    'Bath Towel Large',
    'Bath Robe',
    'Hand Towel',
    'Face Towel',
    'Table Cloth',
    'Table Runner',
    'Napkins / Dinner Napkins',
    'Kitchen Apron',
    'Curtains (Light)',
    'Curtains (Heavy)',
    'Sofa Cover / Slipcover',
    'Prayer Mat'
  ]
};

// Service items data with prices for each service type
const serviceItemsData = {
  // MEN category items
  men: [
    // Everyday Wear
    { name: 'T-Shirt', category: 'men', unit: 'piece', description: 'Professional cleaning and pressing for t-shirts' },
    { name: 'Shirt', category: 'men', unit: 'piece', description: 'Crisp ironing and stain removal for shirts' },
    { name: 'Trousers', category: 'men', unit: 'piece', description: 'Crease-free pressing for trousers' },
    { name: 'Pants', category: 'men', unit: 'piece', description: 'Professional care for pants' },
    { name: 'Jeans', category: 'men', unit: 'piece', description: 'Color-safe washing for jeans' },
    { name: 'Shorts', category: 'men', unit: 'piece', description: 'Fresh and clean shorts' },
    { name: 'Pyjama', category: 'men', unit: 'piece', description: 'Comfortable cleaning for sleepwear' },
    { name: 'Lungi', category: 'men', unit: 'piece', description: 'Traditional lungi care' },
    { name: 'Handkerchief', category: 'men', unit: 'piece', description: 'Delicate handkerchief cleaning' },

    // Ethnic & Regional Wear
    { name: 'Kandoora', category: 'men', unit: 'piece', description: 'Expert care for traditional kandoora' },
    { name: 'Thobe / Dishdasha', category: 'men', unit: 'piece', description: 'Professional thobe cleaning' },
    { name: 'Ghatra', category: 'men', unit: 'piece', description: 'Traditional headwear care' },
    { name: 'Scarf / Muffler', category: 'men', unit: 'piece', description: 'Gentle scarf cleaning' },

    // Formal & Tailored
    { name: 'Suit 2 Piece', category: 'men', unit: 'set', description: 'Expert suit dry cleaning' },
    { name: 'Suit 3 Piece', category: 'men', unit: 'set', description: 'Complete suit care with vest' },
    { name: 'Blazer', category: 'men', unit: 'piece', description: 'Professional blazer care' },
    { name: 'Waist Coat', category: 'men', unit: 'piece', description: 'Formal waist coat cleaning' },
    { name: 'Tie', category: 'men', unit: 'piece', description: 'Delicate tie cleaning' },
    { name: 'Cap', category: 'men', unit: 'piece', description: 'Cap cleaning and reshaping' },

    // Outerwear
    { name: 'Jacket', category: 'men', unit: 'piece', description: 'Outerwear jacket care' },
    { name: 'Coat', category: 'men', unit: 'piece', description: 'Winter coat cleaning' },
    { name: 'Long Coat', category: 'men', unit: 'piece', description: 'Long coat professional care' },
    { name: 'Leather Jacket (Special)', category: 'men', unit: 'piece', description: 'Specialized leather cleaning' },

    // Woolen & Knitwear
    { name: 'Pyjama (Woolen)', category: 'men', unit: 'piece', description: 'Woolen sleepwear care' },
    { name: 'Sweater', category: 'men', unit: 'piece', description: 'Gentle sweater cleaning' },
    { name: 'Pullover / Hoodie', category: 'men', unit: 'piece', description: 'Hoodie and pullover care' },
    { name: 'Inner Wear (Woolen)', category: 'men', unit: 'piece', description: 'Woolen innerwear cleaning' },

    // Innerwear & Basics
    { name: 'Undershirt', category: 'men', unit: 'piece', description: 'Fresh undershirt cleaning' },
    { name: 'Underwear', category: 'men', unit: 'piece', description: 'Hygienic underwear cleaning' },
    { name: 'Pair of Socks', category: 'men', unit: 'pair', description: 'Fresh sock cleaning' },

    // Sports & Gym
    { name: 'Gym Wear / Sportswear', category: 'men', unit: 'piece', description: 'Activewear deep cleaning' },
    { name: 'Sports Jersey / Team Kit', category: 'men', unit: 'piece', description: 'Sports jersey care' },
    { name: 'Swimwear / Trunks', category: 'men', unit: 'piece', description: 'Swimwear gentle cleaning' },
  ],

  // WOMEN category items
  women: [
    // Everyday Wear
    { name: 'T-Shirt', category: 'women', unit: 'piece', description: 'Casual t-shirt cleaning' },
    { name: 'Shirt', category: 'women', unit: 'piece', description: 'Blouse and shirt care' },
    { name: 'Trousers', category: 'women', unit: 'piece', description: 'Women\'s trousers cleaning' },
    { name: 'Pant', category: 'women', unit: 'piece', description: 'Pants professional care' },
    { name: 'Jeans', category: 'women', unit: 'piece', description: 'Jeans color protection' },
    { name: 'Leggings', category: 'women', unit: 'piece', description: 'Stretchy legging care' },
    { name: 'Crop Top', category: 'women', unit: 'piece', description: 'Delicate crop top cleaning' },
    { name: 'Handkerchief', category: 'women', unit: 'piece', description: 'Delicate handkerchief care' },

    // Ethnic & Regional Wear
    { name: 'Abaya', category: 'women', unit: 'piece', description: 'Special care for abayas' },
    { name: 'Abaya (Special)', category: 'women', unit: 'piece', description: 'Premium abaya with embellishments' },
    { name: 'Hijab', category: 'women', unit: 'piece', description: 'Gentle hijab cleaning' },
    { name: 'Niqab', category: 'women', unit: 'piece', description: 'Delicate niqab care' },
    { name: 'Scarf / Dupatta', category: 'women', unit: 'piece', description: 'Scarf and dupatta care' },
    { name: 'Salwar', category: 'women', unit: 'piece', description: 'Salwar traditional wear care' },
    { name: 'Kameez', category: 'women', unit: 'piece', description: 'Kameez cleaning' },
    { name: 'Saree', category: 'women', unit: 'piece', description: 'Traditional saree care' },

    // Dresses & Skirts
    { name: 'Skirt Half', category: 'women', unit: 'piece', description: 'Half skirt pressing' },
    { name: 'Skirt Full', category: 'women', unit: 'piece', description: 'Full skirt care' },
    { name: 'Full Dress (Normal)', category: 'women', unit: 'piece', description: 'Casual dress cleaning' },
    { name: 'Full Dress (Woolen)', category: 'women', unit: 'piece', description: 'Woolen dress care' },
    { name: 'Party Dress (Special)', category: 'women', unit: 'piece', description: 'Party dress with embellishments' },
    { name: 'Evening Gown', category: 'women', unit: 'piece', description: 'Elegant evening gown care' },
    { name: 'Wedding Dress / Bridal Gown', category: 'women', unit: 'piece', description: 'Premium bridal gown care - contact for quote' },
    { name: 'Kimono / Dressing Gown', category: 'women', unit: 'piece', description: 'Kimono and robe care' },

    // Tops & Knitwear
    { name: 'Blouse', category: 'women', unit: 'piece', description: 'Blouse professional care' },
    { name: 'Top (Woolen)', category: 'women', unit: 'piece', description: 'Woolen top cleaning' },
    { name: 'Cardigan', category: 'women', unit: 'piece', description: 'Cardigan gentle care' },
    { name: 'Sweater', category: 'women', unit: 'piece', description: 'Sweater cleaning' },
    { name: 'Pullover / Hoodie', category: 'women', unit: 'piece', description: 'Hoodie and pullover care' },
    { name: 'Pyjama (Woolen)', category: 'women', unit: 'piece', description: 'Woolen sleepwear care' },

    // Formal & Tailored
    { name: 'Suit 2 Piece', category: 'women', unit: 'set', description: 'Women\'s suit care' },
    { name: 'Suit 3 Piece', category: 'women', unit: 'set', description: 'Complete suit with vest' },
    { name: 'Blazer', category: 'women', unit: 'piece', description: 'Blazer professional care' },
    { name: 'Coat', category: 'women', unit: 'piece', description: 'Winter coat cleaning' },
    { name: 'Jacket', category: 'women', unit: 'piece', description: 'Jacket care' },
    { name: 'Long Coat', category: 'women', unit: 'piece', description: 'Long coat cleaning' },

    // Innerwear & Basics
    { name: 'Bra and Inners', category: 'women', unit: 'piece', description: 'Delicate innerwear care' },
    { name: 'Underwear', category: 'women', unit: 'piece', description: 'Hygienic underwear cleaning' },
    { name: 'Swimsuit / Burkini', category: 'women', unit: 'piece', description: 'Swimwear gentle cleaning' },

    // Sports & Gym
    { name: 'Gym Wear / Sportswear', category: 'women', unit: 'piece', description: 'Activewear deep cleaning' },
    { name: 'Sports Jersey / Team Kit', category: 'women', unit: 'piece', description: 'Sports jersey care' },
  ],

  // CHILDREN category items
  children: [
    // Everyday Wear
    { name: 'T-Shirt', category: 'children', unit: 'piece', description: 'Kids t-shirt cleaning' },
    { name: 'Shirt', category: 'children', unit: 'piece', description: 'Kids shirt care' },
    { name: 'Trousers / Pants', category: 'children', unit: 'piece', description: 'Kids trousers cleaning' },
    { name: 'Jeans', category: 'children', unit: 'piece', description: 'Kids jeans care' },
    { name: 'Shorts', category: 'children', unit: 'piece', description: 'Kids shorts cleaning' },
    { name: 'Dress', category: 'children', unit: 'piece', description: 'Kids dress care' },
    { name: 'Skirt', category: 'children', unit: 'piece', description: 'Kids skirt cleaning' },
    { name: 'Leggings', category: 'children', unit: 'piece', description: 'Kids leggings care' },
    { name: 'Jumpsuit / Playsuit', category: 'children', unit: 'piece', description: 'Kids jumpsuit cleaning' },
    { name: 'Romper', category: 'children', unit: 'piece', description: 'Baby romper care' },
    { name: 'Onesie / Bodysuit', category: 'children', unit: 'piece', description: 'Baby onesie cleaning' },

    // Ethnic & Regional Wear
    { name: 'Kandoora', category: 'children', unit: 'piece', description: 'Kids kandoora care' },
    { name: 'Thobe / Dishdasha', category: 'children', unit: 'piece', description: 'Kids thobe cleaning' },
    { name: 'Abaya', category: 'children', unit: 'piece', description: 'Kids abaya care' },
    { name: 'Salwar Kameez', category: 'children', unit: 'set', description: 'Kids traditional wear' },
    { name: 'Traditional / Ceremonial Dress', category: 'children', unit: 'piece', description: 'Special occasion dress care' },
    { name: 'Ghatra / Scarf', category: 'children', unit: 'piece', description: 'Kids headwear care' },

    // School Uniform
    { name: 'School Shirt', category: 'children', unit: 'piece', description: 'School uniform shirt' },
    { name: 'School Trousers / Skirt', category: 'children', unit: 'piece', description: 'School uniform bottoms' },
    { name: 'School Blazer / Jacket', category: 'children', unit: 'piece', description: 'School blazer care' },
    { name: 'School Tie', category: 'children', unit: 'piece', description: 'School tie cleaning' },
    { name: 'School PE Kit / Sports Uniform', category: 'children', unit: 'set', description: 'PE uniform cleaning' },

    // Outerwear & Knitwear
    { name: 'Jacket', category: 'children', unit: 'piece', description: 'Kids jacket care' },
    { name: 'Coat', category: 'children', unit: 'piece', description: 'Kids coat cleaning' },
    { name: 'Hoodie / Pullover', category: 'children', unit: 'piece', description: 'Kids hoodie care' },
    { name: 'Sweater / Cardigan', category: 'children', unit: 'piece', description: 'Kids sweater cleaning' },
  ],

  // HOUSEHOLD category items
  household: [
    // Bed Linen
    { name: 'Bed Sheet Single', category: 'household', unit: 'piece', description: 'Single bed sheet cleaning' },
    { name: 'Bed Sheet Double', category: 'household', unit: 'piece', description: 'Double bed sheet cleaning' },
    { name: 'Duvet Cover Single', category: 'household', unit: 'piece', description: 'Single duvet cover care' },
    { name: 'Duvet Cover Double', category: 'household', unit: 'piece', description: 'Double duvet cover care' },
    { name: 'Pillow Cover / Cushion Cover', category: 'household', unit: 'piece', description: 'Pillow case cleaning' },
    { name: 'Mattress Protector / Topper', category: 'household', unit: 'piece', description: 'Mattress protector care' },
    { name: 'Baby Blanket', category: 'household', unit: 'piece', description: 'Baby blanket gentle cleaning' },

    // Duvets & Blankets
    { name: 'Duvet Small', category: 'household', unit: 'piece', description: 'Small duvet cleaning' },
    { name: 'Duvet Medium', category: 'household', unit: 'piece', description: 'Medium duvet cleaning' },
    { name: 'Duvet Large', category: 'household', unit: 'piece', description: 'Large duvet cleaning' },
    { name: 'Blanket Single', category: 'household', unit: 'piece', description: 'Single blanket care' },
    { name: 'Blanket Double', category: 'household', unit: 'piece', description: 'Double blanket cleaning' },
    { name: 'Pillow', category: 'household', unit: 'piece', description: 'Pillow deep cleaning' },
    { name: 'Cushion', category: 'household', unit: 'piece', description: 'Decorative cushion care' },

    // Bath & Robes
    { name: 'Bath Towel Medium', category: 'household', unit: 'piece', description: 'Medium bath towel cleaning' },
    { name: 'Bath Towel Large', category: 'household', unit: 'piece', description: 'Large bath towel care' },
    { name: 'Bath Robe', category: 'household', unit: 'piece', description: 'Bathrobe cleaning' },
    { name: 'Hand Towel', category: 'household', unit: 'piece', description: 'Hand towel care' },
    { name: 'Face Towel', category: 'household', unit: 'piece', description: 'Face towel cleaning' },

    // Table Linen
    { name: 'Table Cloth', category: 'household', unit: 'piece', description: 'Tablecloth cleaning' },
    { name: 'Table Runner', category: 'household', unit: 'piece', description: 'Table runner care' },
    { name: 'Napkins / Dinner Napkins', category: 'household', unit: 'piece', description: 'Napkin cleaning' },
    { name: 'Kitchen Apron', category: 'household', unit: 'piece', description: 'Apron care' },

    // Curtains & Covers
    { name: 'Curtains (Light)', category: 'household', unit: 'panel', description: 'Light curtain cleaning - price depends' },
    { name: 'Curtains (Heavy)', category: 'household', unit: 'panel', description: 'Heavy curtain cleaning - price depends' },
    { name: 'Sofa Cover / Slipcover', category: 'household', unit: 'piece', description: 'Sofa cover cleaning' },

    // Prayer & Miscellaneous
    { name: 'Prayer Mat', category: 'household', unit: 'piece', description: 'Prayer mat cleaning' },
  ],

  // SPECIAL category (Uniforms, Occasion wear)
  special: [
    // Uniforms
    { name: 'Police Dress', category: 'special', unit: 'piece', description: 'Police uniform cleaning' },
    { name: 'Security Uniform', category: 'special', unit: 'piece', description: 'Security uniform care' },
    { name: 'Chef Uniform', category: 'special', unit: 'piece', description: 'Chef uniform cleaning' },
    { name: 'Nurse / Medical Uniform', category: 'special', unit: 'piece', description: 'Medical uniform care' },
    { name: 'School Uniform', category: 'special', unit: 'piece', description: 'School uniform cleaning' },
    { name: 'Sports Jersey / Team Kit', category: 'special', unit: 'piece', description: 'Team jersey care' },

    // Occasion & Ceremonial
    { name: 'Wedding Dress / Bridal Gown', category: 'special', unit: 'piece', description: 'Premium bridal gown - contact for quote' },
    { name: 'Kandoora (Embroidered / Special)', category: 'special', unit: 'piece', description: 'Embroidered kandoora - contact for quote' },
    { name: 'Evening Gown', category: 'special', unit: 'piece', description: 'Evening gown - contact for quote' },
    { name: 'Ceremonial Dress', category: 'special', unit: 'piece', description: 'Ceremonial attire - contact for quote' },
  ]
};

// Price mapping for each service type and item
const priceMapping = {
  // MEN prices
  men: {
    // Everyday Wear
    'T-Shirt': { 'wash-press': 7, 'press-only': 4, 'dry-clean': 10 },
    'Shirt': { 'wash-press': 7, 'press-only': 4, 'dry-clean': 10 },
    'Trousers': { 'wash-press': 7, 'press-only': 4, 'dry-clean': 10 },
    'Pants': { 'wash-press': 7, 'press-only': 4, 'dry-clean': 10 },
    'Jeans': { 'wash-press': 8, 'press-only': 5, 'dry-clean': 12 },
    'Shorts': { 'wash-press': 7, 'press-only': 4, 'dry-clean': 10 },
    'Pyjama': { 'wash-press': 7, 'press-only': 4, 'dry-clean': 10 },
    'Lungi': { 'wash-press': 8, 'press-only': 5, 'dry-clean': 12 },
    'Handkerchief': { 'wash-press': 2, 'press-only': 2, 'dry-clean': null },

    // Ethnic & Regional Wear
    'Kandoora': { 'wash-press': 12, 'press-only': 6, 'dry-clean': 15 },
    'Thobe / Dishdasha': { 'wash-press': 12, 'press-only': 6, 'dry-clean': 15 },
    'Ghatra': { 'wash-press': 10, 'press-only': 6, 'dry-clean': 12 },
    'Scarf / Muffler': { 'wash-press': 8, 'press-only': 6, 'dry-clean': 12 },

    // Formal & Tailored
    'Suit 2 Piece': { 'wash-press': null, 'press-only': 12, 'dry-clean': 28 },
    'Suit 3 Piece': { 'wash-press': null, 'press-only': 15, 'dry-clean': 38 },
    'Blazer': { 'wash-press': null, 'press-only': 12, 'dry-clean': 18 },
    'Waist Coat': { 'wash-press': 12, 'press-only': 8, 'dry-clean': 15 },
    'Tie': { 'wash-press': 6, 'press-only': null, 'dry-clean': 8 },
    'Cap': { 'wash-press': 6, 'press-only': null, 'dry-clean': 8 },

    // Outerwear
    'Jacket': { 'wash-press': null, 'press-only': 12, 'dry-clean': 20 },
    'Coat': { 'wash-press': null, 'press-only': 12, 'dry-clean': 20 },
    'Long Coat': { 'wash-press': null, 'press-only': 14, 'dry-clean': 25 },
    'Leather Jacket (Special)': { 'wash-press': null, 'press-only': null, 'dry-clean': 40 },

    // Woolen & Knitwear
    'Pyjama (Woolen)': { 'wash-press': null, 'press-only': 5, 'dry-clean': 12 },
    'Sweater': { 'wash-press': null, 'press-only': 6, 'dry-clean': 15 },
    'Pullover / Hoodie': { 'wash-press': 12, 'press-only': 6, 'dry-clean': 15 },
    'Inner Wear (Woolen)': { 'wash-press': null, 'press-only': 4, 'dry-clean': 8 },

    // Innerwear & Basics
    'Undershirt': { 'wash-press': 4, 'press-only': null, 'dry-clean': null },
    'Underwear': { 'wash-press': 4, 'press-only': null, 'dry-clean': null },
    'Pair of Socks': { 'wash-press': 4, 'press-only': null, 'dry-clean': null },

    // Sports & Gym
    'Gym Wear / Sportswear': { 'wash-press': 8, 'press-only': null, 'dry-clean': null },
    'Sports Jersey / Team Kit': { 'wash-press': 8, 'press-only': null, 'dry-clean': null },
    'Swimwear / Trunks': { 'wash-press': 6, 'press-only': null, 'dry-clean': null },
  },

  // WOMEN prices (same as men for most items)
  women: {
    'T-Shirt': { 'wash-press': 7, 'press-only': 4, 'dry-clean': 10 },
    'Shirt': { 'wash-press': 7, 'press-only': 4, 'dry-clean': 10 },
    'Trousers': { 'wash-press': 7, 'press-only': 4, 'dry-clean': 10 },
    'Pant': { 'wash-press': 7, 'press-only': 4, 'dry-clean': 10 },
    'Jeans': { 'wash-press': 8, 'press-only': 5, 'dry-clean': 12 },
    'Leggings': { 'wash-press': 8, 'press-only': 5, 'dry-clean': 10 },
    'Crop Top': { 'wash-press': 7, 'press-only': 4, 'dry-clean': 10 },
    'Handkerchief': { 'wash-press': 2, 'press-only': 2, 'dry-clean': null },
    'Abaya': { 'wash-press': 15, 'press-only': 10, 'dry-clean': 20 },
    'Abaya (Special)': { 'wash-press': 25, 'press-only': 15, 'dry-clean': 30 },
    'Hijab': { 'wash-press': 10, 'press-only': 8, 'dry-clean': 15 },
    'Niqab': { 'wash-press': 10, 'press-only': 8, 'dry-clean': 15 },
    'Scarf / Dupatta': { 'wash-press': 10, 'press-only': 8, 'dry-clean': 15 },
    'Salwar': { 'wash-press': 8, 'press-only': 5, 'dry-clean': 12 },
    'Kameez': { 'wash-press': 8, 'press-only': 5, 'dry-clean': 12 },
    'Saree': { 'wash-press': null, 'press-only': 15, 'dry-clean': 30 },
    'Skirt Half': { 'wash-press': 8, 'press-only': 5, 'dry-clean': 12 },
    'Skirt Full': { 'wash-press': 10, 'press-only': 6, 'dry-clean': 15 },
    'Full Dress (Normal)': { 'wash-press': 12, 'press-only': 6, 'dry-clean': 15 },
    'Full Dress (Woolen)': { 'wash-press': null, 'press-only': 10, 'dry-clean': 20 },
    'Party Dress (Special)': { 'wash-press': null, 'press-only': 10, 'dry-clean': 20 },
    'Evening Gown': { 'wash-press': null, 'press-only': 10, 'dry-clean': 20 },
    'Wedding Dress / Bridal Gown': { 'wash-press': null, 'press-only': 20, 'dry-clean': null, 'contactForPricing': true },
    'Kimono / Dressing Gown': { 'wash-press': 14, 'press-only': 16, 'dry-clean': 28 },
    'Blouse': { 'wash-press': 8, 'press-only': 4, 'dry-clean': 12 },
    'Top (Woolen)': { 'wash-press': null, 'press-only': 8, 'dry-clean': 12 },
    'Cardigan': { 'wash-press': null, 'press-only': 8, 'dry-clean': 12 },
    'Sweater': { 'wash-press': null, 'press-only': 8, 'dry-clean': 15 },
    'Pullover / Hoodie': { 'wash-press': 12, 'press-only': 6, 'dry-clean': 15 },
    'Pyjama (Woolen)': { 'wash-press': null, 'press-only': 10, 'dry-clean': 20 },
    'Suit 2 Piece': { 'wash-press': null, 'press-only': 12, 'dry-clean': 28 },
    'Suit 3 Piece': { 'wash-press': null, 'press-only': 15, 'dry-clean': 38 },
    'Blazer': { 'wash-press': null, 'press-only': 12, 'dry-clean': 18 },
    'Coat': { 'wash-press': null, 'press-only': 12, 'dry-clean': 20 },
    'Jacket': { 'wash-press': null, 'press-only': 12, 'dry-clean': 20 },
    'Long Coat': { 'wash-press': null, 'press-only': 14, 'dry-clean': 25 },
    'Bra and Inners': { 'wash-press': 8, 'press-only': null, 'dry-clean': null },
    'Underwear': { 'wash-press': 8, 'press-only': null, 'dry-clean': null },
    'Swimsuit / Burkini': { 'wash-press': 8, 'press-only': null, 'dry-clean': null },
    'Gym Wear / Sportswear': { 'wash-press': 8, 'press-only': null, 'dry-clean': null },
    'Sports Jersey / Team Kit': { 'wash-press': 8, 'press-only': null, 'dry-clean': null },
  },

  // CHILDREN prices
  children: {
    'T-Shirt': { 'wash-press': 5, 'press-only': 3, 'dry-clean': 8 },
    'Shirt': { 'wash-press': 5, 'press-only': 3, 'dry-clean': 8 },
    'Trousers / Pants': { 'wash-press': 6, 'press-only': 4, 'dry-clean': 8 },
    'Jeans': { 'wash-press': 7, 'press-only': 4, 'dry-clean': 8 },
    'Shorts': { 'wash-press': 5, 'press-only': 4, 'dry-clean': 8 },
    'Dress': { 'wash-press': 8, 'press-only': 5, 'dry-clean': 10 },
    'Skirt': { 'wash-press': 5, 'press-only': 4, 'dry-clean': 10 },
    'Leggings': { 'wash-press': 5, 'press-only': null, 'dry-clean': 10 },
    'Jumpsuit / Playsuit': { 'wash-press': 8, 'press-only': 4, 'dry-clean': 10 },
    'Romper': { 'wash-press': 8, 'press-only': 4, 'dry-clean': 10 },
    'Onesie / Bodysuit': { 'wash-press': 8, 'press-only': null, 'dry-clean': 10 },
    'Kandoora': { 'wash-press': 10, 'press-only': 5, 'dry-clean': 14 },
    'Thobe / Dishdasha': { 'wash-press': 10, 'press-only': 5, 'dry-clean': 14 },
    'Abaya': { 'wash-press': null, 'press-only': 6, 'dry-clean': 16 },
    'Salwar Kameez': { 'wash-press': 14, 'press-only': 6, 'dry-clean': 20 },
    'Traditional / Ceremonial Dress': { 'wash-press': null, 'press-only': 6, 'dry-clean': 20 },
    'Ghatra / Scarf': { 'wash-press': null, 'press-only': 6, 'dry-clean': 20 },
    'School Shirt': { 'wash-press': 6, 'press-only': 3, 'dry-clean': null },
    'School Trousers / Skirt': { 'wash-press': 6, 'press-only': 3, 'dry-clean': null },
    'School Blazer / Jacket': { 'wash-press': null, 'press-only': 6, 'dry-clean': 20 },
    'School Tie': { 'wash-press': null, 'press-only': null, 'dry-clean': 4 },
    'School PE Kit / Sports Uniform': { 'wash-press': 10, 'press-only': null, 'dry-clean': 18 },
    'Jacket': { 'wash-press': null, 'press-only': 10, 'dry-clean': 15 },
    'Coat': { 'wash-press': null, 'press-only': 10, 'dry-clean': 15 },
    'Hoodie / Pullover': { 'wash-press': 10, 'press-only': 6, 'dry-clean': 15 },
    'Sweater / Cardigan': { 'wash-press': null, 'press-only': 6, 'dry-clean': 15 },
  },

  // HOUSEHOLD prices
  household: {
    'Bed Sheet Single': { 'wash-press': 12, 'press-only': 6, 'dry-clean': null },
    'Bed Sheet Double': { 'wash-press': 16, 'press-only': 8, 'dry-clean': null },
    'Duvet Cover Single': { 'wash-press': 12, 'press-only': 6, 'dry-clean': null },
    'Duvet Cover Double': { 'wash-press': 16, 'press-only': 8, 'dry-clean': null },
    'Pillow Cover / Cushion Cover': { 'wash-press': 6, 'press-only': 4, 'dry-clean': null },
    'Mattress Protector / Topper': { 'wash-press': 10, 'press-only': null, 'dry-clean': null },
    'Baby Blanket': { 'wash-press': 6, 'press-only': null, 'dry-clean': null },
    'Duvet Small': { 'wash-press': 15, 'press-only': null, 'dry-clean': 20 },
    'Duvet Medium': { 'wash-press': 20, 'press-only': null, 'dry-clean': 25 },
    'Duvet Large': { 'wash-press': 25, 'press-only': null, 'dry-clean': 30 },
    'Blanket Single': { 'wash-press': 12, 'press-only': null, 'dry-clean': 20 },
    'Blanket Double': { 'wash-press': 20, 'press-only': null, 'dry-clean': 30 },
    'Pillow': { 'wash-press': 6, 'press-only': null, 'dry-clean': 10 },
    'Cushion': { 'wash-press': 10, 'press-only': null, 'dry-clean': 10 },
    'Bath Towel Medium': { 'wash-press': 10, 'press-only': null, 'dry-clean': 14 },
    'Bath Towel Large': { 'wash-press': 12, 'press-only': null, 'dry-clean': 16 },
    'Bath Robe': { 'wash-press': 15, 'press-only': 8, 'dry-clean': 20 },
    'Hand Towel': { 'wash-press': 4, 'press-only': null, 'dry-clean': 6 },
    'Face Towel': { 'wash-press': 4, 'press-only': null, 'dry-clean': 6 },
    'Table Cloth': { 'wash-press': 6, 'press-only': 3, 'dry-clean': 10 },
    'Table Runner': { 'wash-press': 6, 'press-only': 3, 'dry-clean': 10 },
    'Napkins / Dinner Napkins': { 'wash-press': 4, 'press-only': 3, 'dry-clean': 8 },
    'Kitchen Apron': { 'wash-press': 7, 'press-only': 5, 'dry-clean': 15 },
    'Curtains (Light)': { 'wash-press': null, 'press-only': null, 'dry-clean': null, 'contactForPricing': true },
    'Curtains (Heavy)': { 'wash-press': null, 'press-only': null, 'dry-clean': null, 'contactForPricing': true },
    'Sofa Cover / Slipcover': { 'wash-press': 80, 'press-only': null, 'dry-clean': 150 },
    'Prayer Mat': { 'wash-press': 10, 'press-only': null, 'dry-clean': 15 },
  },

  // SPECIAL prices
  special: {
    'Police Dress': { 'wash-press': 20, 'press-only': 10, 'dry-clean': 30 },
    'Security Uniform': { 'wash-press': 15, 'press-only': 10, 'dry-clean': 20 },
    'Chef Uniform': { 'wash-press': 15, 'press-only': 10, 'dry-clean': 25 },
    'Nurse / Medical Uniform': { 'wash-press': 20, 'press-only': 10, 'dry-clean': 25 },
    'School Uniform': { 'wash-press': 20, 'press-only': 10, 'dry-clean': 25 },
    'Sports Jersey / Team Kit': { 'wash-press': 20, 'press-only': 10, 'dry-clean': 30 },
    'Wedding Dress / Bridal Gown': { 'wash-press': null, 'press-only': null, 'dry-clean': null, 'contactForPricing': true },
    'Kandoora (Embroidered / Special)': { 'wash-press': null, 'press-only': null, 'dry-clean': null, 'contactForPricing': true },
    'Evening Gown': { 'wash-press': null, 'press-only': null, 'dry-clean': null, 'contactForPricing': true },
    'Ceremonial Dress': { 'wash-press': null, 'press-only': null, 'dry-clean': null, 'contactForPricing': true },
  }
};

// Map service slugs to service types
const getServiceType = (slug) => {
  if (slug.includes('wash-and-press')) return 'wash-press';
  if (slug.includes('press-only')) return 'press-only';
  if (slug.includes('dry-cleaning')) return 'dry-clean';
  if (slug.includes('wash-and-fold')) return 'wash-fold';
  if (slug.includes('shoe-care')) return 'shoe-care';
  if (slug.includes('carpet-care')) return 'carpet';
  return null;
};

// Helper function to get sort order for an item
const getSortOrder = (category, itemName) => {
  const orderArray = ITEM_ORDER[category];
  if (!orderArray) return 999;
  const index = orderArray.indexOf(itemName);
  return index >= 0 ? index : 999;
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing data
    await Product.deleteMany({});
    await ServiceItem.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    console.log('🗑 Old data deleted');

    // Create products
    const createdProducts = await Product.insertMany(products);
    console.log('✅ Products seeded');

    // Create service items for each product
    const allServiceItems = [];

    for (const product of createdProducts) {
      const serviceType = getServiceType(product.slug);

      // Skip shoe and carpet services - they require contact
      if (product.category === 'shoe-cleaning' || product.category === 'carpet-cleaning') {
        console.log(`⏭ Skipping service items for ${product.name} (contact-based service)`);
        continue;
      }

      // For laundry services, create items with appropriate prices
      if (serviceType && ['wash-press', 'press-only', 'dry-clean'].includes(serviceType)) {

        // Add men items
        for (const item of serviceItemsData.men) {
          const priceInfo = priceMapping.men[item.name];
          if (priceInfo && priceInfo[serviceType] !== null && priceInfo[serviceType] !== undefined) {
            allServiceItems.push({
              name: item.name,
              serviceId: product._id,
              category: item.category,
              price: priceInfo[serviceType],
              unit: item.unit,
              description: item.description,
              sortOrder: getSortOrder('men', item.name), // ✅ ADD SORT ORDER
              isActive: true,
              contactForPricing: priceInfo.contactForPricing || false
            });
          }
        }

        // Add women items
        for (const item of serviceItemsData.women) {
          const priceInfo = priceMapping.women[item.name];
          if (priceInfo && priceInfo[serviceType] !== null && priceInfo[serviceType] !== undefined) {
            allServiceItems.push({
              name: item.name,
              serviceId: product._id,
              category: item.category,
              price: priceInfo[serviceType],
              unit: item.unit,
              description: item.description,
              sortOrder: getSortOrder('women', item.name), // ✅ ADD SORT ORDER
              isActive: true,
              contactForPricing: priceInfo.contactForPricing || false
            });
          }
        }

        // Add children items
        for (const item of serviceItemsData.children) {
          const priceInfo = priceMapping.children[item.name];
          if (priceInfo && priceInfo[serviceType] !== null && priceInfo[serviceType] !== undefined) {
            allServiceItems.push({
              name: item.name,
              serviceId: product._id,
              category: item.category,
              price: priceInfo[serviceType],
              unit: item.unit,
              description: item.description,
              sortOrder: getSortOrder('children', item.name), // ✅ ADD SORT ORDER
              isActive: true,
              contactForPricing: priceInfo.contactForPricing || false
            });
          }
        }

        // Add household items
        for (const item of serviceItemsData.household) {
          const priceInfo = priceMapping.household[item.name];
          if (priceInfo && priceInfo[serviceType] !== null && priceInfo[serviceType] !== undefined) {
            allServiceItems.push({
              name: item.name,
              serviceId: product._id,
              category: item.category,
              price: priceInfo[serviceType],
              unit: item.unit,
              description: item.description,
              sortOrder: getSortOrder('household', item.name), // ✅ ADD SORT ORDER
              isActive: true,
              contactForPricing: priceInfo.contactForPricing || false
            });
          }
        }

        // Add special items
        for (const item of serviceItemsData.special) {
          const priceInfo = priceMapping.special[item.name];
          if (priceInfo && priceInfo[serviceType] !== null && priceInfo[serviceType] !== undefined) {
            allServiceItems.push({
              name: item.name,
              serviceId: product._id,
              category: item.category,
              price: priceInfo[serviceType],
              unit: item.unit,
              description: item.description,
              sortOrder: getSortOrder('household', item.name), // ✅ ADD SORT ORDER
              isActive: true,
              contactForPricing: priceInfo.contactForPricing || false
            });
          }
        }
      }

      // For Wash & Fold service (bulk laundry)
      // For Wash & Fold service (bulk laundry)
      if (product.slug.includes('wash-and-fold')) {
        const washFoldItems = [
          {
            name: 'Laundry Bag (Small)',
            category: 'household',
            unit: 'kg',
            price: 20,
            description: 'Per kg rate. Minimum 3 kg required.',
            sortOrder: 1,
            minQuantity: 3  // ✅ ADD MINIMUM QUANTITY
          },
          {
            name: 'Laundry Bag (Medium)',
            category: 'household',
            unit: 'kg',
            price: 20,
            description: 'Per kg rate. Minimum 3 kg required.',
            sortOrder: 2,
            minQuantity: 3  // ✅ ADD MINIMUM QUANTITY
          },
          {
            name: 'Laundry Bag (Large)',
            category: 'household',
            unit: 'kg',
            price: 20,
            description: 'Per kg rate. Minimum 3 kg required.',
            sortOrder: 3,
            minQuantity: 3  // ✅ ADD MINIMUM QUANTITY
          },
        ];

        for (const item of washFoldItems) {
          allServiceItems.push({
            name: item.name,
            serviceId: product._id,
            category: item.category,
            price: item.price,
            unit: item.unit,
            description: item.description,
            sortOrder: item.sortOrder,
            isActive: true,
            contactForPricing: false,
            minQuantity: item.minQuantity  // ✅ ADD TO DATABASE
          });
        }
      }
    }

    // Insert all service items
    if (allServiceItems.length > 0) {
      await ServiceItem.insertMany(allServiceItems);
      console.log(`✅ ${allServiceItems.length} service items seeded`);

      // Log summary by service
      const itemsByService = {};
      for (const item of allServiceItems) {
        if (!itemsByService[item.serviceId]) {
          itemsByService[item.serviceId] = 0;
        }
        itemsByService[item.serviceId]++;
      }

      for (const product of createdProducts) {
        const count = itemsByService[product._id] || 0;
        console.log(`  📦 ${product.name}: ${count} items`);
      }
    } else {
      console.log('⚠ No service items created');
    }

    console.log('🎉 Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedDatabase();