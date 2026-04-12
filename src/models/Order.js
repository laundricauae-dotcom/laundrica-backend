const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.Mixed,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: String,
  serviceItems: [
    {
      itemId: String,
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
});

const trackingHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      'pending','confirmed','processing','picked_up','washing','drying',
      'ironing','quality_check','ready_for_pickup','out_for_delivery',
      'delivered','cancelled'
    ],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  description: String,
  location: String,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    status: {
      type: String,
      enum: [
        'pending','confirmed','processing','picked_up','washing','drying',
        'ironing','quality_check','ready_for_pickup','out_for_delivery',
        'delivered','cancelled'
      ],
      default: 'pending',
    },

    paymentMethod: {
      type: String,
      enum: ['card','cash','wallet'],
      default: 'card',
    },

    tracking: {
      trackingNumber: String,
      currentStatus: { type: String, default: 'pending' },
      history: [trackingHistorySchema],
      estimatedDelivery: Date,
    },

    shippingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
    },

    pickupDetails: {
      date: Date,
      time: String,
      instructions: String,
    },

    specialInstructions: String,
  },
  { timestamps: true }
);

// ✅ FIXED: Use async function WITHOUT calling next()
orderSchema.pre('save', async function() {
  // Generate order number if not exists
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD-${year}${month}-${(count + 1).toString().padStart(5, '0')}`;
  }

  // Generate tracking number if not exists
  if (!this.tracking || !this.tracking.trackingNumber) {
    const { generateTrackingNumber } = require('../utils/tracking');
    if (!this.tracking) {
      this.tracking = {};
    }
    this.tracking.trackingNumber = generateTrackingNumber();
  }
});

module.exports = mongoose.model('Order', orderSchema);