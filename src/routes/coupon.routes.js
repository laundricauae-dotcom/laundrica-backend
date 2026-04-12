const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/validate', couponController.validateCoupon);

// Admin only routes
router.use(protect, authorize('admin'));
router.get('/', couponController.getAllCoupons);
router.get('/:id', couponController.getCouponById);
router.post('/', couponController.createCoupon);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;