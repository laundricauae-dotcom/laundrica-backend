const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { v4: uuidv4 } = require('uuid');
const whatsappService = require('../services/whatsapp.service');

// Zoho Flow Webhook URL
const ZOHO_FLOW_URL = "https://flow.zoho.com/925120593/flow/webhook/incoming?zapikey=PASTE_MY_ZAPIKEY_HERE&isdebug=false";

// Generate order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
};

// Function to send data to Zoho Flow
const sendToZohoFlow = async (payload) => {
  try {
    console.log("====================================");
    console.log("🚀 SENDING TO ZOHO FLOW");
    console.log("====================================");
    console.log("Webhook URL:", ZOHO_FLOW_URL);
    console.log("Zoho Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(ZOHO_FLOW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("Zoho Status:", response.status, response.statusText);

    const responseText = await response.text();
    console.log("Zoho Response:", responseText);

    if (!response.ok) {
      console.error("❌ ZOHO FLOW FAILED");
      console.error("Status:", response.status);
      console.error("Response:", responseText);
      return { success: false, error: `HTTP ${response.status}: ${responseText}` };
    }

    console.log("✅ ZOHO FLOW SUCCESS");
    console.log("====================================");
    return { success: true, response: responseText };
  } catch (error) {
    console.error("❌ ZOHO FLOW ERROR");
    console.error(error);
    console.log("====================================");
    return { success: false, error: error.message };
  }
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
    const carpetContactEnabled = req.body.carpetContactEnabled || false;
    const shoesContactEnabled = req.body.shoesContactEnabled || false;

    // Create order number
    const orderNumber = generateOrderNumber();

    // Calculate items count
    const itemsCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

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

    // Send to Zoho Flow (does not block order creation)
    const zohoPayload = {
      name: customerInfo.name,
      phone: customerInfo.phone,
      email: customerInfo.email || "",
      address: `${customerInfo.address}, ${customerInfo.city || 'Dubai'}`,
      source: "WB",
      orderTotal: order.total,
      itemsCount: itemsCount,
      orderNumber: orderNumber,
      notes: customerInfo.notes || "",
      carpetContact: carpetContactEnabled,
      shoesContact: shoesContactEnabled
    };

    // Call Zoho Flow asynchronously (don't await to avoid blocking response)
    sendToZohoFlow(zohoPayload).catch(err => {
      console.error("Unhandled Zoho Flow error:", err);
    });

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

// Resync order to Zoho Flow
exports.resyncToZoho = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const itemsCount = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const carpetContact = order.customerInfo?.crmPreferences?.carpetContactEnabled || false;
    const shoesContact = order.customerInfo?.crmPreferences?.shoesContactEnabled || false;

    const zohoPayload = {
      name: order.customerInfo?.name,
      phone: order.customerInfo?.phone,
      email: order.customerInfo?.email || "",
      address: `${order.customerInfo?.address}, ${order.customerInfo?.city || 'Dubai'}`,
      source: "WB",
      orderTotal: order.total,
      itemsCount: itemsCount,
      orderNumber: order.orderNumber,
      notes: order.customerInfo?.notes || "",
      carpetContact: carpetContact,
      shoesContact: shoesContact
    };

    const result = await sendToZohoFlow(zohoPayload);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Order resynced to Zoho Flow successfully',
        zohoResponse: result.response,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to sync to Zoho Flow',
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Resync to Zoho error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};