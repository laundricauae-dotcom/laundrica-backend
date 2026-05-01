class WhatsAppService {
    constructor() {
        this.businessNumber = process.env.WHATSAPP_BUSINESS_NUMBER;
    }

    /**
     * Generate WhatsApp message for order
     */
    generateOrderMessage(order) {
        const itemsList = order.items.map((item, index) => {
            return `${index + 1}. *${item.name}* x${item.quantity} = AED ${(item.price * item.quantity).toFixed(2)}`;
        }).join('\n');

        const message = `🫧 *LAUNDRICA - NEW ORDER* 🫧
━━━━━━━━━━━━━━━━━━━━
📋 *Order Details*
━━━━━━━━━━━━━━━━━━━━
🧾 Order #: ${order.orderNumber}
📅 Date: ${new Date(order.createdAt).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
🛍️ *Items Ordered*
${itemsList}
━━━━━━━━━━━━━━━━━━━━
💰 *Cost Summary*
• Subtotal: AED ${order.subtotal.toFixed(2)}
• Delivery: AED ${order.deliveryFee.toFixed(2)}
• Tax (5%): AED ${order.tax.toFixed(2)}
${order.discount > 0 ? `• Discount: -AED ${order.discount.toFixed(2)}\n` : ''}━━━━━━━━━━━━━━━━━━━━
💵 *TOTAL: AED ${order.total.toFixed(2)}*
━━━━━━━━━━━━━━━━━━━━
👤 *Customer Information*
━━━━━━━━━━━━━━━━━━━━
Name: ${order.customerInfo.name}
Phone: ${order.customerInfo.phone}
Email: ${order.customerInfo.email || 'N/A'}
Address: ${order.customerInfo.address}
City: ${order.customerInfo.city}
━━━━━━━━━━━━━━━━━━━━
📝 *Notes*
${order.customerInfo.notes || 'No special instructions'}
━━━━━━━━━━━━━━━━━━━━
✅ *Status:* ${order.status}
━━━━━━━━━━━━━━━━━━━━
Thank you for choosing Laundrica! ✨`;

        return encodeURIComponent(message);
    }

    /**
     * Generate WhatsApp link for order
     */
    generateWhatsAppLink(order) {
        const message = this.generateOrderMessage(order);
        return `https://wa.me/${this.businessNumber}?text=${message}`;
    }

    /**
     * Send order via WhatsApp (using Twilio or similar if configured)
     */
    async sendOrderViaWhatsApp(order, customerPhone) {
        // If Twilio is configured, send programmatically
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_WHATSAPP_FROM) {
            try {
                const twilio = require('twilio')(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );

                const message = this.generateOrderMessage(order);
                const decodedMessage = decodeURIComponent(message);

                const result = await twilio.messages.create({
                    body: decodedMessage,
                    from: process.env.TWILIO_WHATSAPP_FROM,
                    to: `whatsapp:${customerPhone}`,
                });

                console.log(`✅ WhatsApp message sent to ${customerPhone}: ${result.sid}`);
                return { success: true, sid: result.sid };
            } catch (error) {
                console.error('❌ Twilio WhatsApp send failed:', error.message);
                return { success: false, error: error.message };
            }
        }

        // Return link for manual sending
        return {
            success: true,
            link: this.generateWhatsAppLink(order),
            message: 'Click link to send order via WhatsApp',
        };
    }
}

module.exports = new WhatsAppService();