const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');

router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);
router.get('/category/:category', serviceController.getServicesByCategory);
router.get('/:serviceId/items', serviceController.getServiceItems);

module.exports = router;