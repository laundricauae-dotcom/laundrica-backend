const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { v4: uuidv4 } = require('uuid');

// Zoho Webhook URL
const ZOHO_WEBHOOK_URL = "https://flow.zoho.com/925120593/flow/webhook/incoming?zapikey=1001.a459dc2423c0615b04b76478d2f93b6a.aa50edf0a55826432e8724376b48564d&isdebug=false";

// Function to send data to Zoho Webhook
const sendToZohoWebhook = async (customerInfo, orderNumber) => {
  // Extract fields correctly - using full_name and mobile
  const payload = {
    full_name: customerInfo.full_name || customerInfo.name || '',
    mobile: customerInfo.mobile || customerInfo.phone || '',
    email: customerInfo.email || '',
    address: customerInfo.address || '',
    special_instructions: customerInfo.special_instructions || customerInfo.notes || '',
  };

  console.log('📤 Sending to Zoho Webhook:');
  console.log('📋 Payload:', JSON.stringify(payload, null, 2));
  console.log(`🌐 Webhook URL: ${ZOHO_WEBHOOK_URL}`);

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
    console.log(`📥 Zoho Webhook response body: ${responseText}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
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
  const random = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
};

// Create order
exports.createOrder = async (req, res) => {
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
    } = req.body;

    console.log('========================================');
    console.log('📨 POST /api/orders -', new Date().toISOString());
    console.log('📦 Creating order...');
    console.log('📋 Received customerInfo:', JSON.stringify(customerInfo, null, 2));

    // Validate required fields
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

    // Check for both field name formats
    const customerName = customerInfo.full_name || customerInfo.name;
    const customerPhone = customerInfo.mobile || customerInfo.phone;
    const customerAddress = customerInfo.address;
    const customerEmail = customerInfo.email || '';
    const customerNotes = customerInfo.special_instructions || customerInfo.notes || '';

    if (!customerName || !customerPhone || !customerAddress) {
      console.error('❌ Missing customer info:', {
        name: customerName,
        phone: customerPhone,
        address: customerAddress
      });
      return res.status(400).json({
        success: false,
        message: 'Customer information is incomplete (name, phone, address required)'
      });
    }

    // Get carpet and shoes toggle preferences
    const carpetContactEnabled = req.body.carpetContactEnabled || false;
    const shoesContactEnabled = req.body.shoesContactEnabled || false;

    // Create order number
    const orderNumber = generateOrderNumber();

    // Create order object with proper field names
    const orderData = {
      orderNumber,
      sessionId,
      items,
      subtotal: subtotal || total,
      deliveryFee,
      tax,
      discount,
      total: total || subtotal,
      status: 'pending',
      customerInfo: {
        full_name: customerName,
        mobile: customerPhone,
        email: customerEmail,
        address: customerAddress,
        special_instructions: customerNotes,
        city: customerInfo.city || 'Dubai',
        crmPreferences: {
          carpetContactEnabled,
          shoesContactEnabled,
        },
      },
    };

    // Save to database
    const order = new Order(orderData);
    await order.save();

    console.log(`✅ Order created: ${orderNumber}`);
    console.log(`📊 Order total: AED ${order.total} (Subtotal: AED ${order.subtotal})`);
    console.log(`🪙 Carpet Contact Enabled: ${carpetContactEnabled ? 'YES' : 'NO'}`);
    console.log(`👟 Shoes Contact Enabled: ${shoesContactEnabled ? 'YES' : 'NO'}`);

    // SEND TO ZOHO WEBHOOK
    console.log('🚀 Sending to Zoho webhook...');
    const webhookResult = await sendToZohoWebhook(customerInfo, orderNumber);

    if (webhookResult.success) {
      console.log('✅ Zoho webhook sent successfully');
    } else {
      console.error('❌ Zoho webhook failed:', webhookResult.error);
    }

    // Clear the cart after successful order
    try {
      await Cart.findOneAndDelete({ sessionId });
      console.log(`🗑️ Cart cleared for session: ${sessionId}`);
    } catch (cartError) {
      console.error('Failed to clear cart:', cartError.message);
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
      webhookSent: webhookResult.success,
      whatsappLink: `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, I've placed order #${orderNumber}. Please confirm.`)}`,
    });

  } catch (error) {
    console.error('❌ Create order error:', error);
    console.log('========================================');
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

// Track order (alias)
exports.trackOrder = exports.getOrderByNumber;