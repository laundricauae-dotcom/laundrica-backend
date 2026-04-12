const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth');

// ==================== PUBLIC ROUTES ====================
router.get('/track/:trackingNumber', orderController.trackOrder);

// ==================== USER ROUTES ====================
router.get('/my-orders', protect, orderController.getMyOrders);
router.post('/', protect, orderController.createOrder);  // POST comes BEFORE /:id

// ==================== ADMIN ROUTES ====================
router.get('/admin/orders', protect, authorize('admin'), orderController.getAllOrders);
router.get('/admin/orders/pending', protect, authorize('admin'), orderController.getPendingOrders);
router.get('/admin/orders/status/:status', protect, authorize('admin'), orderController.getOrdersByStatus);
router.get('/admin/orders/:id', protect, authorize('admin'), orderController.getOrderDetails);
router.put('/admin/orders/:id/status', protect, authorize('admin'), orderController.updateOrderStatus);
router.delete('/admin/orders/:id', protect, authorize('admin'), orderController.deleteOrder);

// Tracking management
router.post('/admin/orders/:id/tracking', protect, authorize('admin'), orderController.createTracking);
router.put('/admin/orders/:id/tracking', protect, authorize('admin'), orderController.updateTracking);

// Bulk operations
router.post('/admin/orders/bulk-update', protect, authorize('admin'), orderController.bulkUpdateOrderStatus);

// Statistics
router.get('/admin/statistics', protect, authorize('admin'), orderController.getOrderStatistics);

// ==================== DYNAMIC ROUTES (ALWAYS LAST) ====================
router.get('/:id', protect, orderController.getOrderById);
router.put('/:id/cancel', protect, orderController.cancelOrder);

module.exports = router;