// cart.routes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { validateSession, rateLimit } = require('../middleware');

const cartRateLimit = rateLimit(15 * 60 * 1000, 50);

router.use(validateSession);

router.get('/:sessionId', cartRateLimit, cartController.getCart);
router.post('/:sessionId/add', cartRateLimit, cartController.addToCart);
router.put('/:sessionId/item/:itemId', cartRateLimit, cartController.updateCartItem);
router.delete('/:sessionId/item/:itemId', cartRateLimit, cartController.removeFromCart);
router.delete('/:sessionId/clear', cartRateLimit, cartController.clearCart);
router.delete('/:sessionId', cartRateLimit, cartController.deleteCart); // NEW: Delete entire cart
router.post('/:sessionId/coupon', cartRateLimit, cartController.applyCoupon);
router.delete('/:sessionId/coupon', cartRateLimit, cartController.removeCoupon);

module.exports = router;