/**
 * Simple in-memory cache middleware
 * Caches GET responses for products and services
 */
const cache = new Map();

const cacheMiddleware = (duration = 300) => { // 5 minutes default
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Create cache key from URL
        const key = req.originalUrl || req.url;

        // Check if cached response exists
        if (cache.has(key)) {
            const { data, timestamp } = cache.get(key);
            if (Date.now() - timestamp < duration * 1000) {
                console.log(`📦 Cache hit: ${key}`);
                return res.status(200).json(data);
            }
            cache.delete(key);
        }

        // Store original send function
        const originalSend = res.json;

        // Override send to cache response
        res.json = function (data) {
            if (res.statusCode === 200 && data.success !== false) {
                cache.set(key, {
                    data,
                    timestamp: Date.now(),
                });
                console.log(`💾 Cache set: ${key}`);
            }
            originalSend.call(this, data);
        };

        next();
    };
};

// Clear cache helper
const clearCache = (pattern) => {
    for (const key of cache.keys()) {
        if (pattern.test(key)) {
            cache.delete(key);
        }
    }
};

module.exports = { cacheMiddleware, clearCache };