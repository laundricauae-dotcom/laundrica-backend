// models/Product.js
const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  alt: { type: String, default: '' },
  isPrimary: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { _id: true });

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    category: {
      type: String,
      required: true,
      enum: [
        'laundry',
        'dry-cleaning',
        'wash-and-fold',
        'steam-ironing',
        'shoe-cleaning',
        'carpet-cleaning',
        'curtain-cleaning',
        'commercial',
        'apparel',
        'uniform',
        'accessories'
      ],
      index: true,
    },
    subCategory: String,
    images: [productImageSchema],
    icon: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0 },
    features: [String],
    tags: [String],
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    turnaround: String,
    unit: String,
    sortOrder: { type: Number, default: 0 },
    metaTitle: String,
    metaDescription: String,
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

// Compound indexes for common queries
productSchema.index({ category: 1, isActive: 1, sortOrder: 1 });
productSchema.index({ isFeatured: 1, isActive: 1, sortOrder: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Virtuals
productSchema.virtual('imageUrls').get(function () {
  return this.images.map(img => img.url);
});

productSchema.methods.getPrimaryImage = function () {
  const primary = this.images.find(img => img.isPrimary);
  return primary || (this.images[0] || null);
};

// Static methods
productSchema.statics.getActiveCategories = async function () {
  return await this.distinct('category', { isActive: true });
};

module.exports = mongoose.model('Product', productSchema);