// services/service.service.js
const Product = require('../models/Product');
const ServiceItem = require('../models/ServiceItem');
const cache = require('../cache/redis.cache');
const logger = require('../utils/logger');

class ServiceService {
    async getAllServices() {
        const cacheKey = cache.key('services', 'all');

        const cached = await cache.get(cacheKey);
        if (cached) {
            logger.debug('All services from cache');
            return cached;
        }

        const services = await Product.find({ isActive: true })
            .select('name slug description category images icon sortOrder')
            .sort('sortOrder')
            .lean();

        await cache.set(cacheKey, services, 300);
        logger.debug(`Services fetched from database (${services.length} items)`);

        return services;
    }

    async getServiceById(id) {
        const cacheKey = cache.key('service', id);

        const cached = await cache.get(cacheKey);
        if (cached) {
            logger.debug(`Service ${id} from cache`);
            return cached;
        }

        const [service, items] = await Promise.all([
            Product.findById(id).select('-__v').lean(),
            ServiceItem.find({ serviceId: id, isActive: true })
                .select('name category price unit description sortOrder image contactForPricing minQuantity')
                .sort('sortOrder')
                .lean(),
        ]);

        if (!service) {
            const error = new Error('Service not found');
            error.statusCode = 404;
            throw error;
        }

        const result = { service, items };
        await cache.set(cacheKey, result, 300);
        return result;
    }

    async getServicesByCategory(category) {
        const cacheKey = cache.key('services', 'category', category);

        const cached = await cache.get(cacheKey);
        if (cached) {
            logger.debug(`Services for category ${category} from cache`);
            return cached;
        }

        const services = await Product.find({
            category: category,
            isActive: true,
        })
            .select('name slug description category images icon sortOrder')
            .sort('sortOrder')
            .lean();

        await cache.set(cacheKey, services, 300);
        return services;
    }

    async getServiceItems(serviceId) {
        const cacheKey = cache.key('service-items', serviceId);

        const cached = await cache.get(cacheKey);
        if (cached) {
            logger.debug(`Service items for ${serviceId} from cache`);
            return cached;
        }

        const items = await ServiceItem.find({
            serviceId: serviceId,
            isActive: true
        })
            .select('name category price unit description sortOrder image contactForPricing minQuantity')
            .sort('sortOrder')
            .lean();

        await cache.set(cacheKey, items, 300);
        return items;
    }

    // Cache invalidation methods
    async invalidateServiceCache(serviceId) {
        await Promise.all([
            cache.delete(cache.key('service', serviceId)),
            cache.delete(cache.key('service-items', serviceId)),
            cache.delete(cache.key('services', 'all')),
            cache.deletePattern('services:category:*'),
        ]);
        logger.info(`Cache invalidated for service ${serviceId}`);
    }
}

module.exports = new ServiceService();