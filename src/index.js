const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const compression = require('compression'); // Add this import

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
  // compress, // Remove from here - we'll configure manually
  cacheMiddleware,
} = require('./middleware');

const app = express();

// ========== GLOBAL MIDDLEWARES ==========
app.use(corsMiddleware);           // CORS first
app.use(securityHeaders);          // Security headers

// Configure compression properly
app.use(compression({
  level: 6,
  threshold: 1024,
  // Don't compress API routes
  filter: (req, res) => {
    if (req.path && req.path.startsWith('/api/')) {
      return false; // Skip compression for API routes
    }
    return true; // Compress everything else
  }
}));

app.use(logger);                   // Request logging
app.use(sanitize);                 // Input sanitization
app.use(express.json({ limit: '10mb' }));  // JSON parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (100 requests per 15 minutes)
app.use(rateLimit(15 * 60 * 1000, 100));

// Routes
const orderRoutes = require('./routes/order.routes');
const cartRoutes = require('./routes/cart.routes');
const productRoutes = require('./routes/product.routes');
const serviceRoutes = require('./routes/service.routes');
const webhookRoutes = require('./routes/webhook.routes');
const contactRoutes = require('./routes/contact.routes');


// Apply cache to GET routes (5 minutes cache)
app.use('/api/products', cacheMiddleware(300), productRoutes);
app.use('/api/services', cacheMiddleware(300), serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/contact', contactRoutes);
app.use('/webhook', webhookRoutes);

// Health check (no cache)
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

// Global error handler (must be last)
app.use(errorHandler);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 API endpoints:`);
  console.log(`   - GET    /api/products`);
  console.log(`   - GET    /api/services`);
  console.log(`   - POST   /api/orders`);
  console.log(`   - GET    /api/orders/track/:id`);
  console.log(`   - GET    /api/cart/:sessionId`);
  console.log(`   - POST   /api/cart/:sessionId/add`);
  console.log(`   - POST   /webhook/zoho/order-update`);
});