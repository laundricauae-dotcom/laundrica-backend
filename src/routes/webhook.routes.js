// src/routes/webhook.routes.js
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Health check for Zoho webhook verification
router.get('/zoho/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// Zoho webhook endpoint for order updates
router.post('/zoho/order-update', async (req, res) => {
    try {
        logger.info('Zoho webhook received');

        const { module, operation, data } = req.body;

        if (module === 'Deals' && data && data.length > 0) {
            const dealData = data[0];
            const orderNumber = dealData.$laundrica_order_number;
            const dealStage = dealData.Stage;

            // Map Zoho stage to order status
            const statusMap = {
                'Qualification': 'pending',
                'Needs Analysis': 'processing',
                'Closed Won': 'completed',
                'Closed Lost': 'cancelled',
            };

            const status = statusMap[dealStage] || 'pending';

            if (orderNumber) {
                const Order = require('../models/Order');
                await Order.findOneAndUpdate(
                    { orderNumber },
                    { status },
                    { new: true }
                );
                logger.info(`Order ${orderNumber} status updated from Zoho: ${status}`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        logger.error('Zoho webhook error:', error);
        res.sendStatus(500);
    }
});

module.exports = router;