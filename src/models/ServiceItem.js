// models/ServiceItem.js
const mongoose = require('mongoose');

const serviceItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['men', 'women', 'children', 'household', 'special'],
      index: true,
    },
    price: { type: Number, required: true },
    unit: String,
    description: String,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    image: { type: String, default: null },
    imagePublicId: { type: String, default: null },
    contactForPricing: { type: Boolean, default: false },
    minQuantity: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    collection: 'serviceitems',
  }
);

// Compound indexes
serviceItemSchema.index({ serviceId: 1, isActive: 1, sortOrder: 1 });
serviceItemSchema.index({ category: 1, isActive: 1, sortOrder: 1 });
serviceItemSchema.index({ serviceId: 1, name: 1 });

module.exports = mongoose.model('ServiceItem', serviceItemSchema);