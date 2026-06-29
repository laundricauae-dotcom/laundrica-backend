const Cart = require('../models/Cart');
const logger = require('../utils/logger');

class CartService {
    async getOrCreateCart(sessionId, marketingData = null) {
        if (!sessionId) {
            throw new Error('Session ID is required');
        }

        try {
            let cart = await Cart.findOne({ sessionId });
            if (!cart) {
                cart = await Cart.create({
                    sessionId,
                    items: [],
                    marketing: marketingData || {},
                });
                logger.debug(`Created new cart for session: ${sessionId}`);
            } else if (marketingData && !cart.marketing) {
                // Update marketing data if cart exists but has no marketing data
                cart.marketing = marketingData;
                await cart.save();
            }
            return cart;
        } catch (error) {
            if (error.code === 11000) {
                const existingCart = await Cart.findOne({ sessionId });
                if (existingCart) return existingCart;
            }
            throw error;
        }
    }

    async getCart(sessionId) {
        const cart = await this.getOrCreateCart(sessionId);
        return this.formatCartResponse(cart);
    }

    async addItem(sessionId, itemData, marketingData = null) {
        const {
            productId, name, price, quantity = 1,
            image, category, description, serviceItems,
            selectedColor, selectedSize, designImage
        } = itemData;

        const cart = await this.getOrCreateCart(sessionId, marketingData);

        const itemId = productId || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
        return this.formatCartResponse(cart);
    }

    async updateItem(sessionId, itemId, quantity) {
        const cart = await this.getOrCreateCart(sessionId);

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            throw new Error('Item not found');
        }

        if (quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = parseInt(quantity);
        }

        await cart.save();
        return this.formatCartResponse(cart);
    }

    async removeItem(sessionId, itemId) {
        const cart = await this.getOrCreateCart(sessionId);

        const originalLength = cart.items.length;
        cart.items = cart.items.filter(item => item._id.toString() !== itemId);

        if (cart.items.length === originalLength) {
            throw new Error('Item not found');
        }

        await cart.save();
        return this.formatCartResponse(cart);
    }

    async clearCart(sessionId) {
        const cart = await Cart.findOne({ sessionId });
        if (cart) {
            cart.items = [];
            cart.couponCode = null;
            cart.discountAmount = 0;
            cart.subtotal = 0;
            cart.total = 0;
            await cart.save();
        }
        return { items: [], itemCount: 0, subtotal: 0, total: 0 };
    }

    async deleteCart(sessionId) {
        const result = await Cart.findOneAndDelete({ sessionId });
        return !!result;
    }

    formatCartResponse(cart) {
        return {
            sessionId: cart.sessionId,
            items: cart.items,
            subtotal: cart.subtotal,
            discountAmount: cart.discountAmount,
            total: cart.total,
            couponCode: cart.couponCode,
            itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        };
    }
}

module.exports = new CartService();