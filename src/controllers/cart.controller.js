const Cart = require('../models/Cart');
const { v4: uuidv4 } = require('uuid');

// Helper to get or validate session
const getSessionCart = async (sessionId) => {
  let cart = await Cart.findOne({ sessionId });
  if (!cart) {
    cart = await Cart.create({ sessionId, items: [] });
  }
  return cart;
};

// Get cart
exports.getCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const cart = await getSessionCart(sessionId);

    res.status(200).json({
      success: true,
      cart: {
        sessionId: cart.sessionId,
        items: cart.items,
        subtotal: cart.subtotal,
        discountAmount: cart.discountAmount,
        total: cart.total,
        couponCode: cart.couponCode,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      productId, name, price, quantity = 1,
      image, category, description, serviceItems,
      selectedColor, selectedSize, designImage
    } = req.body;

    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = await Cart.create({ sessionId, items: [] });
    }

    // Check if item exists
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === productId &&
        item.selectedColor === selectedColor &&
        item.selectedSize === selectedSize
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId: productId || null,
        name,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        image: image || null,
        category: category || 'general',
        description: description || '',
        serviceItems: serviceItems || [],
        selectedColor: selectedColor || null,
        selectedSize: selectedSize || null,
        designImage: designImage || null,
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart: {
        sessionId: cart.sessionId,
        items: cart.items,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update cart item
exports.updateCartItem = async (req, res) => {
  try {
    const { sessionId, itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = parseInt(quantity);
    }

    await cart.save();

    res.status(200).json({
      success: true,
      cart: {
        sessionId: cart.sessionId,
        items: cart.items,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { sessionId, itemId } = req.params;

    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed',
      cart: {
        sessionId: cart.sessionId,
        items: cart.items,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const cart = await Cart.findOne({ sessionId });
    if (cart) {
      cart.items = [];
      cart.couponCode = null;
      cart.discountAmount = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart: { items: [], itemCount: 0 },
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Apply coupon (simplified)
exports.applyCoupon = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code } = req.body;

    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Simple coupon check (you can expand this)
    const validCoupons = {
      'WELCOME10': { type: 'percentage', value: 10, minPurchase: 50, maxDiscount: 50 },
      'LAUNDRICA20': { type: 'percentage', value: 20, minPurchase: 100, maxDiscount: 100 },
      'FREE15': { type: 'fixed', value: 15, minPurchase: 75 },
    };

    const coupon = validCoupons[code.toUpperCase()];

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid coupon code' });
    }

    if (cart.subtotal < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of AED ${coupon.minPurchase} required`
      });
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (cart.subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    cart.couponCode = code.toUpperCase();
    cart.discountAmount = discountAmount;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Coupon applied',
      discountAmount,
      total: cart.subtotal - discountAmount,
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Remove coupon
exports.removeCoupon = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const cart = await Cart.findOne({ sessionId });
    if (cart) {
      cart.couponCode = null;
      cart.discountAmount = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Coupon removed',
    });
  } catch (error) {
    console.error('Remove coupon error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};