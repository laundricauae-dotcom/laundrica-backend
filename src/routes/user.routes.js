const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/change-password', protect, userController.changePassword);
router.post('/address', protect, userController.addAddress);
router.put('/address/:addressId', protect, userController.updateAddress);
router.delete('/address/:addressId', protect, userController.deleteAddress);

module.exports = router;