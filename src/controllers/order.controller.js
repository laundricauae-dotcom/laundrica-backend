// /src/controllers/order.controller.js
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const zohoService = require('../services/zoho.service');
const { v4: uuidv4 } = require('uuid');

// WhatsApp service function
const sendWhatsAppMessage = async (order, customerPhone) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    // If using Twilio
    if (accountSid && authToken && twilioWhatsAppNumber) {
      const client = require('twilio')(accountSid, authToken);

      const itemsList = order.items.map(item =>
        `• ${item.name} x${item.quantity} = AED ${(item.price * item.quantity).toFixed(2)}`
      ).join('\n');

      const messageBody = `🫧 *LAUNDRICA ORDER CONFIRMED* 🫧

Order #: ${order.orderNumber}

Customer: ${order.customerInfo.name}
Phone: ${order.customerInfo.phone}

📦 *Items:*
${itemsList}

💰 *Total: AED ${order.total.toFixed(2)}*

⏰ Expected Delivery: 24-48 hours

Thank you for choosing Laundrica! ✨`;

      await client.messages.create({
        body: messageBody,
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: `whatsapp:${customerPhone}`
      });

      console.log(`✅ WhatsApp message sent to ${customerPhone}`);
      return true;
    }

    // If using WhatsApp Business API via interakt
    if (process.env.INTERAKT_API_KEY) {
      const axios = require('axios');
      const itemsList = order.items.map(item =>
        `• ${item.name} x${item.quantity} = AED ${(item.price * item.quantity).toFixed(2)}`
      ).join('\n');

      const response = await axios.post('https://api.interakt.ai/v1/public/message/', {
        channel: 'whatsapp',
        to: customerPhone,
        type: 'text',
        text: {
          body: `🫧 *LAUNDRICA ORDER CONFIRMED* 🫧\n\nOrder #: ${order.orderNumber}\n\nCustomer: ${order.customerInfo.name}\n\n📦 Items:\n${itemsList}\n\n💰 Total: AED ${order.total.toFixed(2)}\n\nThank you for choosing Laundrica! ✨`
        }
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.INTERAKT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ WhatsApp message sent via Interakt to ${customerPhone}`);
      return true;
    }

    console.log('⚠️ WhatsApp service not configured, skipping message');
    return false;
  } catch (error) {
    console.error('❌ WhatsApp send error:', error.message);
    return false;
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

    console.log('📨 POST /api/orders -', new Date().toISOString());
    console.log('📦 Creating order...');

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    if (!customerInfo || !customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      return res.status(400).json({ success: false, message: 'Customer information is incomplete' });
    }

    // Get carpet and shoes toggle preferences from localStorage (sent from frontend)
    // The frontend sends these in the request body
    const carpetContactEnabled = req.body.carpetContactEnabled || false;
    const shoesContactEnabled = req.body.shoesContactEnabled || false;

    // Create order number
    const orderNumber = generateOrderNumber();

    // Create order object
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
        ...customerInfo,
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

    // Sync to Zoho CRM
    try {
      console.log(`🔄 Syncing order ${orderNumber} to Zoho CRM...`);
      const syncResult = await zohoService.syncOrderToZoho(order);
      if (syncResult.success) {
        console.log(`✅ Order ${orderNumber} synced to Zoho CRM`);
      } else {
        console.error(`❌ Failed to sync order ${orderNumber} to Zoho:`, syncResult.error);
      }
    } catch (zohoError) {
      console.error('❌ Zoho sync error:', zohoError.message);
    }

    // Send WhatsApp message
    try {
      const formattedPhone = customerInfo.phone.replace(/^\+/, '').replace(/\s/g, '');
      await sendWhatsAppMessage(order, formattedPhone);
    } catch (whatsappError) {
      console.error('❌ WhatsApp error:', whatsappError.message);
    }

    // Clear the cart after successful order
    try {
      await Cart.findOneAndDelete({ sessionId });
      console.log(`🗑️ Cart cleared for session: ${sessionId}`);
    } catch (cartError) {
      console.error('Failed to clear cart:', cartError.message);
    }

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
      whatsappLink: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(`Hello, I've placed order #${orderNumber}. Please confirm.`)}`,
    });

  } catch (error) {
    console.error('❌ Create order error:', error);
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
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    // Update in Zoho CRM if deal ID exists
    if (order.zohoDealId) {
      try {
        await zohoService.updateDealStatus(orderNumber, status, order.zohoDealId);
      } catch (zohoError) {
        console.error('Failed to update Zoho deal status:', zohoError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};