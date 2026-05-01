/**
 * Input sanitization middleware
 * Prevents XSS and injection attacks
 */
const sanitize = (req, res, next) => {
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str
            .trim()
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitizeString(value);
            } else if (Array.isArray(value)) {
                sanitized[key] = value.map(v =>
                    typeof v === 'string' ? sanitizeString(v) :
                        typeof v === 'object' ? sanitizeObject(v) : v
                );
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
};

module.exports = sanitize;