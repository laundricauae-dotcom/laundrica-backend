/**
 * Request logging middleware
 * Logs all incoming requests for debugging
 */
const logger = (req, res, next) => {
    const start = Date.now();

    // Log request
    console.log(`📨 ${req.method} ${req.url} - ${new Date().toISOString()}`);

    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - start;
        console.log(`✅ ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
        originalSend.call(this, data);
    };

    next();
};

module.exports = logger;