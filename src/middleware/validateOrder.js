/**
 * Order validation middleware
 * Validates order data before processing
 */
const validateOrder = (req, res, next) => {
    const { customerInfo, items } = req.body;

    const errors = [];

    // Validate customer info
    if (!customerInfo) {
        errors.push('Customer information is required');
    } else {
        if (!customerInfo.name || customerInfo.name.trim().length < 2) {
            errors.push('Customer name is required (minimum 2 characters)');
        }

        if (!customerInfo.phone) {
            errors.push('Customer phone number is required');
        } else {
            // Basic phone validation for UAE numbers
            const phoneRegex = /^(\+971|00971|0)?5[0-9]{8}$/;
            if (!phoneRegex.test(customerInfo.phone.replace(/\s/g, ''))) {
                errors.push('Invalid UAE phone number format');
            }
        }

        if (!customerInfo.address || customerInfo.address.trim().length < 5) {
            errors.push('Delivery address is required (minimum 5 characters)');
        }

        if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
            errors.push('Invalid email format');
        }
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
        errors.push('At least one item is required');
    } else {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.name || item.name.trim().length === 0) {
                errors.push(`Item ${i + 1}: Name is required`);
            }
            if (!item.price || item.price <= 0) {
                errors.push(`Item ${i + 1}: Valid price is required`);
            }
            if (!item.quantity || item.quantity < 1) {
                errors.push(`Item ${i + 1}: Quantity must be at least 1`);
            }
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
    }

    next();
};

module.exports = validateOrder;