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

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
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
  },
  { timestamps: true }
);

// Index for faster queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Order', orderSchema);