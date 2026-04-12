exports.orderConfirmationTemplate = (order, user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1f4f2b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .status { display: inline-block; padding: 5px 10px; border-radius: 5px; font-size: 12px; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-confirmed { background: #dbeafe; color: #1e40af; }
        .status-processing { background: #e9d5ff; color: #6b21a5; }
        .status-delivered { background: #d1fae5; color: #065f46; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background: #1f4f2b; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Laundrica</h1>
          <p>Order Confirmation</p>
        </div>
        <div class="content">
          <h2>Hello ${user.name},</h2>
          <p>Thank you for your order! We've received your request and are processing it.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Tracking Number:</strong> ${order.tracking.trackingNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Total Amount:</strong> AED ${order.total.toFixed(2)}</p>
            <p><strong>Status:</strong> <span class="status status-${order.status}">${order.status}</span></p>
          </div>
          
          <div class="order-details">
            <h3>Order Items</h3>
            ${order.items.map(item => `
              <div style="margin-bottom: 10px;">
                <strong>${item.name}</strong> x ${item.quantity} = AED ${(item.price * item.quantity).toFixed(2)}
              </div>
            `).join('')}
          </div>
          
          <div class="order-details">
            <h3>Shipping Address</h3>
            <p>
              ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
              Phone: ${order.shippingAddress.phone}<br>
              Email: ${order.shippingAddress.email}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL}/track/${order.tracking.trackingNumber}" class="button">Track Your Order</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Laundrica. All rights reserved.</p>
          <p>Need help? Contact us at support@laundrica.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.statusUpdateTemplate = (order, user, statusMessage) => {
  const statusColors = {
    confirmed: '#dbeafe',
    processing: '#e9d5ff',
    ready_for_pickup: '#fef3c7',
    out_for_delivery: '#fed7aa',
    delivered: '#d1fae5',
    cancelled: '#fee2e2',
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1f4f2b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .status-box { background: ${statusColors[order.status] || '#f3f4f6'}; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background: #1f4f2b; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Laundrica</h1>
          <p>Order Status Update</p>
        </div>
        <div class="content">
          <h2>Hello ${user.name},</h2>
          <p>Your order status has been updated!</p>
          
          <div class="status-box">
            <h3>Order #${order.orderNumber}</h3>
            <p><strong>New Status:</strong> ${order.status.toUpperCase()}</p>
            <p>${statusMessage}</p>
            ${order.tracking.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.tracking.estimatedDelivery).toLocaleDateString()}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL}/track/${order.tracking.trackingNumber}" class="button">Track Your Order</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Laundrica. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};