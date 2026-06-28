const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  image: { type: String },
  category: { type: String },
  serviceItems: [{
    itemId: String,
    name: String,
    price: Number,
    quantity: Number,
  }],
  selectedColor: { type: String },
  selectedSize: { type: String },
  designImage: { type: String },
  serviceName: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
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
  timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    customerInfo: {
      full_name: {
        type: String,
        required: true
      },
      mobile: {
        type: String,
        required: true
      },
      email: {
        type: String,
        default: ''
      },
      address: {
        type: String,
        required: true
      },
      city: {
        type: String,
        default: 'Dubai'
      },
      special_instructions: {
        type: String,
        default: ''
      },
    },
    carpetContactEnabled: {
      type: Boolean,
      default: false,
    },
    shoesContactEnabled: {
      type: Boolean,
      default: false,
    },
    zohoDealId: { type: String },
    zohoContactId: { type: String },
    paymentMethod: {
      type: String,
      default: 'cash'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    // NEW: Marketing tracking data
    marketing: {
      type: marketingSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    collection: 'orders',
  }
);

// Compound indexes for common queries
orderSchema.index({ orderNumber: 1, sessionId: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ sessionId: 1, createdAt: -1 });
orderSchema.index({ 'marketing.utm.source': 1 });
orderSchema.index({ 'marketing.utm.campaign': 1 });
orderSchema.index({ 'marketing.geo.country': 1 });

// Static method to get order statistics
orderSchema.statics.getStats = async function () {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$total' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);