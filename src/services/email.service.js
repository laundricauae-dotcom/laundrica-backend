// services/email.service.js
const { Resend } = require('resend');

class EmailService {
  constructor() {
    // Only initialize Resend if API key exists
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_123') {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.isEnabled = true;
      console.log('✅ Email service initialized');
    } else {
      console.log('⚠️ Email service disabled: Missing or invalid RESEND_API_KEY');
      this.isEnabled = false;
      this.resend = null;
    }
  }

  async sendOrderConfirmation(orderData) {
    if (!this.isEnabled) {
      console.log('📧 Email skipped: Email service disabled');
      return { success: false, message: 'Email service disabled' };
    }

    try {
      // Your existing email logic here
      const result = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'Laundrica <noreply@laundrica.com>',
        to: orderData.customerInfo.email,
        subject: `Order Confirmation - ${orderData.orderNumber}`,
        html: this.generateOrderEmail(orderData),
      });

      console.log('✅ Order confirmation email sent');
      return { success: true, result };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  generateOrderEmail(orderData) {
    // Your email HTML template
    return `
            <h1>Order Confirmation</h1>
            <p>Thank you for your order!</p>
            <p>Order Number: ${orderData.orderNumber}</p>
            <p>Total: AED ${orderData.total}</p>
        `;
  }
}

// Only export if needed, otherwise provide a mock
let emailService;
try {
  emailService = new EmailService();
} catch (error) {
  console.log('Creating mock email service');
  emailService = {
    isEnabled: false,
    sendOrderConfirmation: async () => ({ success: false, message: 'Email service unavailable' })
  };
}

module.exports = emailService;