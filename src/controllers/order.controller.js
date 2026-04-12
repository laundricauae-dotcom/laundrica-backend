const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { sendEmail } = require('../utils/email');
const { generateTrackingNumber } = require('../utils/tracking');

// ==================== HELPER FUNCTIONS ====================

const generateOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const count = await Order.countDocuments();
  return `ORD-${year}${month}-${(count + 1).toString().padStart(5, '0')}`;
};

const sendOrderConfirmationEmail = async (order, user) => {
  // Email template (same as before)
  if (!user?.email) return;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1f4f2b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Laundrica</h1>
          <p>Order Confirmation</p>
        </div>
        <div class="content">
          <h2>Hello ${user.name},</h2>
          <p>Thank you for your order! Your order has been confirmed successfully.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Tracking Number:</strong> ${order.tracking.trackingNumber}</p>
            <p><strong>Total Amount:</strong> AED ${order.total.toFixed(2)}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          
          <div class="order-details">
            <h3>Order Items</h3>
            ${order.items.map(item => `
              <div style="margin-bottom: 10px;">
                <strong>${item.name}</strong> x ${item.quantity} = AED ${(item.price * item.quantity).toFixed(2)}
              </div>
            `).join('')}
            <hr>
            <div><strong>Subtotal:</strong> AED ${order.subtotal.toFixed(2)}</div>
            <div><strong>Delivery Fee:</strong> AED ${order.deliveryFee.toFixed(2)}</div>
            <div><strong>Tax (5% VAT):</strong> AED ${order.tax.toFixed(2)}</div>
            <div><strong>Total:</strong> AED ${order.total.toFixed(2)}</div>
          </div>
          
          <div class="order-details">
            <h3>Shipping Address</h3>
            <p>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
            ${order.shippingAddress.address}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
          </div>
          
          <p>Track your order: 
            <a href="${process.env.FRONTEND_URL}/track/${order.tracking.trackingNumber}">Click here</a>
          </p>
          
          <p>Thank you for choosing Laundrica!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Laundrica. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail({
    email: user.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: emailHtml,
  }).catch(err => console.error('Email send error:', err));
};

// ==================== USER ORDER FUNCTIONS ====================

// Create new order
exports.createOrder = async (req, res) => {
  try {
    console.log('📦 Create order request received');
    console.log('User:', req.user?._id || req.user?.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { items, shippingAddress, paymentMethod, pickupDetails } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    if (!shippingAddress || !shippingAddress.address) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
    }

    let subtotal = 0;
    const processedItems = [];

    // Process each item - use the price from the request since products may not exist in DB
    for (const item of items) {
      console.log(`Processing item: ${item.productId} - ${item.name}`);
      
      // Use the price from the cart item (since these are service items, not DB products)
      const itemPrice = item.price || 0;
      const quantity = parseInt(item.quantity) || 1;
      const totalItemPrice = itemPrice * quantity;
      subtotal += totalItemPrice;
      
      processedItems.push({
        productId: item.productId || null,
        name: item.name || 'Unknown Item',
        price: itemPrice,
        quantity: quantity,
        image: item.image || '',
        serviceItems: item.serviceItems || [],
      });
    }
    
    // Calculate fees
    const deliveryFee = subtotal > 100 ? 0 : 15;
    const tax = subtotal * 0.05; // 5% VAT
    const total = subtotal + deliveryFee + tax;
    
    console.log(`Order totals - Subtotal: ${subtotal}, Delivery: ${deliveryFee}, Tax: ${tax}, Total: ${total}`);
    
    // Create order
    const orderData = {
      user: req.user.id,
      items: processedItems,
      subtotal,
      deliveryFee,
      tax,
      discount: 0,
      total,
      paymentMethod: paymentMethod || 'card',
      status: 'pending',
      shippingAddress: {
        firstName: shippingAddress.firstName || '',
        lastName: shippingAddress.lastName || '',
        address: shippingAddress.address || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        zipCode: shippingAddress.zipCode || '',
        phone: shippingAddress.phone || req.user.phone || '',
        email: shippingAddress.email || req.user.email || '',
      },
      pickupDetails: {
        date: pickupDetails?.date ? new Date(pickupDetails.date) : null,
        time: pickupDetails?.time || '',
        instructions: pickupDetails?.instructions || '',
      },
      tracking: {
        currentStatus: 'pending',
        history: [
          {
            status: 'pending',
            timestamp: new Date(),
            description: 'Order placed successfully',
            location: 'Online',
          },
        ],
      },
    };
    
    const order = await Order.create(orderData);
    console.log(`✅ Order created successfully: ${order._id} - ${order.orderNumber}`);
    
    res.status(201).json({
      success: true,
      order,
      message: 'Order created successfully',
    });
    
  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Get user's orders
exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { user: req.user.id };
    if (status) query.status = status;
    
    const orders = await Order.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(query);
    
    res.status(200).json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order',
      });
    }
    
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

