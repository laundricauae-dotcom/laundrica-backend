// middleware/validateSession.js

const logger = require("../utils/logger");

const validateSession = (req, res, next) => {
    // Allow CORS preflight requests to pass through
    if (req.method === "OPTIONS") {
        return next();
    }

    const sessionId =
        req.params?.sessionId ||
        req.headers["x-session-id"] ||
        req.body?.sessionId ||
        req.query?.sessionId;

    if (!sessionId) {
        return res.status(400).json({
            success: false,
            message: "Session ID is required.",
        });
    }

    // UUID v4 validation
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(sessionId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid session ID format.",
        });
    }

    req.sessionId = sessionId;

    next();
};

module.exports = validateSession;