/**
 * Generate a unique tracking number for orders
 * Format: LND + timestamp + random characters
 */
exports.generateTrackingNumber = () => {
  const prefix = 'LND';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

/**
 * Calculate estimated delivery date
 */
exports.calculateEstimatedDelivery = (serviceType = 'standard', location = 'dubai') => {
  const now = new Date();
  let daysToAdd = 2;

  switch (serviceType) {
    case 'express':
      daysToAdd = 1;
      break;
    case 'same-day':
      daysToAdd = 0;
      break;
    default:
      daysToAdd = 2;
  }

  let deliveryDate = new Date(now);
  let daysAdded = 0;

  while (daysAdded < daysToAdd) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    if (deliveryDate.getDay() !== 5) {
      daysAdded++;
    }
  }

  return deliveryDate;
};

/**
 * Get status display name
 */
exports.getStatusInfo = (status) => {
  const statusMap = {
    pending: { label: 'Pending', color: 'yellow', description: 'Order placed, waiting for confirmation' },
    processing: { label: 'Processing', color: 'purple', description: 'Your items are being cleaned' },
    completed: { label: 'Completed', color: 'green', description: 'Order completed successfully' },
    cancelled: { label: 'Cancelled', color: 'red', description: 'Order has been cancelled' },
  };

  return statusMap[status] || statusMap.pending;
};