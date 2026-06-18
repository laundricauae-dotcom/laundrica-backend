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
      console.error('❌ Missing sessionId');
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
        errors: ['Session ID is required']
      });
    }

    if (!items || items.length === 0) {
      console.error('❌ No items in order');
      return res.status(400).json({
        success: false,
        message: 'No items in order',
        errors: ['No items in order']
      });
    }

    if (!customerInfo) {
      console.error('❌ Missing customerInfo');
      return res.status(400).json({
        success: false,
        message: 'Customer information is required',
        errors: ['Customer information is required']
      });
    }

    // Check for required fields in customerInfo
    const customerName = customerInfo.full_name || customerInfo.name;
    const customerPhone = customerInfo.mobile || customerInfo.phone;
    const customerAddress = customerInfo.address;

    const validationErrors = [];

    if (!customerName) {
      validationErrors.push('Customer full_name is required');
    }

    if (!customerPhone) {
      validationErrors.push('Customer mobile is required');
    }

    if (!customerAddress) {
      validationErrors.push('Customer address is required');
    }

    if (validationErrors.length > 0) {
      console.error('❌ Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Create order number
    const orderNumber = generateOrderNumber();

    // Build customer info with correct field names
    const customerInfoData = {
      full_name: customerName.trim(),
      mobile: customerPhone.trim(),
      email: (customerInfo.email || '').trim(),
      address: customerAddress.trim(),
      city: (customerInfo.city || 'Dubai').trim(),
      special_instructions: (customerInfo.special_instructions || customerInfo.notes || '').trim(),
    };

    // Validate items
    const validatedItems = items.map(item => ({
      productId: item.productId || item.id || 'unknown',
      name: item.name || 'Unknown Item',
      price: typeof item.price === 'number' ? item.price : 0,
      quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
      image: item.image || '',
      category: item.category || '',
      serviceItems: Array.isArray(item.serviceItems) ? item.serviceItems : [],
      selectedColor: item.selectedColor || null,
      selectedSize: item.selectedSize || null,
      designImage: item.designImage || null,
      serviceName: item.serviceName || '',
      metadata: item.metadata || {},
    }));

    // Calculate totals
    const calculatedSubtotal = validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculatedTotal = calculatedSubtotal + deliveryFee + tax - discount;

    // Create order object
    const orderData = {
      orderNumber,
      sessionId: sessionId.trim(),
      items: validatedItems,
      subtotal: subtotal || calculatedSubtotal,
      deliveryFee: typeof deliveryFee === 'number' ? deliveryFee : 0,
      tax: typeof tax === 'number' ? tax : 0,
      discount: typeof discount === 'number' ? discount : 0,
      total: total || calculatedTotal,
      customerInfo: customerInfoData,
      carpetContactEnabled: Boolean(carpetContactEnabled),
      shoesContactEnabled: Boolean(shoesContactEnabled),
      status: 'pending',
    };

    console.log('📦 Creating order with data:');
    console.log('📋 Order Number:', orderNumber);
    console.log('👤 Customer:', customerInfoData.full_name);
    console.log('📞 Phone:', customerInfoData.mobile);
    console.log('💰 Subtotal:', orderData.subtotal);
    console.log('💰 Total:', orderData.total);
    console.log('🪙 Carpet Contact:', orderData.carpetContactEnabled);
    console.log('👟 Shoes Contact:', orderData.shoesContactEnabled);

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
    return res.status(201).json({
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

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Order with this number already exists',
        errors: ['Duplicate order number'],
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order',
      errors: [error.message || 'Internal server error'],
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

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: 'Order status updated',
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Track order
exports.trackOrder = exports.getOrderByNumber;