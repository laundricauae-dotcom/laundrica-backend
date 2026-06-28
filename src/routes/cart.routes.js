// src/routes/cart.routes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const validateSession = require('../middleware/validateSession');
const { standardLimiter } = require('../middleware/rateLimit');

// Apply session validation to all cart routes
router.use(validateSession);

// Cart routes
router.get('/:sessionId', standardLimiter, cartController.getCart);
router.post('/:sessionId/add', standardLimiter, cartController.addToCart);
router.put('/:sessionId/item/:itemId', standardLimiter, cartController.updateCartItem);
router.delete('/:sessionId/item/:itemId', standardLimiter, cartController.removeFromCart);
router.delete('/:sessionId/clear', standardLimiter, cartController.clearCart);
router.delete('/:sessionId', standardLimiter, cartController.deleteCart);
router.post('/:sessionId/coupon', standardLimiter, cartController.applyCoupon);
router.delete('/:sessionId/coupon', standardLimiter, cartController.removeCoupon);

module.exports = router;