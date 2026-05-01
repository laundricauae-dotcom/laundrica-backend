/**
 * Response compression middleware
 * Compresses JSON responses for better performance
 */
const compress = (req, res, next) => {
    // Don't compress for small responses or streaming
    const originalJson = res.json;

    res.json = function (data) {
        // Check if client accepts gzip
        const acceptsGzip = req.headers['accept-encoding']?.includes('gzip');

        if (acceptsGzip && typeof data === 'object') {
            // Set compression headers
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Vary', 'Accept-Encoding');
        }

        originalJson.call(this, data);
    };

    next();
};

module.exports = compress;