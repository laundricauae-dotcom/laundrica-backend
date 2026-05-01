/**
 * Session validation middleware
 * Ensures valid session ID for cart operations
 */
const validateSession = (req, res, next) => {
    const sessionId = req.params.sessionId || req.headers['x-session-id'];

    if (!sessionId) {
        return res.status(400).json({
            success: false,
            message: 'Session ID is required. Please provide x-session-id header.',
        });
    }

    // Validate session ID format (UUID v4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid session ID format. Expected UUID v4.',
        });
    }

    req.sessionId = sessionId;
    next();
};

module.exports = validateSession;