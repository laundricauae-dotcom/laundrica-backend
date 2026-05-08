
const Cart = require('../models/Cart');
const { v4: uuidv4 } = require('uuid');

// Helper to get or validate session
const getSessionCart = async (sessionId) => {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = await Cart.create({ sessionId, items: [] });
    }
    return cart;
  } catch (error) {
    // Handle duplicate key error by fetching existing cart
    if (error.code === 11000) {
      const existingCart = await Cart.findOne({ sessionId });
      if (existingCart) return existingCart;
    }
    throw error;
  }
};

// Get cart
exports.getCart = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

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

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Product name and price are required' });
    }

    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = await Cart.create({ sessionId, items: [] });
    }

    // Generate a unique item ID if not provided
    const itemId = productId || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if item exists with same productId, color, and size
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === itemId &&
        item.selectedColor === selectedColor &&
        item.selectedSize === selectedSize
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({
        productId: itemId,
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

    // Return updated cart
    const updatedCart = await Cart.findOne({ sessionId });

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart: {
        sessionId: updatedCart.sessionId,
        items: updatedCart.items,
        itemCount: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: updatedCart.subtotal,
        total: updatedCart.total,
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

    if (!sessionId || !itemId) {
      return res.status(400).json({ success: false, message: 'Session ID and Item ID are required' });
    }

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

    const updatedCart = await Cart.findOne({ sessionId });

    res.status(200).json({
      success: true,
      message: quantity <= 0 ? 'Item removed' : 'Cart updated',
      cart: {
        sessionId: updatedCart.sessionId,
        items: updatedCart.items,
        itemCount: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: updatedCart.subtotal,
        total: updatedCart.total,
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

    if (!sessionId || !itemId) {
      return res.status(400).json({ success: false, message: 'Session ID and Item ID are required' });
    }

    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const originalLength = cart.items.length;
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    if (cart.items.length === originalLength) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    await cart.save();

    const updatedCart = await Cart.findOne({ sessionId });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: {
        sessionId: updatedCart.sessionId,
        items: updatedCart.items,
        itemCount: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: updatedCart.subtotal,
        total: updatedCart.total,
      },
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Clear cart - COMPLETELY DELETE ALL ITEMS
exports.clearCart = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const cart = await Cart.findOne({ sessionId });
    if (cart) {
      // Clear all items and reset coupon
      cart.items = [];
      cart.couponCode = null;
      cart.discountAmount = 0;
      cart.subtotal = 0;
      cart.total = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart: { items: [], itemCount: 0, subtotal: 0, total: 0 },
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete cart completely (for cleanup after order)
exports.deleteCart = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const result = await Cart.findOneAndDelete({ sessionId });

    res.status(200).json({
      success: true,
      message: result ? 'Cart deleted successfully' : 'Cart not found',
    });
  } catch (error) {
    console.error('Delete cart error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Apply coupon
exports.applyCoupon = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code } = req.body;

    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

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