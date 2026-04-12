const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

// Apply admin middleware to all routes
router.use(protect, authorize('admin'));

router.get('/stats', adminController.getDashboardStats);
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.get('/orders/:id', adminController.getOrderDetails);
router.delete('/orders/:id', adminController.deleteOrder);

router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

router.post('/services/items', adminController.createServiceItem);
router.put('/services/items/:id', adminController.updateServiceItem);
router.delete('/services/items/:id', adminController.deleteServiceItem);

module.exports = router;