// Track order by tracking number (public)
exports.trackOrder = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    const order = await Order.findOne({ 'tracking.trackingNumber': trackingNumber })
      .populate('user', 'name email phone');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found with this tracking number',
      });
    }
    
    const trackingInfo = {
      trackingNumber: order.tracking.trackingNumber,
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedDelivery: order.tracking.estimatedDelivery,
      currentLocation: order.tracking.history[order.tracking.history.length - 1]?.location,
      history: order.tracking.history,
      order: {
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total,
        deliveryAddress: order.shippingAddress?.address,
        customerName: order.user?.name,
        customerEmail: order.user?.email,
        customerPhone: order.user?.phone,
      },
    };
    
    res.status(200).json({
      success: true,
      tracking: trackingInfo,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel order (user)
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findOne({ _id: id, user: req.user.id });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
      });
    }
    
    order.status = 'cancelled';
    order.tracking.currentStatus = 'cancelled';
    order.tracking.history.push({
      status: 'cancelled',
      timestamp: new Date(),
      description: 'Order cancelled by customer',
      location: 'System',
    });
    
    await order.save();
    
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== ADMIN ORDER FUNCTIONS ====================

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    let ordersQuery = Order.find(query)
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    if (search) {
      ordersQuery = ordersQuery.or([
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'tracking.trackingNumber': { $regex: search, $options: 'i' } },
      ]);
    }
    
    const orders = await ordersQuery;
    const total = await Order.countDocuments(query);
    
    res.status(200).json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get pending orders (admin)
exports.getPendingOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const orders = await Order.find({ status: 'pending' })
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments({ status: 'pending' });
    
    res.status(200).json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get orders by status (admin)
exports.getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'picked_up', 'washing', 'drying', 'ironing', 'quality_check', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }
    
    const orders = await Order.find({ status })
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments({ status });
    
    res.status(200).json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get order details (admin)
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone');
    
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
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update order status (admin)
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
    order.tracking.currentStatus = status;
    
    if (trackingUpdate) {
      order.tracking.history.push({
        status: status,
        timestamp: new Date(),
        description: trackingUpdate.description,
        location: trackingUpdate.location || 'Laundrica Facility',
      });
      
      if (trackingUpdate.estimatedDelivery) {
        order.tracking.estimatedDelivery = new Date(trackingUpdate.estimatedDelivery);
      }
    } else {
      order.tracking.history.push({
        status: status,
        timestamp: new Date(),
        description: `Order status updated to ${status}`,
        location: 'Laundrica Facility',
      });
    }
    
    await order.save();
    
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

// Create tracking for order (admin)
exports.createTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, status, history } = req.body;
    
    const order = await Order.findById(id).populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // Check if tracking already exists
    if (order.tracking && order.tracking.trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Tracking already exists for this order',
      });
    }
    
    const newTrackingNumber = trackingNumber || generateTrackingNumber();
    
    order.tracking = {
      trackingNumber: newTrackingNumber,
      currentStatus: status || 'pending',
      history: history || [{
        status: status || 'pending',
        timestamp: new Date(),
        description: 'Tracking created for order',
        location: 'Laundrica Facility',
      }],
      estimatedDelivery: null,
    };
    
    order.status = status || 'pending';
    
    await order.save();
    
    res.status(200).json({
      success: true,
      order,
      message: `Tracking created: ${newTrackingNumber}`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update tracking (admin)
exports.updateTracking = async (req, res) => {
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
    
    if (!order.tracking || !order.tracking.trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please create tracking first',
      });
    }
    
    order.status = status;
    order.tracking.currentStatus = status;
    order.tracking.history.push({
      status: status,
      timestamp: new Date(),
      description: trackingUpdate.description,
      location: trackingUpdate.location || 'Laundrica Facility',
    });
    
    if (trackingUpdate.estimatedDelivery) {
      order.tracking.estimatedDelivery = new Date(trackingUpdate.estimatedDelivery);
    }
    
    await order.save();
    
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

// Bulk update order status (admin)
exports.bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, status, trackingUpdate } = req.body;
    
    const validStatuses = ['confirmed', 'processing', 'picked_up', 'washing', 'drying', 'ironing', 'quality_check', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }
    
    const orders = await Order.find({ _id: { $in: orderIds } }).populate('user', 'name email');
    
    for (const order of orders) {
      order.status = status;
      order.tracking.currentStatus = status;
      
      order.tracking.history.push({
        status: status,
        timestamp: new Date(),
        description: trackingUpdate?.description || `Bulk update to ${status}`,
        location: trackingUpdate?.location || 'Laundrica Facility',
      });
      
      if (trackingUpdate?.estimatedDelivery) {
        order.tracking.estimatedDelivery = new Date(trackingUpdate.estimatedDelivery);
      }
      
      await order.save();
    }
    
    res.status(200).json({
      success: true,
      message: `${orders.length} orders updated successfully`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete order (admin)
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByIdAndDelete(id);
    
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
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get order statistics (admin)
exports.getOrderStatistics = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
        },
      },
    ]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today },
    });
    
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
        },
      },
    ]);
    
    const weeklyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          total: { $sum: '$total' },
        },
      },
    ]);
    
    res.status(200).json({
      success: true,
      statistics: {
        byStatus: stats,
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        weeklyRevenue,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};