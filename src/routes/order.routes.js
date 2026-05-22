const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { validateOrder, rateLimit } = require('../middleware');

// Stricter rate limit for order creation (10 per 15 minutes)
const orderRateLimit = rateLimit(15 * 60 * 1000, 10);

// Public routes
router.post('/', validateOrder, orderRateLimit, orderController.createOrder);
router.get('/track/:orderNumber', orderController.getOrderByNumber); // Changed from trackOrder to getOrderByNumber
router.get('/session/:sessionId', orderController.getOrdersBySession);
router.put('/:orderNumber/status', orderController.updateOrderStatus);
router.post('/:orderNumber/resync', orderController.resyncToZoho);

module.exports = router;