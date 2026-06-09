const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const compression = require('compression');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import middlewares
const {
  logger,
  rateLimit,
  errorHandler,
  corsMiddleware,
  securityHeaders,
  sanitize,
  cacheMiddleware,
} = require('./middleware');

const app = express();

// ========== GLOBAL MIDDLEWARES ==========
app.use(corsMiddleware);
app.use(securityHeaders);

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.path && req.path.startsWith('/api/')) {
      return false;
    }
    return true;
  }
}));

app.use(logger);
app.use(sanitize);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimit(15 * 60 * 1000, 100));

// Routes
const orderRoutes = require('./routes/order.routes');
const cartRoutes = require('./routes/cart.routes');
const productRoutes = require('./routes/product.routes');
const serviceRoutes = require('./routes/service.routes');
const webhookRoutes = require('./routes/webhook.routes');
const contactRoutes = require('./routes/contact.routes');

// IMPORTANT: Register all routes
app.use('/api/products', cacheMiddleware(300), productRoutes);
app.use('/api/services', cacheMiddleware(300), serviceRoutes);
app.use('/api/orders', orderRoutes);  // This includes your updated order controller
app.use('/api/cart', cartRoutes);
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
app.use(errorHandler);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 API endpoints:`);
  console.log(`   - POST   /api/orders - Create order (with Zoho Flow)`);
  console.log(`   - GET    /api/orders/track/:id - Track order`);
  console.log(`   - POST   /api/orders/:orderNumber/resync - Resync to Zoho`);
  console.log(`   - GET    /api/products - Get products`);
  console.log(`   - GET    /api/services - Get services`);
  console.log(`   - GET    /api/cart/:sessionId - Get cart`);
  console.log(`   - POST   /api/cart/:sessionId/add - Add to cart`);
});

module.exports = app;