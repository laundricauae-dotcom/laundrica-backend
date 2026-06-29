const orderService = require('../services/order.service');
const marketingService = require('../services/marketing.service');
const logger = require('../utils/logger');

exports.createOrder = async (req, res, next) => {
  try {
    logger.info('Creating new order');

    // Collect marketing data from the request
    const marketingData = marketingService.collectMarketingData(req);

    // Merge marketing data into the order data
    const orderData = {
      ...req.body,
      marketing: marketingData,
    };

    const order = await orderService.createOrder(orderData);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderByNumber = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const order = await orderService.getOrderByNumber(orderNumber);

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrdersBySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const orders = await orderService.getOrdersBySession(sessionId);

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const { status } = req.body;

    if (!status) {
      const error = new Error('Status is required');
      error.statusCode = 400;
      throw error;
    }

    const order = await orderService.updateOrderStatus(orderNumber, status);

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      order,
    });
  } catch (error) {
    next(error);
  }
};

exports.trackOrder = exports.getOrderByNumber;