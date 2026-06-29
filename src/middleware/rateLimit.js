// src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

const createLimiter = (options) => {
    const config = {
        windowMs: options.windowMs || 15 * 60 * 1000,
        max: options.max || 100,
        message: {
            success: false,
            message: 'Too many requests. Please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            return req.path === '/api/health' || req.path === '/webhook/zoho/health';
        },
        keyGenerator: (req) => {
            return req.headers['x-session-id'] || req.ip || req.connection.remoteAddress;
        },
        validate: false,
        ...options,
    };

    // Try to use Redis store if available
    if (redisClient.isReady()) {
        try {
            const store = new RedisStore({
                sendCommand: (...args) => {
                    const client = redisClient.getClient();
                    if (client && client.call) {
                        return client.call(...args);
                    }
                    return null;
                },
                prefix: 'rl:',
                resetExpiryOnChange: true,
            });
            config.store = store;
            logger.info('Rate limiting using Redis Cloud store');
        } catch (error) {
            logger.warn('Failed to create Redis store for rate limiting, using memory store');
        }
    } else {
        logger.info('Rate limiting using memory store');
    }

    return rateLimit(config);
};

const standardLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

const strictLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 20,
});

const orderLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
});

module.exports = {
    standardLimiter,
    strictLimiter,
    orderLimiter,
    createLimiter,
};