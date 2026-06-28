// src/config/redis.js
const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.enabled = process.env.REDIS_ENABLED !== 'false';
    }

    async connect() {
        if (!this.enabled) {
            logger.info('Redis is disabled. Running without caching.');
            this.client = this.createMockClient();
            this.isConnected = false;
            return this.client;
        }

        try {
            // YOUR REDIS CLOUD CREDENTIALS - HARDCODED
            const config = {
                host: 'redis-12286.crce309.us-east-1-6.ec2.cloud.redislabs.com',
                port: 12286,
                password: 'APfUWs5BF8iGpYgF6P0xwAdkal9ic5rF',
                username: 'default',
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: true,
                connectTimeout: 10000,
                commandTimeout: 5000,
                retryStrategy: (times) => {
                    if (times > 3) {
                        logger.error('Redis connection failed after 3 retries');
                        this.isConnected = false;
                        return null;
                    }
                    return Math.min(times * 1000, 5000);
                },
                // DISABLE TLS - most Redis Cloud free tiers don't use TLS
                tls: null,
            };

            logger.info(`Connecting to Redis Cloud at ${config.host}:${config.port}`);

            this.client = new Redis(config);

            this.client.on('connect', () => {
                logger.info('✅ Redis Cloud connected successfully');
                this.isConnected = true;
            });

            this.client.on('ready', () => {
                logger.info('✅ Redis Cloud is ready');
                this.isConnected = true;
            });

            this.client.on('error', (error) => {
                logger.error('Redis Cloud error:', error.message);
                this.isConnected = false;
            });

            this.client.on('end', () => {
                logger.warn('Redis Cloud connection ended');
                this.isConnected = false;
            });

            await this.client.connect();

            // Test connection
            await this.client.set('test', 'connected');
            const testResult = await this.client.get('test');
            logger.info(`✅ Redis Cloud test successful: ${testResult}`);

            return this.client;
        } catch (error) {
            logger.warn('Redis Cloud connection failed, running without caching:', error.message);
            this.isConnected = false;
            this.client = this.createMockClient();
            return this.client;
        }
    }

    createMockClient() {
        const mock = {
            get: async () => null,
            set: async () => 'OK',
            setex: async () => 'OK',
            del: async () => 1,
            keys: async () => [],
            call: async () => null,
            sendCommand: async () => null,
            quit: async () => { },
            status: 'ready',
            on: () => { },
            connect: async () => { },
        };
        return mock;
    }

    getClient() {
        return this.client;
    }

    isReady() {
        return this.isConnected && this.client && this.client.status === 'ready';
    }

    async disconnect() {
        if (this.client && this.client.quit) {
            await this.client.quit();
            this.isConnected = false;
        }
    }
}

module.exports = new RedisClient();