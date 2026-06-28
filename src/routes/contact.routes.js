// src/routes/contact.routes.js
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { standardLimiter } = require('../middleware/rateLimit');

router.post('/', standardLimiter, async (req, res, next) => {
    try {
        const { name, email, phone, message, subject } = req.body;

        // Validate input
        if (!name || !email || !message) {
            const error = new Error('Name, email, and message are required');
            error.statusCode = 400;
            throw error;
        }

        // Log contact form submission
        logger.info('Contact form submission:', { name, email, phone, subject });

        res.status(200).json({
            success: true,
            message: 'Contact form submitted successfully',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;