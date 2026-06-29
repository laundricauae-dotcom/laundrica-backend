// src/services/langcache.service.js
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

class LangCacheService {
    constructor() {
        this.enabled = process.env.REDIS_ENABLED !== 'false';
    }

    // Cache AI-generated responses (e.g., product descriptions, recommendations)
    async cacheAIResponse(prompt, response, context = {}) {
        if (!this.enabled || !redisClient.getLangCache()) {
            return null;
        }

        try {
            const result = await redisClient.semanticSet(
                prompt,
                response,
                {
                    timestamp: new Date().toISOString(),
                    ...context,
                }
            );
            return result;
        } catch (error) {
            logger.error('Cache AI response error:', error);
            return null;
        }
    }

    // Search for cached AI responses
    async searchAIResponse(prompt) {
        if (!this.enabled || !redisClient.getLangCache()) {
            return null;
        }

        try {
            const result = await redisClient.semanticSearch(prompt);
            if (result && result.response) {
                return result.response;
            }
            return null;
        } catch (error) {
            logger.error('Search AI response error:', error);
            return null;
        }
    }

    // Cache product recommendations
    async cacheRecommendations(userId, context, recommendations) {
        const prompt = `recommendations:${userId}:${JSON.stringify(context)}`;
        return await this.cacheAIResponse(prompt, recommendations, {
            type: 'recommendations',
            userId,
        });
    }

    // Get cached recommendations
    async getCachedRecommendations(userId, context) {
        const prompt = `recommendations:${userId}:${JSON.stringify(context)}`;
        return await this.searchAIResponse(prompt);
    }

    // Cache search results
    async cacheSearchResults(query, results) {
        const prompt = `search:${query}`;
        return await this.cacheAIResponse(prompt, results, {
            type: 'search',
            query,
        });
    }

    // Get cached search results
    async getCachedSearchResults(query) {
        const prompt = `search:${query}`;
        return await this.searchAIResponse(prompt);
    }
}

module.exports = new LangCacheService();