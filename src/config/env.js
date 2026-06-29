// config/env.js
const logger = require('../utils/logger');

const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'PORT',
    'ZOHO_WEBHOOK_URL',
];

const validateEnv = () => {
    const missing = requiredEnvVars.filter((env) => !process.env[env]);

    if (missing.length > 0) {
        logger.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    // Validate numeric values
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
        logger.error('PORT must be a valid number between 1 and 65535');
        process.exit(1);
    }

    logger.info('Environment validation passed');
};

module.exports = validateEnv;