const mongoose = require('mongoose');

const serviceItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    category: { type: String, required: true, enum: ['men', 'women', 'children', 'household'] },
    price: { type: Number, required: true },
    unit: String,
    description: String,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    image: { type: String, default: null },
    imagePublicId: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceItem', serviceItemSchema);