const Order = require('../models/Order');
const Cart = require('../models/Cart');
const zohoService = require('../services/zoho.service');
const { v4: uuidv4 } = require('uuid');
const whatsappService = require('../services/whatsapp.service');

// Zoho Webhook URL
const ZOHO_WEBHOOK_URL = "https://flow.zoho.com/925120593/flow/webhook/incoming?zapikey=1001.a459dc2423c0615b04b76478d2f93b6a.aa50edf0a55826432e8724376b48564d&isdebug=false";

// Function to send data to Zoho Webhook
const sendToZohoWebhook = async (customerInfo, orderNumber) => {
  const payload = {
    full_name: customerInfo.name,
    mobile: customerInfo.phone,
    email: customerInfo.email || '',
    address: customerInfo.address,
    special_instructions: customerInfo.notes || '',
  };

  try {
    console.log('📤 Sending to Zoho Webhook:', payload);
    const response = await fetch(ZOHO_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log(`✅ Zoho Webhook response status: ${response.status}`);
    return { success: true };
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

    // Get carpet and shoes toggle preferences from frontend
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

    // 🔥 SEND TO ZOHO WEBHOOK (fire and forget - don't await)
    sendToZohoWebhook(customerInfo, orderNumber).catch(err =>
      console.error('Background Zoho webhook failed:', err)
    );

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

    // Send WhatsApp message using AiSensy service
    let whatsappResult = null;
    try {
      console.log(`📱 Sending WhatsApp confirmation to ${customerInfo.phone}...`);
      whatsappResult = await whatsappService.sendOrderConfirmation(order, customerInfo.phone);
      if (whatsappResult.success) {
        console.log(`✅ WhatsApp sent successfully${whatsappResult.simulated ? ' (simulated mode)' : ''}`);
      } else {
        console.error(`❌ WhatsApp failed: ${whatsappResult.error}`);
      }
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
      whatsappLink: `https://wa.me/${customerInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, I've placed order #${orderNumber}. Please confirm.`)}`,
      whatsappSent: whatsappResult?.success || false,
    });

  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order',
    });
  }
};

// Get order by number (track order)
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

// Track order (alias for getOrderByNumber)
exports.trackOrder = exports.getOrderByNumber;

// Resync order to Zoho
exports.resyncToZoho = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const syncResult = await zohoService.syncOrderToZoho(order);

    if (syncResult.success) {
      res.status(200).json({
        success: true,
        message: 'Order resynced to Zoho successfully',
        zohoDealId: order.zohoDealId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to sync to Zoho',
        error: syncResult.error,
      });
    }
  } catch (error) {
    console.error('Resync to Zoho error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};