/**
 * Simple rate limiting middleware
 * Prevents abuse of the API
 */
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
    const requests = new Map();

    return (req, res, next) => {
        // Use IP + sessionId as identifier
        const identifier = req.headers['x-session-id'] || req.ip;
        const now = Date.now();

        if (!requests.has(identifier)) {
            requests.set(identifier, []);
        }

        const userRequests = requests.get(identifier);

        // Clean old requests
        while (userRequests.length && userRequests[0] < now - windowMs) {
            userRequests.shift();
        }

        if (userRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
            });
        }

        userRequests.push(now);
        next();
    };
};

module.exports = rateLimit;