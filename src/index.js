const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const compression = require('compression');
const cors = require('cors');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// ========== GLOBAL MIDDLEWARES ==========
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(compression({
  level: 6,
  threshold: 1024,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// Routes
const orderRoutes = require('./routes/order.routes');
const cartRoutes = require('./routes/cart.routes');
const productRoutes = require('./routes/product.routes');
const serviceRoutes = require('./routes/service.routes');
const webhookRoutes = require('./routes/webhook.routes');
const contactRoutes = require('./routes/contact.routes');

// Register routes
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/contact', contactRoutes);
app.use('/webhook', webhookRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running 🚀',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laundrica')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 API endpoints:`);
  console.log(`   - POST   /api/orders - Create order (with Zoho Flow)`);
  console.log(`   - GET    /api/orders/track/:id - Track order`);
  console.log(`   - GET    /api/orders/session/:sessionId - Get orders by session`);
  console.log(`   - PATCH  /api/orders/:orderNumber/status - Update order status`);
  console.log(`   - POST   /webhook/zoho/order-update - Zoho webhook endpoint`);
  console.log(`   - GET    /webhook/zoho/health - Zoho webhook health check`);
});

module.exports = app;