// services/product.service.js
const Product = require('../models/Product');
const ServiceItem = require('../models/ServiceItem');
const cache = require('../cache/redis.cache');
const logger = require('../utils/logger');

class ProductService {
    async getAllProducts(filters = {}) {
        const cacheKey = cache.key('products', JSON.stringify(filters));

        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            logger.debug('Products from cache');
            return cached;
        }

        const { category, featured, search, page = 1, limit = 50 } = filters;

        const query = { isActive: true };
        if (category) query.category = category;
        if (featured === 'true') query.isFeatured = true;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .select('name slug description price category images icon isFeatured sortOrder')
                .sort('sortOrder')
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean(),
            Product.countDocuments(query),
        ]);

        const result = {
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total,
        };

        // Cache the result
        await cache.set(cacheKey, result, 300);
        logger.debug(`Products fetched from database (${products.length} items)`);

        return result;
    }

    async getProductById(id) {
        const cacheKey = cache.key('product', id);

        const cached = await cache.get(cacheKey);
        if (cached) {
            logger.debug(`Product ${id} from cache`);
            return cached;
        }

        const product = await Product.findById(id)
            .select('-__v')
            .lean();

        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        await cache.set(cacheKey, product, 3600);
        return product;
    }

    async getProductBySlug(slug) {
        const cacheKey = cache.key('product', 'slug', slug);

        const cached = await cache.get(cacheKey);
        if (cached) {
            logger.debug(`Product slug ${slug} from cache`);
            return cached;
        }

        const product = await Product.findOne({ slug, isActive: true })
            .select('-__v')
            .lean();

        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        await cache.set(cacheKey, product, 3600);
        return product;
    }

    async getFeaturedProducts() {
        const cacheKey = cache.key('products', 'featured');

        const cached = await cache.get(cacheKey);
        if (cached) {
            logger.debug('Featured products from cache');
            return cached;
        }

        const products = await Product.find({ isFeatured: true, isActive: true })
            .select('name slug description price category images icon sortOrder')
            .limit(8)
            .sort('sortOrder')
            .lean();

        await cache.set(cacheKey, products, 300);
        return products;
    }

    async getCategories() {
        const cacheKey = cache.key('categories');

        const cached = await cache.get(cacheKey);
        if (cached) {
            logger.debug('Categories from cache');
            return cached;
        }

        const categories = await Product.distinct('category').lean();

        await cache.set(cacheKey, categories, 3600);
        return categories;
    }

    async getServiceCategories() {
        const cacheKey = cache.key('service-categories');

        const cached = await cache.get(cacheKey);
        if (cached) {
            logger.debug('Service categories from cache');
            return cached;
        }

        const serviceCategories = ['laundry', 'dry-cleaning', 'steam-pressing', 'shoe-cleaning', 'carpet-cleaning', 'curtain-cleaning'];
        const services = await Product.find({
            category: { $in: serviceCategories },
            isActive: true
        })
            .select('name slug category icon images description')
            .lean();

        await cache.set(cacheKey, services, 300);
        return services;
    }

    async getServiceItemsForProduct(productId) {
        const cacheKey = cache.key('service-items', productId);

        const cached = await cache.get(cacheKey);
        if (cached) {
            logger.debug(`Service items for product ${productId} from cache`);
            return cached;
        }

        const items = await ServiceItem.find({
            serviceId: productId,
            isActive: true
        })
            .select('name category price unit description sortOrder image contactForPricing minQuantity')
            .sort('sortOrder')
            .lean();

        await cache.set(cacheKey, items, 300);
        return items;
    }

    // Cache invalidation methods
    async invalidateProductCache(productId, slug) {
        await Promise.all([
            cache.delete(cache.key('product', productId)),
            cache.delete(cache.key('product', 'slug', slug)),
            cache.deletePattern('products:*'),
            cache.delete(cache.key('service-items', productId)),
        ]);
        logger.info(`Cache invalidated for product ${productId}`);
    }

    async invalidateAllProductCache() {
        await cache.deletePattern('products:*');
        await cache.deletePattern('service-items:*');
        await cache.deletePattern('categories:*');
        await cache.deletePattern('service-categories:*');
        logger.info('All product cache invalidated');
    }
}

module.exports = new ProductService();