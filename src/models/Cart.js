const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false,
  },

  // ✅ NEW FIELD (IMPORTANT)
  productSlug: {
    type: String,
    default: null,
  },

  name: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
    min: 0,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },

  image: String,
  category: String,
  description: String,

  serviceItems: [
    {
      itemId: String,
      name: String,
      price: Number,
      quantity: Number,
    },
  ],

  selectedColor: String,
  selectedSize: String,
  designImage: String,
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    items: [cartItemSchema],

    couponCode: {
      type: String,
      default: null,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    subtotal: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


// ✅ FIXED middleware
cartSchema.pre('save', function () {
  this.subtotal = this.items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );

  this.total = Math.max(0, this.subtotal - (this.discountAmount || 0));
});

module.exports = mongoose.model('Cart', cartSchema);