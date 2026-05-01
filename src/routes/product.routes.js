const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// All public routes
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/categories', productController.getCategories);
router.get('/service-categories', productController.getServiceCategories);
router.get('/:id', productController.getProductById);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id/items', productController.getServiceItemsForProduct);

module.exports = router;