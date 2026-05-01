/**
 * Central middleware exports
 */
const logger = require('./logger');
const rateLimit = require('./rateLimit');
const validateSession = require('./validateSession');
const validateOrder = require('./validateOrder');
const errorHandler = require('./errorHandler');
const corsMiddleware = require('./cors');
const securityHeaders = require('./security');
const sanitize = require('./sanitize');
const compress = require('./compress');
const { cacheMiddleware, clearCache } = require('./cache');

module.exports = {
    logger,
    rateLimit,
    validateSession,
    validateOrder,
    errorHandler,
    corsMiddleware,
    securityHeaders,
    sanitize,
    compress,
    cacheMiddleware,
    clearCache,
};