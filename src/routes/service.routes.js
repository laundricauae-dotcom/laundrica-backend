const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);
router.get('/category/:category', serviceController.getServicesByCategory);
router.get('/:serviceId/items', serviceController.getServiceItems);

// Admin only routes
router.post('/', protect, authorize('admin'), serviceController.createService);
router.put('/:id', protect, authorize('admin'), serviceController.updateService);
router.delete('/:id', protect, authorize('admin'), serviceController.deleteService);

module.exports = router;