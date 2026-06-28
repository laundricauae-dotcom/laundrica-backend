const cartService = require('../services/cart.service');
const couponService = require('../services/coupon.service');
const marketingService = require('../services/marketing.service');
const logger = require('../utils/logger');

exports.getCart = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const cart = await cartService.getCart(sessionId);

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const itemData = req.body;

    if (!itemData.name || !itemData.price) {
      const error = new Error('Product name and price are required');
      error.statusCode = 400;
      throw error;
    }

    // Collect marketing data and store with cart
    const marketingData = marketingService.collectMarketingData(req);
    const cart = await cartService.addItem(sessionId, itemData, marketingData);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { sessionId, itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      const error = new Error('Quantity is required');
      error.statusCode = 400;
      throw error;
    }

    const cart = await cartService.updateItem(sessionId, itemId, quantity);

    res.status(200).json({
      success: true,
      message: quantity <= 0 ? 'Item removed' : 'Cart updated',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { sessionId, itemId } = req.params;

    const cart = await cartService.removeItem(sessionId, itemId);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const cart = await cartService.clearCart(sessionId);

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCart = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const deleted = await cartService.deleteCart(sessionId);

    res.status(200).json({
      success: true,
      message: deleted ? 'Cart deleted successfully' : 'Cart not found',
    });
  } catch (error) {
    next(error);
  }
};

exports.applyCoupon = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { code } = req.body;

    if (!code) {
      const error = new Error('Coupon code is required');
      error.statusCode = 400;
      throw error;
    }

    const cart = await cartService.getOrCreateCart(sessionId);

    if (cart.items.length === 0) {
      const error = new Error('Cart is empty');
      error.statusCode = 400;
      throw error;
    }

    const result = couponService.calculateDiscount(cart.subtotal, code);

    cart.couponCode = result.code;
    cart.discountAmount = result.discountAmount;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Coupon applied',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeCoupon = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const cart = await cartService.getOrCreateCart(sessionId);
    cart.couponCode = null;
    cart.discountAmount = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Coupon removed',
    });
  } catch (error) {
    next(error);
  }
};