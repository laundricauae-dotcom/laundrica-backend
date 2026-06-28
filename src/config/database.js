// config/database.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        // Use the existing MONGODB_URI from your .env
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            family: 4,
        });

        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        // Enable query logging in development
        if (process.env.NODE_ENV === 'development') {
            mongoose.set('debug', true);
        }

        return conn;
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;