// controllers/cart.controller.js
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.productId', 'name price images inStock');
    
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    
    // Transform items to match frontend expected format
    const transformedItems = cart.items.map(item => ({
      id: item._id.toString(),
      productId: item.productId?._id || item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      category: item.category,
      description: item.description,
      serviceItems: item.serviceItems || [],
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      designImage: item.designImage,
    }));
    
    res.status(200).json({
      success: true,
      cart: {
        ...cart.toObject(),
        items: transformedItems,
      },
      items: transformedItems,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { 
      productId, name, price, quantity = 1, 
      image, category, description, serviceItems,
      selectedColor, selectedSize, designImage 
    } = req.body;
    
    console.log('Adding to cart:', { productId, name, price, quantity, userId: req.user.id });
    
    // Validate required fields
    if (!productId && !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID or name is required' 
      });
    }
    
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    
    // Check if product already exists in cart with same options
    const existingItemIndex = cart.items.findIndex(
      item => item.productId?.toString() === productId && 
              item.selectedColor === selectedColor && 
              item.selectedSize === selectedSize
    );
    
    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
     const isValidObjectId = mongoose.Types.ObjectId.isValid(productId);

cart.items.push({
  productId: isValidObjectId ? productId : null,
  productSlug: isValidObjectId ? null : productId,

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
    
    // Populate product details if productId exists
    if (productId) {
      await cart.populate('items.productId', 'name price images inStock');
    }
    
    // Transform items for response
    const transformedItems = cart.items.map(item => ({
      id: item._id.toString(),
      productId: item.productId?._id || item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      category: item.category,
      description: item.description,
      serviceItems: item.serviceItems,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      designImage: item.designImage,
    }));
    
    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      cart: {
        ...cart.toObject(),
        items: transformedItems,
      },
      items: transformedItems,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Item ID is required' 
      });
    }
    
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found in cart' 
      });
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = parseInt(quantity);
    }
    
    await cart.save();
    
    if (cart.items.length > 0) {
      await cart.populate('items.productId', 'name price images inStock');
    }
    
    const transformedItems = cart.items.map(item => ({
      id: item._id.toString(),
      productId: item.productId?._id || item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      category: item.category,
      description: item.description,
      serviceItems: item.serviceItems,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      designImage: item.designImage,
    }));
    
    res.status(200).json({
      success: true,
      cart: {
        ...cart.toObject(),
        items: transformedItems,
      },
      items: transformedItems,
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Item ID is required' 
      });
    }
    
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }
    
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();
    
    if (cart.items.length > 0) {
      await cart.populate('items.productId', 'name price images inStock');
    }
    
    const transformedItems = cart.items.map(item => ({
      id: item._id.toString(),
      productId: item.productId?._id || item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      category: item.category,
      description: item.description,
      serviceItems: item.serviceItems,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      designImage: item.designImage,
    }));
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: {
        ...cart.toObject(),
        items: transformedItems,
      },
      items: transformedItems,
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }
    
    cart.items = [];
    cart.couponCode = null;
    cart.discountAmount = 0;
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart: { items: [] },
      items: [],
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get cart count (for header badge)
exports.getCartCount = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
    
    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Apply coupon to cart
exports.applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon code is required' 
      });
    }
    
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }
    
    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Find coupon
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() },
    });
    
    if (!coupon) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired coupon code' 
      });
    }
    
    // Check minimum purchase requirement
    if (subtotal < coupon.minPurchase) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum purchase of AED ${coupon.minPurchase} required for this coupon` 
      });
    }
    
    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon usage limit has been reached' 
      });
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }
    
    cart.couponCode = coupon.code;
    cart.discountAmount = discountAmount;
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      cart: {
        ...cart.toObject(),
        subtotal,
        total: subtotal - discountAmount,
      },
      discountAmount,
      total: subtotal - discountAmount,
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Remove coupon from cart
exports.removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }
    
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cart.couponCode = null;
    cart.discountAmount = 0;
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Coupon removed successfully',
      cart: {
        ...cart.toObject(),
        subtotal,
        total: subtotal,
      },
    });
  } catch (error) {
    console.error('Remove coupon error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Merge guest cart with user cart (after login)
exports.mergeCart = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items array is required' 
      });
    }
    
    let userCart = await Cart.findOne({ user: req.user.id });
    
    if (!userCart) {
      userCart = await Cart.create({ user: req.user.id, items: [] });
    }
    
    // Merge guest items with user cart
    for (const guestItem of items) {
      const existingItemIndex = userCart.items.findIndex(
        item => item.productId?.toString() === guestItem.productId &&
                item.selectedColor === guestItem.selectedColor &&
                item.selectedSize === guestItem.selectedSize
      );
      
      if (existingItemIndex > -1) {
        userCart.items[existingItemIndex].quantity += guestItem.quantity;
      } else {
        userCart.items.push({
          productId: guestItem.productId || null,
          name: guestItem.name,
          price: guestItem.price,
          quantity: guestItem.quantity,
          image: guestItem.image || null,
          category: guestItem.category || 'general',
          description: guestItem.description || '',
          serviceItems: guestItem.serviceItems || [],
          selectedColor: guestItem.selectedColor || null,
          selectedSize: guestItem.selectedSize || null,
          designImage: guestItem.designImage || null,
        });
      }
    }
    
    await userCart.save();
    
    if (userCart.items.length > 0) {
      await userCart.populate('items.productId', 'name price images inStock');
    }
    
    const transformedItems = userCart.items.map(item => ({
      id: item._id.toString(),
      productId: item.productId?._id || item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      category: item.category,
      description: item.description,
      serviceItems: item.serviceItems,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      designImage: item.designImage,
    }));
    
    res.status(200).json({
      success: true,
      message: 'Cart merged successfully',
      cart: {
        ...userCart.toObject(),
        items: transformedItems,
      },
      items: transformedItems,
    });
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};