const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Create order
router.post('/', orderController.createOrder);

// Get order by number (track order)
router.get('/track/:orderNumber', orderController.trackOrder);

// Get orders by session
router.get('/session/:sessionId', orderController.getOrdersBySession);

// Update order status
router.patch('/:orderNumber/status', orderController.updateOrderStatus);

module.exports = router;