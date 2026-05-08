/**
 * Response compression middleware
 * Compresses JSON responses for better performance
 */
const zlib = require('zlib');

const compress = (req, res, next) => {
    // Skip compression for API routes to avoid encoding issues
    if (req.path && req.path.startsWith('/api/')) {
        return next();
    }

    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override json method
    res.json = function (data) {
        // Check if client accepts gzip and response should be compressed
        const acceptsGzip = req.headers['accept-encoding']?.includes('gzip');

        // Only compress if:
        // 1. Client accepts gzip
        // 2. Response is an object (JSON)
        // 3. Response size is significant (> 1KB)
        const shouldCompress = acceptsGzip &&
            typeof data === 'object' &&
            JSON.stringify(data).length > 1024;

        if (shouldCompress) {
            const jsonString = JSON.stringify(data);

            zlib.gzip(jsonString, (err, compressed) => {
                if (err) {
                    // Fallback to uncompressed on error
                    res.setHeader('Content-Type', 'application/json');
                    return originalJson.call(this, data);
                }

                res.setHeader('Content-Encoding', 'gzip');
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Length', compressed.length);
                res.setHeader('Vary', 'Accept-Encoding');
                originalSend.call(this, compressed);
            });
        } else {
            // Don't compress
            res.setHeader('Content-Type', 'application/json');
            originalJson.call(this, data);
        }
    };

    next();
};

module.exports = compress;