// workers/email.worker.js
const queues = require('../config/bull');
const logger = require('../utils/logger');
const Order = require('../models/Order');
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendOrderConfirmationEmail = async (order) => {
    const { orderNumber, customerInfo, total, items } = order;

    const emailHtml = `
    <h2>Order Confirmation - ${orderNumber}</h2>
    <p>Dear ${customerInfo.full_name},</p>
    <p>Thank you for your order! We have received your order and will process it shortly.</p>
    <h3>Order Details:</h3>
    <ul>
      ${items.map(item => `
        <li>${item.name} x ${item.quantity} - AED ${(item.price * item.quantity).toFixed(2)}</li>
      `).join('')}
    </ul>
    <p><strong>Total: AED ${total.toFixed(2)}</strong></p>
    <h3>Delivery Address:</h3>
    <p>${customerInfo.address}</p>
    <p>${customerInfo.city}</p>
    <p>Phone: ${customerInfo.mobile}</p>
    ${customerInfo.special_instructions ? `<p>Special Instructions: ${customerInfo.special_instructions}</p>` : ''}
    <p>We will notify you once your order is ready for delivery.</p>
    <p>Thank you for choosing Laundrica!</p>
  `;

    const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@laundrica.com',
        to: customerInfo.email || process.env.TO_EMAIL,
        subject: `Order Confirmation - ${orderNumber}`,
        html: emailHtml,
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Order confirmation email sent for ${orderNumber}`);
        return { success: true };
    } catch (error) {
        logger.error(`Email send error for ${orderNumber}:`, error);
        throw error;
    }
};

// Process email jobs
queues.emailNotifications.process(async (job) => {
    const { orderId, orderNumber, customerInfo, total } = job.data;

    logger.info(`Processing email notification for order ${orderNumber}`);

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error(`Order ${orderNumber} not found`);
        }

        const result = await sendOrderConfirmationEmail(order);
        return result;
    } catch (error) {
        logger.error(`Email job failed for order ${orderNumber}:`, error);
        throw error;
    }
});

// Handle failed jobs
queues.emailNotifications.on('failed', (job, error) => {
    logger.error(`Email job ${job.id} failed after ${job.attemptsMade} attempts:`, error);
});

module.exports = { sendOrderConfirmationEmail };