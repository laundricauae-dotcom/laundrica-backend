const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();


// ==================== ✅ CORS CONFIG (FIXED) ====================
const allowedOrigins = [
  'http://localhost:3000',
  'https://laundrica-l2b5.vercel.app/', // 🔁 replace with your real frontend URL
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
};

// ✅ Apply CORS BEFORE everything
app.use(cors(corsOptions));
app.options('/*', cors(corsOptions)); // 🔥 handle preflight


// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ==================== ROUTES ====================
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const serviceRoutes = require('./routes/service.routes');
const cartRoutes = require('./routes/cart.routes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/cart', cartRoutes);


// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});


// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('❌ ERROR:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});


// ==================== DB CONNECTION ====================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));


// ==================== SERVER ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 API endpoints:`);
  console.log(`   - /api/auth`);
  console.log(`   - /api/products`);
  console.log(`   - /api/orders`);
  console.log(`   - /api/cart`);
  console.log(`   - /api/admin`);
});