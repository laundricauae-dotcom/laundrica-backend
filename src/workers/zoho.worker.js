const queues = require('../config/bull');
const logger = require('../utils/logger');

const ZOHO_WEBHOOK_URL = process.env.ZOHO_WEBHOOK_URL;

const sendToZohoWebhook = async (customerInfo, orderNumber, marketingData = {}) => {
    const payload = {
        full_name: customerInfo.full_name || '',
        mobile: customerInfo.mobile || '',
        email: customerInfo.email || '',
        address: customerInfo.address || '',
        special_instructions: customerInfo.special_instructions || '',
        order_number: orderNumber,
        // Include marketing data
        ...marketingData,
    };

    logger.info(`Sending to Zoho Webhook for order ${orderNumber}`);

    try {
        const response = await fetch(ZOHO_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(`Zoho webhook failed: ${response.status} - ${responseText}`);
        }

        logger.info(`Zoho webhook successful for order ${orderNumber}`);
        return { success: true, response: responseText };
    } catch (error) {
        logger.error(`Zoho webhook error for order ${orderNumber}:`, error);
        throw error;
    }
};

// Process Zoho webhook jobs
queues.zohoWebhook.process(async (job) => {
    const { orderId, orderNumber, customerInfo, marketing } = job.data;

    logger.info(`Processing Zoho webhook for order ${orderNumber}`);

    try {
        const result = await sendToZohoWebhook(customerInfo, orderNumber, marketing);
        return result;
    } catch (error) {
        logger.error(`Zoho webhook job failed for order ${orderNumber}:`, error);
        throw error;
    }
});

// Handle failed jobs
queues.zohoWebhook.on('failed', (job, error) => {
    logger.error(`Zoho webhook job ${job.id} failed after ${job.attemptsMade} attempts:`, error);
});

module.exports = { sendToZohoWebhook };