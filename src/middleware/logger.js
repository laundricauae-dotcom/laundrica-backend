// middleware/logger.js
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Log request
    logger.info({
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        sessionId: req.headers['x-session-id'],
    });

    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - start;

        logger.info({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
        });

        originalSend.call(this, data);
    };

    next();
};

module.exports = requestLogger;