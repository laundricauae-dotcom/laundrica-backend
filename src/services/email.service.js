// services/email.service.js
const { Resend } = require('resend');

class EmailService {
    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.fromEmail = process.env.FROM_EMAIL;
        this.adminEmail = process.env.TO_EMAIL;
    }

    // Newsletter subscription email to user
    async sendNewsletterConfirmation(email) {
        try {
            await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: 'Welcome to Laundrica Newsletter! 🧺',
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #00261b; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px; background: #f9faf7; }
              .button { background: #00261b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✨ Welcome to Laundrica!</h1>
              </div>
              <div class="content">
                <h2>Thanks for subscribing!</h2>
                <p>You've successfully subscribed to Laundrica's newsletter. Get ready for:</p>
                <ul>
                  <li>🎉 Exclusive offers & discounts</li>
                  <li>🧺 Expert laundry care tips</li>
                  <li>✨ New service announcements</li>
                  <li>🎁 Special birthday rewards</li>
                </ul>
                <p>Stay tuned for our first welcome email with a special discount code!</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://laundrica.com" class="button">Explore Our Services</a>
                </div>
              </div>
              <div class="footer">
                <p>Laundrica - Premium Laundry & Dry Cleaning Services</p>
                <p>Dubai, UAE | +971 50 820 3555</p>
                <p>© 2024 Laundrica. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
            });
            return { success: true };
        } catch (error) {
            console.error('Error sending newsletter confirmation:', error);
            throw error;
        }
    }

    // Newsletter notification to admin
    async sendAdminNewsletterNotification(email) {
        try {
            await this.resend.emails.send({
                from: this.fromEmail,
                to: this.adminEmail,
                subject: '📧 New Newsletter Subscription',
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #00261b; color: white; padding: 20px; }
              .content { padding: 20px; background: #f5f5f5; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>New Newsletter Subscriber!</h2>
              </div>
              <div class="content">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Source:</strong> Contact Page Newsletter Signup</p>
              </div>
            </div>
          </body>
          </html>
        `
            });
            return { success: true };
        } catch (error) {
            console.error('Error sending admin notification:', error);
            throw error;
        }
    }

    // Business request confirmation to client
    async sendBusinessRequestConfirmation(data) {
        try {
            await this.resend.emails.send({
                from: this.fromEmail,
                to: data.email,
                subject: 'Business Service Request Received - Laundrica',
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #00261b; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px; background: #f9faf7; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00261b; }
              .button { background: #00261b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏢 Business Service Request Received</h1>
              </div>
              <div class="content">
                <h2>Thank you for your interest, ${data.name}!</h2>
                <p>We've received your business service request and our commercial team will get back to you within 24 hours.</p>
                
                <div class="info-box">
                  <h3>Request Summary:</h3>
                  <p><strong>Business Name:</strong> ${data.businessName || 'Not provided'}</p>
                  <p><strong>Business Type:</strong> ${data.businessType}</p>
                  <p><strong>Contact Number:</strong> ${data.phone}</p>
                  <p><strong>Email:</strong> ${data.email}</p>
                  <p><strong>Message:</strong> ${data.message || 'No message provided'}</p>
                </div>
                
                <p>Our team will contact you shortly to discuss customized solutions for your business needs.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://laundrica.com" class="button">Visit Our Website</a>
                </div>
                
                <p>In the meantime, feel free to call us at <strong>+971 50 820 3555</strong> for immediate assistance.</p>
              </div>
              <div class="footer">
                <p>Laundrica Commercial Division | Dubai, UAE</p>
              </div>
            </div>
          </body>
          </html>
        `
            });
            return { success: true };
        } catch (error) {
            console.error('Error sending business confirmation:', error);
            throw error;
        }
    }

    // Business request notification to admin
    async sendAdminBusinessNotification(data) {
        try {
            await this.resend.emails.send({
                from: this.fromEmail,
                to: this.adminEmail,
                subject: '🏢 NEW Business Service Request',
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #00261b; color: white; padding: 20px; }
              .content { padding: 20px; background: #f5f5f5; }
              .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .action-button { background: #00261b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>⚠️ New Business Service Request!</h2>
              </div>
              <div class="content">
                <h3>Client Details:</h3>
                <div class="info-box">
                  <p><strong>Name:</strong> ${data.name}</p>
                  <p><strong>Business Name:</strong> ${data.businessName || 'Not provided'}</p>
                  <p><strong>Business Type:</strong> ${data.businessType}</p>
                  <p><strong>Phone:</strong> ${data.phone}</p>
                  <p><strong>Email:</strong> ${data.email}</p>
                  <p><strong>Message:</strong> ${data.message || 'No message provided'}</p>
                </div>
                <p><strong>Request Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Action Required:</strong> Please contact this client within 24 hours.</p>
                <div style="margin-top: 20px;">
                  <a href="mailto:${data.email}" class="action-button">Reply to Client →</a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
            });
            return { success: true };
        } catch (error) {
            console.error('Error sending admin business notification:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();