const mongoose = require('mongoose');

// Sub-schema for individual image
const productImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
}, { _id: true });

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    comparePrice: {
      type: Number,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ['laundry', 'dry-cleaning', 'steam-pressing', 'shoe-cleaning', 'carpet-cleaning', 'curtain-cleaning', 'commercial', 'apparel', 'uniform', 'accessories'],
    },
    subCategory: String,
    // Updated images field to store objects instead of strings
    images: [productImageSchema],
    icon: String,
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
    },
    features: [String],
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    turnaround: String,
    unit: String,
    sortOrder: {
      type: Number,
      default: 0,
    },
    metaTitle: String,
    metaDescription: String,
  },
  {
    timestamps: true,
  }
);

// Virtual to get only image URLs (for backward compatibility)
productSchema.virtual('imageUrls').get(function() {
  return this.images.map(img => img.url);
});

// Method to get primary image
productSchema.methods.getPrimaryImage = function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || (this.images[0] || null);
};

module.exports = mongoose.model('Product', productSchema);