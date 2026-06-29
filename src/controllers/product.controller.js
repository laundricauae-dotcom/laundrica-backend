// controllers/product.controller.js
const productService = require('../services/product.service');
const logger = require('../utils/logger');

exports.getAllProducts = async (req, res, next) => {
  try {
    const filters = req.query;
    const result = await productService.getAllProducts(filters);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await productService.getProductBySlug(slug);

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await productService.getFeaturedProducts();

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await productService.getCategories();

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

exports.getServiceCategories = async (req, res, next) => {
  try {
    const services = await productService.getServiceCategories();

    res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    next(error);
  }
};

exports.getServiceItemsForProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const items = await productService.getServiceItemsForProduct(id);

    res.status(200).json({
      success: true,
      items,
    });
  } catch (error) {
    next(error);
  }
};