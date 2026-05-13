const axios = require('axios');

class InteraktWhatsAppService {
    constructor() {
        this.apiKey = process.env.INTERAKT_API_KEY;
        this.baseUrl = 'https://api.interakt.ai/v1/public/';
        this.templateName = process.env.INTERAKT_TEMPLATE_NAME || 'order_confirmation';
        this.languageCode = process.env.INTERAKT_TEMPLATE_LANGUAGE || 'en';
    }

    async sendTemplateMessage(phoneNumber, countryCode, templateValues) {
        // Check if we have a real API key
        if (!this.apiKey || this.apiKey === 'placeholder_will_add_later') {
            console.log('\n📱 ========== WHATSAPP SIMULATION ==========');
            console.log(`✅ WhatsApp would be sent to: ${countryCode}${phoneNumber}`);
            console.log(`📝 Template: ${this.templateName}`);
            console.log(`📋 Values:`, templateValues);
            console.log(`🔧 Get Interakt API key from: https://app.interakt.ai`);
            console.log('===========================================\n');
            return { success: true, simulated: true, messageId: `sim_${Date.now()}` };
        }

        // Real API call
        try {
            const cleanedPhone = phoneNumber.replace(/\D/g, '');

            const requestBody = {
                countryCode: countryCode,
                phoneNumber: cleanedPhone,
                type: "Template",
                template: {
                    name: this.templateName,
                    languageCode: this.languageCode,
                    bodyValues: templateValues
                }
            };

            console.log(`📤 Sending WhatsApp to ${countryCode}${cleanedPhone}...`);

            const response = await axios.post(
                `${this.baseUrl}message/`,
                requestBody,
                {
                    headers: {
                        'Authorization': `Basic ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.result) {
                console.log(`✅ WhatsApp sent! Message ID: ${response.data.id}`);
                return { success: true, messageId: response.data.id };
            }
            return { success: false, error: response.data.message };
        } catch (error) {
            console.error('❌ Interakt API error:', error.response?.data || error.message);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    }

    async sendOrderConfirmation(order, customerPhone) {
        const phoneMatch = customerPhone.match(/(\+\d{1,3})(\d+)/);
        let countryCode = '+971';
        let phoneNumber = customerPhone;

        if (phoneMatch) {
            countryCode = phoneMatch[1];
            phoneNumber = phoneMatch[2];
        }

        const trackingLink = `${process.env.FRONTEND_URL || 'https://laundrica.com'}/track/${order.orderNumber}`;

        const templateValues = [
            order.orderNumber,
            order.customerInfo.name,
            `AED ${order.total.toFixed(2)}`,
            trackingLink
        ];

        const result = await this.sendTemplateMessage(phoneNumber, countryCode, templateValues);

        // Log order details for manual sending
        console.log('\n📋 ORDER DETAILS:');
        console.log(`Order #: ${order.orderNumber}`);
        console.log(`Customer: ${order.customerInfo.name} (${order.customerInfo.phone})`);
        console.log(`Total: AED ${order.total.toFixed(2)}`);
        console.log(`Address: ${order.customerInfo.address}`);

        const manualLink = this.generateWhatsAppLink(order);
        console.log(`\n🔗 Manual WhatsApp Link: ${manualLink}`);
        console.log('=====================================\n');

        return result;
    }

    generateWhatsAppLink(order) {
        const businessNumber = process.env.WHATSAPP_BUSINESS_NUMBER?.replace(/\D/g, '') || '971XXXXXXXXX';

        const itemsList = order.items.map((item, index) => {
            return `${index + 1}. ${item.name} x${item.quantity} = AED ${(item.price * item.quantity).toFixed(2)}`;
        }).join('\n');

        const message = `🫧 *LAUNDRICA - NEW ORDER* 🫧\n\n` +
            `📋 Order #: ${order.orderNumber}\n` +
            `📅 Date: ${new Date(order.createdAt).toLocaleString()}\n\n` +
            `🛍️ Items:\n${itemsList}\n\n` +
            `💰 Total: AED ${order.total.toFixed(2)}\n\n` +
            `👤 Customer: ${order.customerInfo.name}\n` +
            `📍 Address: ${order.customerInfo.address}\n` +
            `📞 Phone: ${order.customerInfo.phone}\n\n` +
            `Thank you for choosing Laundrica! ✨`;

        return `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`;
    }
}

module.exports = new InteraktWhatsAppService();