// routes/contact.routes.js
const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');

// Newsletter subscription endpoint
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Send confirmation email to subscriber
        await emailService.sendNewsletterConfirmation(email);

        // Send notification to admin
        await emailService.sendAdminNewsletterNotification(email);

        res.status(200).json({
            success: true,
            message: 'Successfully subscribed to newsletter'
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to subscribe. Please try again later.'
        });
    }
});

// Business service request endpoint
router.post('/business-request', async (req, res) => {
    try {
        const { name, businessName, businessType, phone, email, message } = req.body;

        // Validate required fields
        if (!name || !businessType || !phone || !email) {
            return res.status(400).json({
                success: false,
                error: 'Name, business type, phone, and email are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        const requestData = { name, businessName, businessType, phone, email, message };

        // Send confirmation email to client
        await emailService.sendBusinessRequestConfirmation(requestData);

        // Send notification to admin
        await emailService.sendAdminBusinessNotification(requestData);

        res.status(200).json({
            success: true,
            message: 'Business request submitted successfully'
        });

    } catch (error) {
        console.error('Business request error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit request. Please try again later.'
        });
    }
});

module.exports = router;