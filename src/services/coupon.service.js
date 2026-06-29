// services/coupon.service.js
const logger = require('../utils/logger');

class CouponService {
    constructor() {
        this.validCoupons = {
            'WELCOME10': { type: 'percentage', value: 10, minPurchase: 50, maxDiscount: 50 },
            'LAUNDRICA20': { type: 'percentage', value: 20, minPurchase: 100, maxDiscount: 100 },
            'FREE15': { type: 'fixed', value: 15, minPurchase: 75 },
        };
    }

    validateCoupon(code) {
        const coupon = this.validCoupons[code.toUpperCase()];
        if (!coupon) {
            const error = new Error('Invalid coupon code');
            error.statusCode = 400;
            throw error;
        }
        return coupon;
    }

    calculateDiscount(subtotal, couponCode) {
        const coupon = this.validateCoupon(couponCode);

        if (subtotal < coupon.minPurchase) {
            const error = new Error(`Minimum purchase of AED ${coupon.minPurchase} required`);
            error.statusCode = 400;
            throw error;
        }

        let discountAmount = 0;
        if (coupon.type === 'percentage') {
            discountAmount = (subtotal * coupon.value) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            discountAmount = coupon.value;
        }

        return {
            code: couponCode.toUpperCase(),
            discountAmount,
            total: subtotal - discountAmount,
        };
    }

    getCouponInfo(code) {
        return this.validCoupons[code.toUpperCase()] || null;
    }

    getAllCoupons() {
        return Object.entries(this.validCoupons).map(([code, data]) => ({
            code,
            ...data,
        }));
    }
}

module.exports = new CouponService();