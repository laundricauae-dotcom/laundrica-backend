// workers/order.worker.js
const queues = require('../config/bull');
const logger = require('../utils/logger');
const Order = require('../models/Order');

// Process order processing jobs
queues.orderProcessing.process(async (job) => {
    const { orderId, orderNumber } = job.data;

    logger.info(`Processing order ${orderNumber}`);

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error(`Order ${orderNumber} not found`);
        }

        // Add any order processing logic here
        // Example: Update inventory, generate invoices, etc.

        logger.info(`Order ${orderNumber} processed successfully`);
        return { success: true };
    } catch (error) {
        logger.error(`Order processing failed for ${orderNumber}:`, error);
        throw error;
    }
});

// Handle failed jobs
queues.orderProcessing.on('failed', (job, error) => {
    logger.error(`Order processing job ${job.id} failed:`, error);
});

module.exports = queues.orderProcessing;