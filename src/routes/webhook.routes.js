const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

/**
 * Webhook endpoint for Zoho CRM to send updates back to your system [citation:3]
 * Set this URL in Zoho CRM: https://yourdomain.com/webhook/zoho/order-update
 */
router.post('/zoho/order-update', async (req, res) => {
    try {
        console.log('📨 Zoho webhook received:', JSON.stringify(req.body, null, 2));

        const { module, operation, data } = req.body;

        if (module === 'Deals' && data && data.length > 0) {
            const dealData = data[0];
            const orderNumber = dealData.$laundrica_order_number;
            const dealStage = dealData.Stage;

            // Map Zoho stage back to internal status
            const statusMap = {
                'Qualification': 'pending',
                'Needs Analysis': 'processing',
                'Closed Won': 'completed',
                'Closed Lost': 'cancelled',
            };

            const status = statusMap[dealStage] || 'pending';

            if (orderNumber) {
                await Order.findOneAndUpdate(
                    { orderNumber },
                    { status },
                    { new: true }
                );
                console.log(`✅ Order ${orderNumber} status updated from Zoho webhook: ${status}`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
});

/**
 * Health check endpoint for Zoho webhook verification
 */
router.get('/zoho/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;