const marketingService = require('../services/marketing.service');
const logger = require('../utils/logger');

// Middleware to attach marketing data to req object
const attachMarketingData = (req, res, next) => {
    try {
        req.marketingData = marketingService.collectMarketingData(req);

        // Log marketing data in development
        if (process.env.NODE_ENV === 'development') {
            logger.debug('Marketing data attached:', {
                sessionId: req.marketingData.sessionId,
                utmSource: req.marketingData.utm.source,
                country: req.marketingData.geo.country,
            });
        }
    } catch (error) {
        logger.error('Error attaching marketing data:', error);
        // Continue even if marketing fails
        req.marketingData = {};
    }

    next();
};

module.exports = attachMarketingData;