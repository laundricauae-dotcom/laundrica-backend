const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const compression = require('compression');
const cors = require('cors');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

/* ===========================
   CORS
=========================== */
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman, mobile apps, server-side requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Session-Id',
      'Accept',
    ],
  })
);

app.options('*', cors());

/* ===========================
   MIDDLEWARE
=========================== */
app.use(
  compression({
    level: 6,
    threshold: 1024,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ===========================
   REQUEST LOGGER
=========================== */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

/* ===========================
   ROUTES
=========================== */
const orderRoutes = require('./routes/order.routes');
const cartRoutes = require('./routes/cart.routes');
const productRoutes = require('./routes/product.routes');
const serviceRoutes = require('./routes/service.routes');
const webhookRoutes = require('./routes/webhook.routes');
const contactRoutes = require('./routes/contact.routes');

app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/contact', contactRoutes);
app.use('/webhook', webhookRoutes);

/* ===========================
   HEALTH CHECK
=========================== */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server running successfully',
    mongodb:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

/* ===========================
   ROOT ROUTE
=========================== */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Laundrica Backend API',
  });
});

/* ===========================
   404
=========================== */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

/* ===========================
   ERROR HANDLER
=========================== */
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

/* ===========================
   DATABASE
=========================== */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(
        `🌐 Health Check: http://localhost:${PORT}/api/health`
      );
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Failed');
    console.error(err);
    process.exit(1);
  });

module.exports = app;