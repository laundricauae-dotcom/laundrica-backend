// src/routes/order.routes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { orderLimiter, standardLimiter } = require('../middleware/rateLimit');
const validateOrder = require('../middleware/validateOrder');

// Create order with strict rate limiting
router.post('/', orderLimiter, validateOrder, orderController.createOrder);

// Track order
router.get('/track/:orderNumber', standardLimiter, orderController.trackOrder);

// Get orders by session
router.get('/session/:sessionId', standardLimiter, orderController.getOrdersBySession);

// Update order status
router.patch('/:orderNumber/status', standardLimiter, orderController.updateOrderStatus);

module.exports = router;