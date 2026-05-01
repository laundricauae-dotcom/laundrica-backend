const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, default: null },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: String,
  serviceItems: [{
    itemId: String,
    name: String,
    price: Number,
    quantity: Number,
  }],
  selectedColor: String,
  selectedSize: String,
  designImage: String,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    sessionId: { type: String, required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    deliveryFee: { type: Number, default: 15 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending',
    },
    customerInfo: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: '' },
      address: { type: String, required: true },
      city: { type: String, default: 'Dubai' },
      notes: { type: String, default: '' },
    },
    // WhatsApp tracking
    whatsappMessageId: { type: String, default: null },
    whatsappSent: { type: Boolean, default: false },
    whatsappSentAt: { type: Date, default: null },
    // Zoho CRM tracking
    zohoSynced: { type: Boolean, default: false },
    zohoDealId: { type: String, default: null },
    zohoContactId: { type: String, default: null },
    zohoSyncedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Generate order number before saving
orderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD-${year}${month}-${(count + 1).toString().padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('Order', orderSchema);