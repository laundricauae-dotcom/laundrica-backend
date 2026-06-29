// src/utils/logger.js
const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const logger = pino({
    level: isProduction ? 'info' : 'debug',
    transport: isDevelopment ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    } : undefined,
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
        paths: ['password', 'token', 'authorization', '*.password', '*.token'],
        censor: '********',
    },
    base: {
        env: process.env.NODE_ENV,
    },
});

// Create child loggers for specific modules
logger.child = (bindings) => {
    return pino({
        ...logger,
        ...bindings,
    });
};

module.exports = logger;