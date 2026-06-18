const Order = require('../models/Order');
const Cart = require('../models/Cart');

// Zoho Webhook URL
const ZOHO_WEBHOOK_URL = "https://flow.zoho.com/925120593/flow/webhook/incoming?zapikey=1001.a459dc2423c0615b04b76478d2f93b6a.aa50edf0a55826432e8724376b48564d&isdebug=false";

// Function to send data to Zoho Webhook
const sendToZohoWebhook = async (customerInfo, orderNumber) => {
  const payload = {
    full_name: customerInfo.full_name || '',
    mobile: customerInfo.mobile || '',
    email: customerInfo.email || '',
    address: customerInfo.address || '',
    special_instructions: customerInfo.special_instructions || '',
  };

  console.log('📤 Sending to Zoho Webhook:');
  console.log('📋 Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(ZOHO_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log(`📥 Zoho Webhook response status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ Zoho Webhook error: ${responseText}`);
      return { success: false, error: responseText };
    }

    return { success: true, response: responseText };
  } catch (error) {
    console.error('❌ Zoho Webhook error:', error);
    return { success: false, error: error.message };
  }
};

// Generate order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
};

// Create order
exports.createOrder = async (req, res) => {
  console.log('========================================');
  console.log('📨 POST /api/orders -', new Date().toISOString());
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));

  try {
    const {
      sessionId,
      items,
      subtotal,
      deliveryFee = 0,
      tax = 0,
      discount = 0,
      total,
      customerInfo,
      carpetContactEnabled = false,
      shoesContactEnabled = false,
    } = req.body;

    // VALIDATION
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order'
      });
    }

    if (!customerInfo) {
      return res.status(400).json({
        success: false,
        message: 'Customer information is required'
      });
    }

    // Check for required fields in customerInfo
    const customerName = customerInfo.full_name || customerInfo.name;
    const customerPhone = customerInfo.mobile || customerInfo.phone;
    const customerAddress = customerInfo.address;

    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: 'Customer full_name is required'
      });
    }

    if (!customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Customer mobile is required'
      });
    }

    if (!customerAddress) {
      return res.status(400).json({
        success: false,
        message: 'Customer address is required'
      });
    }

    // Create order number
    const orderNumber = generateOrderNumber();

    // Build customer info with correct field names
    const customerInfoData = {
      full_name: customerName,
      mobile: customerPhone,
      email: customerInfo.email || '',
      address: customerAddress,
      city: customerInfo.city || 'Dubai',
      special_instructions: customerInfo.special_instructions || customerInfo.notes || '',
    };

    // Create order object
    const orderData = {
      orderNumber,
      sessionId,
      items: items.map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image || '',
        category: item.category || '',
        serviceItems: item.serviceItems || [],
        selectedColor: item.selectedColor || null,
        selectedSize: item.selectedSize || null,
        designImage: item.designImage || null,
        serviceName: item.serviceName || '',
        metadata: item.metadata || {},
      })),
      subtotal: subtotal || total || 0,
      deliveryFee,
      tax,
      discount,
      total: total || subtotal || 0,
      customerInfo: customerInfoData,
      carpetContactEnabled,
      shoesContactEnabled,
      status: 'pending',
    };

    console.log('📦 Creating order with data:');
    console.log('📋 Order Number:', orderNumber);
    console.log('👤 Customer:', customerInfoData.full_name);
    console.log('📞 Phone:', customerInfoData.mobile);
    console.log('💰 Total:', orderData.total);

    // Save to database
    const order = new Order(orderData);
    await order.save();

    console.log(`✅ Order created successfully: ${orderNumber}`);

    // SEND TO ZOHO WEBHOOK (fire and forget)
    console.log('🚀 Sending to Zoho webhook...');
    sendToZohoWebhook(customerInfoData, orderNumber).then(result => {
      if (result.success) {
        console.log('✅ Zoho webhook sent successfully');
      } else {
        console.error('❌ Zoho webhook failed:', result.error);
      }
    });

    // Clear the cart
    try {
      await Cart.findOneAndDelete({ sessionId });
      console.log(`🗑️ Cart cleared for session: ${sessionId}`);
    } catch (cartError) {
      console.error('⚠️ Failed to clear cart:', cartError.message);
    }

    console.log('========================================');

    // Return response
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
    console.error('❌ Create order error:', error);
    console.log('========================================');

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order',
    });
  }
};

// Get order by number
exports.getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get orders by session
exports.getOrdersBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const orders = await Order.find({ sessionId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Track order
exports.trackOrder = exports.getOrderByNumber;