// utils/email.js
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For development, use ethereal.email (fake SMTP)
  if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'your-ethereal-email@ethereal.email',
        pass: 'your-ethereal-password',
      },
    });
  }
  
  // Production - use actual SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Laundrica" <${process.env.FROM_EMAIL || 'noreply@laundrica.com'}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't throw error - email sending should not break the order flow
    return null;
  }
};

module.exports = { sendEmail };