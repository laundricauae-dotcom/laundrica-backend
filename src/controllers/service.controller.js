// controllers/service.controller.js
const serviceService = require('../services/service.service');
const logger = require('../utils/logger');

exports.getAllServices = async (req, res, next) => {
  try {
    const services = await serviceService.getAllServices();

    res.status(200).json({
      success: true,
      services,
      count: services.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await serviceService.getServiceById(id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getServicesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const services = await serviceService.getServicesByCategory(category);

    res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    next(error);
  }
};

exports.getServiceItems = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const items = await serviceService.getServiceItems(serviceId);

    res.status(200).json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    next(error);
  }
};