const express = require("express");
const router = express.Router();

const productController = require("../controllers/product.controller");
const { standardLimiter } = require("../middleware/rateLimit");

router.use(standardLimiter);

// Static routes first
router.get("/", productController.getAllProducts);
router.get("/featured", productController.getFeaturedProducts);
router.get("/categories", productController.getCategories);
router.get("/service-categories", productController.getServiceCategories);

// Slug route BEFORE :id
router.get("/slug/:slug", productController.getProductBySlug);

// Nested routes before :id
router.get("/:id/items", productController.getServiceItemsForProduct);

// Generic :id route LAST
router.get("/:id", productController.getProductById);

module.exports = router;