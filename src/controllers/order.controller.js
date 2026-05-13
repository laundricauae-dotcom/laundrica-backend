const Order = require('../models/Order');
const Cart = require('../models/Cart');
const whatsappService = require('../services/whatsapp.service');
const zohoService = require('../services/zoho.service');

// Create new order and sync with WhatsApp + Zoho CRM
exports.createOrder = async (req, res) => {
  try {
    console.log('📦 Creating order...');
    const { sessionId, customerInfo, items, cartData } = req.body;

    // Validation
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    if (!customerInfo || !customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone, and address'
      });
    }

    // Get items from request or cart
    let orderItems = items;
    let subtotal = 0;

    if (!orderItems || orderItems.length === 0) {
      const cart = await Cart.findOne({ sessionId });
      if (cart && cart.items.length > 0) {
        orderItems = cart.items.map(item => ({
          productId: item.productId || null,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          serviceItems: item.serviceItems || [],
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          designImage: item.designImage,
        }));
        subtotal = cart.subtotal;
      } else {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }
    } else {
      subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Calculate fees
    const deliveryFee = subtotal > 100 ? 0 : 15;
    const tax = subtotal * 0.05;
    const discount = 0;
    const total = subtotal + deliveryFee + tax - discount;

    // Create order in database
    const order = await Order.create({
      sessionId,
      items: orderItems.map(item => ({
        productId: item.productId || null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        serviceItems: item.serviceItems || [],
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        designImage: item.designImage,
      })),
      subtotal,
      deliveryFee,
      tax,
      discount,
      total,
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email || '',
        address: customerInfo.address,
        city: customerInfo.city || 'Dubai',
        notes: customerInfo.notes || '',
      },
      status: 'pending',
      whatsappSent: false,
      zohoSynced: false,
    });

    console.log(`✅ Order created: ${order.orderNumber}`);

    // ========== SYNC TO ZOHO CRM ==========
    let zohoSyncResult = null;
    try {
      zohoSyncResult = await zohoService.syncOrderToZoho(order);
      if (zohoSyncResult.success) {
        order.zohoSynced = true;
        order.zohoDealId = zohoSyncResult.dealId;
        await order.save();
        console.log(`✅ Order ${order.orderNumber} synced to Zoho CRM`);
      } else {
        console.warn(`⚠️ Zoho sync failed for ${order.orderNumber}:`, zohoSyncResult.error);
      }
    } catch (zohoError) {
      console.error(`❌ Zoho sync error for ${order.orderNumber}:`, zohoError.message);
    }

    // ========== SEND VIA WHATSAPP ==========
    // ========== SEND VIA INTERAKT WHATSAPP ==========
    let whatsappResult;
    try {
      const sendResult = await interaktWhatsapp.sendOrderConfirmation(order, customerInfo.phone);
      if (sendResult.success) {
        order.whatsappSent = true;
        order.whatsappSentAt = new Date();
        order.whatsappMessageId = sendResult.messageId;
        await order.save();
        whatsappResult = { success: true };
        console.log(`✅ WhatsApp confirmation sent for order ${order.orderNumber}`);
      } else {
        console.warn(`⚠️ Interakt API failed: ${sendResult.error}. Using fallback link.`);
        whatsappResult = {
          success: false,
          link: interaktWhatsapp.generateWhatsAppLink(order)
        };
      }
    } catch (whatsappError) {
      console.error(`❌ WhatsApp send error:`, whatsappError.message);
      whatsappResult = {
        success: false,
        link: interaktWhatsapp.generateWhatsAppLink(order)
      };
    }

    // ========== CRITICAL FIX: CLEAR THE CART COMPLETELY ==========
    try {
      // Method 1: Clear all items from cart
      const cart = await Cart.findOne({ sessionId });
      if (cart) {
        cart.items = [];
        cart.couponCode = null;
        cart.discountAmount = 0;
        cart.subtotal = 0;
        cart.total = 0;
        await cart.save();
        console.log(`✅ Cart cleared for session: ${sessionId}`);
      }

      // Method 2: Alternatively, delete the cart completely (uncomment if you prefer)
      // await Cart.findOneAndDelete({ sessionId });
      // console.log(`✅ Cart deleted for session: ${sessionId}`);
    } catch (cartError) {
      console.error(`⚠️ Error clearing cart:`, cartError.message);
      // Don't fail the order if cart clearing fails
    }

    // Prepare response
    const response = {
      success: true,
      order: {
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        zohoSynced: order.zohoSynced,
        whatsappSent: order.whatsappSent,
      },
      message: 'Order created successfully! Cart has been cleared.',
    };

    // Add WhatsApp link if not sent automatically
    if (!whatsappResult.success && whatsappResult.link) {
      response.whatsappLink = whatsappResult.link;
      response.message = 'Order created! Cart cleared. Click the link to confirm via WhatsApp.';
    }

    // Add Zoho info if synced
    if (zohoSyncResult && zohoSyncResult.success) {
      response.zoho = {
        dealId: zohoSyncResult.dealId,
        contactId: zohoSyncResult.contactId,
      };
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status, notes } = req.body;

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    if (notes) {
      order.customerInfo.notes = notes;
    }
    await order.save();

    if (order.zohoDealId) {
      await zohoService.updateDealStatus(orderNumber, status, order.zohoDealId);
    }

    res.status(200).json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Track order
exports.trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        customerInfo: order.customerInfo,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        zohoSynced: order.zohoSynced,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get orders by session
exports.getOrdersBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const orders = await Order.find({ sessionId })
      .sort('-createdAt')
      .limit(10);

    res.status(200).json({
      success: true,
      orders: orders.map(order => ({
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        zohoSynced: order.zohoSynced,
      })),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Resync order to Zoho
exports.resyncToZoho = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const result = await zohoService.syncOrderToZoho(order);

    if (result.success) {
      order.zohoSynced = true;
      order.zohoDealId = result.dealId;
      await order.save();
    }

    res.status(200).json({
      success: result.success,
      message: result.success ? 'Order resynced to Zoho' : 'Failed to sync',
      zoho: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};