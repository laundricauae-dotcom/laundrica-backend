const Order = require('../models/Order');
const Cart = require('../models/Cart');
const queues = require('../config/bull');
const marketingService = require('./marketing.service');
const logger = require('../utils/logger');

class OrderService {
    async createOrder(orderData) {
        const {
            sessionId,
            items,
            subtotal,
            deliveryFee = 0,
            tax = 0,
            discount = 0,
            total,
            customerInfo,
            carpetContactEnabled = false,
            shoesContactEnabled = false,
            marketing = {}, // Accept marketing data from controller
        } = orderData;

        // Validate required fields
        this.validateOrder(orderData);

        // Generate order number
        const orderNumber = this.generateOrderNumber();

        // Build customer info
        const customerInfoData = {
            full_name: (customerInfo.full_name || customerInfo.name || '').trim(),
            mobile: (customerInfo.mobile || customerInfo.phone || '').trim(),
            email: (customerInfo.email || '').trim(),
            address: (customerInfo.address || '').trim(),
            city: (customerInfo.city || 'Dubai').trim(),
            special_instructions: (customerInfo.special_instructions || customerInfo.notes || '').trim(),
        };

        // Validate and clean items
        const validatedItems = items.map(item => ({
            productId: item.productId || item.id || 'unknown',
            name: item.name || 'Unknown Item',
            price: typeof item.price === 'number' ? item.price : 0,
            quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
            image: item.image || '',
            category: item.category || '',
            serviceItems: Array.isArray(item.serviceItems) ? item.serviceItems : [],
            selectedColor: item.selectedColor || null,
            selectedSize: item.selectedSize || null,
            designImage: item.designImage || null,
            serviceName: item.serviceName || '',
            metadata: item.metadata || {},
        }));

        // Calculate totals
        const calculatedSubtotal = validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const calculatedTotal = calculatedSubtotal + deliveryFee + tax - discount;

        // Prepare marketing data
        const marketingData = {
            ...marketing,
            sessionId: sessionId.trim(),
        };

        // Create order object
        const orderDoc = new Order({
            orderNumber,
            sessionId: sessionId.trim(),
            items: validatedItems,
            subtotal: typeof subtotal === 'number' ? subtotal : calculatedSubtotal,
            deliveryFee: typeof deliveryFee === 'number' ? deliveryFee : 0,
            tax: typeof tax === 'number' ? tax : 0,
            discount: typeof discount === 'number' ? discount : 0,
            total: typeof total === 'number' ? total : calculatedTotal,
            customerInfo: customerInfoData,
            carpetContactEnabled: Boolean(carpetContactEnabled),
            shoesContactEnabled: Boolean(shoesContactEnabled),
            status: 'pending',
            marketing: marketingData,
        });

        // Save to database
        await orderDoc.save();

        logger.info(`Order created: ${orderNumber}`);

        // Queue background jobs with marketing data
        await this.queueBackgroundJobs(orderDoc, customerInfoData, marketingData);

        // Clear cart asynchronously
        this.clearCartAsync(sessionId);

        return orderDoc;
    }

    validateOrder(data) {
        const errors = [];

        if (!data.sessionId || data.sessionId.trim() === '') {
            errors.push('Session ID is required');
        }

        if (!data.items || data.items.length === 0) {
            errors.push('No items in order');
        }

        if (!data.customerInfo) {
            errors.push('Customer information is required');
        } else {
            const customerName = data.customerInfo.full_name || data.customerInfo.name || '';
            const customerPhone = data.customerInfo.mobile || data.customerInfo.phone || '';
            const customerAddress = data.customerInfo.address || '';

            if (!customerName || customerName.trim().length < 2) {
                errors.push('Customer name is required (minimum 2 characters)');
            }

            if (!customerPhone || customerPhone.trim().length < 5) {
                errors.push('Customer phone number is required');
            }

            if (!customerAddress || customerAddress.trim().length < 3) {
                errors.push('Customer address is required');
            }
        }

        if (errors.length > 0) {
            const error = new Error('Validation failed');
            error.errors = errors;
            error.statusCode = 400;
            throw error;
        }
    }

    generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `ORD-${year}${month}${day}-${random}`;
    }

    async queueBackgroundJobs(order, customerInfo, marketingData) {
        try {
            // Format marketing data for Zoho
            const zohoMarketingData = marketingService.formatForZoho(marketingData);

            await queues.zohoWebhook.add({
                orderId: order._id,
                orderNumber: order.orderNumber,
                customerInfo,
                marketing: zohoMarketingData,
            }, {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
            });

            await queues.emailNotifications.add({
                orderId: order._id,
                orderNumber: order.orderNumber,
                customerInfo,
                total: order.total,
                marketing: marketingData,
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });

            logger.debug(`Queued background jobs for order ${order.orderNumber}`);
        } catch (error) {
            logger.error(`Failed to queue background jobs for order ${order.orderNumber}:`, error);
        }
    }

    async clearCartAsync(sessionId) {
        try {
            await Cart.findOneAndDelete({ sessionId });
            logger.debug(`Cart cleared for session: ${sessionId}`);
        } catch (error) {
            logger.error(`Failed to clear cart for session ${sessionId}:`, error);
        }
    }

    async getOrderByNumber(orderNumber) {
        return await Order.findOne({ orderNumber }).lean();
    }

    async getOrdersBySession(sessionId) {
        return await Order.find({ sessionId })
            .sort({ createdAt: -1 })
            .lean();
    }

    async updateOrderStatus(orderNumber, status) {
        const order = await Order.findOne({ orderNumber });
        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        }

        order.status = status;
        await order.save();
        return order;
    }
}

module.exports = new OrderService();