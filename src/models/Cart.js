const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, default: null },
  productSlug: { type: String, default: null },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  image: { type: String, default: null },
  category: { type: String, default: 'general' },
  description: { type: String, default: '' },
  serviceItems: [{
    itemId: String,
    name: String,
    price: Number,
    quantity: Number,
  }],
  selectedColor: { type: String, default: null },
  selectedSize: { type: String, default: null },
  designImage: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
});

const marketingSchema = new mongoose.Schema({
  utm: {
    source: { type: String, default: '' },
    medium: { type: String, default: '' },
    campaign: { type: String, default: '' },
    term: { type: String, default: '' },
    content: { type: String, default: '' },
  },
  clickIds: {
    gclid: { type: String, default: '' },
    fbclid: { type: String, default: '' },
    msclkid: { type: String, default: '' },
  },
  geo: {
    ip: { type: String, default: '' },
    country: { type: String, default: '' },
    region: { type: String, default: '' },
    city: { type: String, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    timezone: { type: String, default: '' },
  },
  browser: {
    name: { type: String, default: '' },
    version: { type: String, default: '' },
    os: { type: String, default: '' },
    deviceType: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    language: { type: String, default: '' },
  },
  page: {
    referrer: { type: String, default: '' },
    landingPage: { type: String, default: '' },
    currentPage: { type: String, default: '' },
  },
  sessionId: { type: String, default: '' },
});

const cartSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    couponCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    customerInfo: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
    },
    marketing: {
      type: marketingSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    collection: 'carts',
  }
);

// Pre-save middleware
cartSchema.pre('save', function () {
  this.subtotal = this.items.reduce(
    (sum, item) => sum + (item.price * item.quantity), 0
  );
  this.total = Math.max(0, this.subtotal - (this.discountAmount || 0));
});

module.exports = mongoose.model('Cart', cartSchema);