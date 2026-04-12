const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ServiceItem = require('../models/ServiceItem');
const { sendEmail } = require('../utils/email');

exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(query);
    
    res.status(200).json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingUpdate } = req.body;
    
    const order = await Order.findById(id).populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    order.status = status;
    
    if (trackingUpdate) {
      order.tracking.currentStatus = trackingUpdate.description;
      order.tracking.history.push({
        status: status,
        timestamp: new Date(),
        description: trackingUpdate.description,
        location: trackingUpdate.location || 'Laundrica Facility',
      });
      
      if (trackingUpdate.estimatedDelivery) {
        order.tracking.estimatedDelivery = new Date(trackingUpdate.estimatedDelivery);
      }
    }
    
    await order.save();
    
    // Send status update email
    await sendStatusUpdateEmail(order);
    
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    
    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
// Add these to the existing admin controller

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.productId', 'name images');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    
    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Also delete user's orders
    await Order.deleteMany({ user: id });
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createServiceItem = async (req, res) => {
  try {
    const serviceItem = await ServiceItem.create(req.body);
    res.status(201).json({ success: true, serviceItem });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateServiceItem = async (req, res) => {
  try {
    const serviceItem = await ServiceItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!serviceItem) {
      return res.status(404).json({
        success: false,
        message: 'Service item not found',
      });
    }
    
    res.status(200).json({ success: true, serviceItem });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteServiceItem = async (req, res) => {
  try {
    const serviceItem = await ServiceItem.findByIdAndDelete(req.params.id);
    
    if (!serviceItem) {
      return res.status(404).json({
        success: false,
        message: 'Service item not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Service item deleted successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    
    const recentOrders = await Order.find()
      .populate('user', 'name')
      .sort('-createdAt')
      .limit(5);
    
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: '$total' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalUsers,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders,
        ordersByStatus,
        monthlyRevenue,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const sendStatusUpdateEmail = async (order) => {
  const statusMessages = {
    confirmed: 'Your order has been confirmed and is being processed.',
    processing: 'Your order is now being processed by our team.',
    ready_for_pickup: 'Your order is ready for pickup!',
    out_for_delivery: 'Your order is out for delivery!',
    delivered: 'Your order has been delivered. Enjoy!',
    cancelled: 'Your order has been cancelled.',
  };
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f4f2b;">Order Status Update</h2>
      <p>Dear ${order.user.name},</p>
      <p>${statusMessages[order.status] || `Your order status has been updated to: ${order.status}`}</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Tracking Number:</strong> ${order.tracking.trackingNumber}</p>
        <p><strong>Current Status:</strong> ${order.status}</p>
        ${order.tracking.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.tracking.estimatedDelivery).toLocaleDateString()}</p>` : ''}
      </div>
      
      <p>Track your order: <a href="${process.env.FRONTEND_URL}/track/${order.tracking.trackingNumber}">Track Order</a></p>
      
      <p>Thank you for choosing Laundrica!</p>
    </div>
  `;
  
  await sendEmail({
    email: order.user.email,
    subject: `Order Status Update - ${order.orderNumber}`,
    html: emailHtml,
  });
};