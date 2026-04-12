// src/utils/tracking.js

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
 * Calculate estimated delivery date based on order type and location
 * @param {string} serviceType - Type of service (express, standard, etc.)
 * @param {string} location - Customer location
 * @returns {Date} Estimated delivery date
 */
exports.calculateEstimatedDelivery = (serviceType = 'standard', location = 'dubai') => {
  const now = new Date();
  let daysToAdd = 2; // Default 2 days for standard service
  
  switch (serviceType) {
    case 'express':
      daysToAdd = 1;
      break;
    case 'same-day':
      daysToAdd = 0;
      break;
    case 'standard':
    default:
      daysToAdd = 2;
      break;
  }
  
  // Add business days only (skip Friday for UAE)
  let deliveryDate = new Date(now);
  let daysAdded = 0;
  
  while (daysAdded < daysToAdd) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    // Skip Friday (day 5 in JS, where Sunday = 0)
    if (deliveryDate.getDay() !== 5) {
      daysAdded++;
    }
  }
  
  return deliveryDate;
};

/**
 * Get status display name and color
 * @param {string} status - Order status code
 * @returns {object} Status info with label, color, and icon
 */
exports.getStatusInfo = (status) => {
  const statusMap = {
    pending: {
      label: 'Pending',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: 'clock',
      description: 'Your order has been placed and is waiting for confirmation',
    },
    confirmed: {
      label: 'Confirmed',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      icon: 'check-circle',
      description: 'Your order has been confirmed and is being processed',
    },
    processing: {
      label: 'Processing',
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      icon: 'settings',
      description: 'Your items are being cleaned and processed',
    },
    ready_for_pickup: {
      label: 'Ready for Pickup',
      color: 'indigo',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-800',
      icon: 'package',
      description: 'Your order is ready and will be picked up soon',
    },
    out_for_delivery: {
      label: 'Out for Delivery',
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      icon: 'truck',
      description: 'Your order is out for delivery',
    },
    delivered: {
      label: 'Delivered',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: 'home',
      description: 'Your order has been delivered successfully',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: 'x-circle',
      description: 'Your order has been cancelled',
    },
  };
  
  return statusMap[status] || statusMap.pending;
};

/**
 * Generate tracking history entry
 * @param {string} status - Order status
 * @param {string} description - Status description
 * @param {string} location - Location of the update
 * @returns {object} Tracking history entry
 */
exports.createTrackingHistoryEntry = (status, description, location = null) => {
  const statusInfo = exports.getStatusInfo(status);
  
  return {
    status,
    timestamp: new Date(),
    description: description || statusInfo.description,
    location: location || 'Laundrica Facility',
  };
};

/**
 * Validate tracking number format
 * @param {string} trackingNumber - Tracking number to validate
 * @returns {boolean} True if valid format
 */
exports.isValidTrackingNumber = (trackingNumber) => {
  const pattern = /^LND\d{8}[A-Z0-9]{4}$/;
  return pattern.test(trackingNumber);
};

/**
 * Parse tracking number to get order information
 * @param {string} trackingNumber - Tracking number
 * @returns {object} Parsed tracking info
 */
exports.parseTrackingNumber = (trackingNumber) => {
  if (!exports.isValidTrackingNumber(trackingNumber)) {
    return null;
  }
  
  const prefix = trackingNumber.substring(0, 3);
  const timestamp = trackingNumber.substring(3, 11);
  const random = trackingNumber.substring(11, 15);
  
  return {
    prefix,
    timestamp: parseInt(timestamp),
    random,
    estimatedDate: new Date(parseInt(timestamp)),
  };
};