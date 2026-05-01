/**
 * Security headers middleware
 * Adds basic security headers to responses
 */
const securityHeaders = (req, res, next) => {
    // Prevent XSS attacks
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
};

module.exports = securityHeaders;