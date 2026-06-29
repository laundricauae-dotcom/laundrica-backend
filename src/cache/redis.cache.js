// cache/redis.cache.js
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

class RedisCache {
    constructor() {
        this.defaultTTL = 300; // 5 minutes
        this.prefix = 'laundrica:';
    }

    async get(key) {
        try {
            if (!redisClient.isReady()) {
                return null;
            }

            const client = redisClient.getClient();
            const data = await client.get(this.prefix + key);

            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            logger.error(`Cache GET error for key ${key}:`, error);
            return null;
        }
    }

    async set(key, value, ttl = this.defaultTTL) {
        try {
            if (!redisClient.isReady()) {
                return false;
            }

            const client = redisClient.getClient();
            const serialized = JSON.stringify(value);

            if (ttl > 0) {
                await client.setex(this.prefix + key, ttl, serialized);
            } else {
                await client.set(this.prefix + key, serialized);
            }

            return true;
        } catch (error) {
            logger.error(`Cache SET error for key ${key}:`, error);
            return false;
        }
    }

    async delete(key) {
        try {
            if (!redisClient.isReady()) {
                return false;
            }

            const client = redisClient.getClient();
            await client.del(this.prefix + key);
            return true;
        } catch (error) {
            logger.error(`Cache DELETE error for key ${key}:`, error);
            return false;
        }
    }

    async deletePattern(pattern) {
        try {
            if (!redisClient.isReady()) {
                return false;
            }

            const client = redisClient.getClient();
            const keys = await client.keys(this.prefix + pattern);

            if (keys.length > 0) {
                await client.del(keys);
                logger.info(`Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
            }

            return true;
        } catch (error) {
            logger.error(`Cache DELETE pattern error for ${pattern}:`, error);
            return false;
        }
    }

    async clear() {
        try {
            if (!redisClient.isReady()) {
                return false;
            }

            const client = redisClient.getClient();
            const keys = await client.keys(this.prefix + '*');

            if (keys.length > 0) {
                await client.del(keys);
                logger.info(`Cleared ${keys.length} cache keys`);
            }

            return true;
        } catch (error) {
            logger.error('Cache CLEAR error:', error);
            return false;
        }
    }

    // Helper to generate cache keys
    key(...parts) {
        return parts.filter(Boolean).join(':');
    }
}

module.exports = new RedisCache();