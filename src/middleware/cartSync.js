const Cart = require('../models/Cart');

// Sync local cart with server after login
exports.syncCartAfterLogin = async (req, res, next) => {
  try {
    const { localCart } = req.body;
    
    if (localCart && localCart.items && localCart.items.length > 0) {
      let userCart = await Cart.findOne({ user: req.user.id });
      
      if (!userCart) {
        userCart = await Cart.create({ user: req.user.id, items: [] });
      }
      
      // Merge local cart items
      for (const localItem of localCart.items) {
        const existingItemIndex = userCart.items.findIndex(
          item => item.productId.toString() === localItem.productId &&
                  item.selectedColor === localItem.selectedColor &&
                  item.selectedSize === localItem.selectedSize
        );
        
        if (existingItemIndex > -1) {
          userCart.items[existingItemIndex].quantity += localItem.quantity;
        } else {
          userCart.items.push(localItem);
        }
      }
      
      await userCart.save();
    }
    
    next();
  } catch (error) {
    console.error('Cart sync error:', error);
    next();
  }
};