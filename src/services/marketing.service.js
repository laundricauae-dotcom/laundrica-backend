const geoip = require('geoip-lite');
const useragent = require('useragent');
const logger = require('../utils/logger');

class MarketingService {
    constructor() {
        // Cache geoip lookups to reduce repeated lookups
        this.geoCache = new Map();
    }

    extractUTMParams(query) {
        return {
            source: query.utm_source || '',
            medium: query.utm_medium || '',
            campaign: query.utm_campaign || '',
            term: query.utm_term || '',
            content: query.utm_content || '',
        };
    }

    extractClickIds(query) {
        return {
            gclid: query.gclid || '',
            fbclid: query.fbclid || '',
            msclkid: query.msclkid || '',
        };
    }

    getBrowserInfo(userAgentString, headers) {
        if (!userAgentString) {
            return {
                name: '',
                version: '',
                os: '',
                deviceType: '',
                userAgent: '',
                language: '',
            };
        }

        const agent = useragent.parse(userAgentString);
        const deviceType = this.detectDeviceType(userAgentString);

        return {
            name: agent.family || '',
            version: agent.toVersion() || '',
            os: agent.os.family || '',
            deviceType: deviceType,
            userAgent: userAgentString || '',
            language: headers['accept-language'] || '',
        };
    }

    detectDeviceType(userAgent) {
        if (!userAgent) return 'desktop';

        const ua = userAgent.toLowerCase();
        if (/(tablet|ipad|playbook|kindle)/i.test(ua)) return 'tablet';
        if (/(mobile|iphone|ipod|android|blackberry|windows phone)/i.test(ua)) return 'mobile';
        return 'desktop';
    }

    getGeoInfo(ip) {
        if (!ip || ip === '::1' || ip === '127.0.0.1') {
            return {
                ip: ip || '',
                country: '',
                region: '',
                city: '',
                latitude: null,
                longitude: null,
                timezone: '',
            };
        }

        // Check cache
        if (this.geoCache.has(ip)) {
            return this.geoCache.get(ip);
        }

        try {
            const geo = geoip.lookup(ip);

            let result = {
                ip: ip,
                country: geo?.country || '',
                region: geo?.region || '',
                city: geo?.city || '',
                latitude: geo?.ll?.[0] || null,
                longitude: geo?.ll?.[1] || null,
                timezone: geo?.timezone || '',
            };

            // Cache the result
            this.geoCache.set(ip, result);

            return result;
        } catch (error) {
            logger.error('GeoIP lookup error:', error);
            return {
                ip: ip,
                country: '',
                region: '',
                city: '',
                latitude: null,
                longitude: null,
                timezone: '',
            };
        }
    }

    getPageInfo(req) {
        return {
            referrer: req.headers.referer || req.headers.referrer || '',
            landingPage: req.headers['x-landing-page'] || req.headers['x-original-url'] || '',
            currentPage: req.originalUrl || req.url || '',
        };
    }

    getClientIP(req) {
        // Trust the X-Forwarded-For header if present (for proxies)
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            const ips = forwarded.split(',').map(ip => ip.trim());
            // Get the first IP (client IP)
            return ips[0] || req.connection.remoteAddress || req.ip || '';
        }

        return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';
    }

    collectMarketingData(req) {
        try {
            const query = req.query || {};
            const headers = req.headers || {};
            const userAgent = headers['user-agent'] || '';

            // Get client IP - never trust frontend
            const ip = this.getClientIP(req);

            const marketingData = {
                utm: this.extractUTMParams(query),
                clickIds: this.extractClickIds(query),
                geo: this.getGeoInfo(ip),
                browser: this.getBrowserInfo(userAgent, headers),
                page: this.getPageInfo(req),
                sessionId: req.headers['x-session-id'] || req.params.sessionId || '',
                timestamp: new Date(),
            };

            logger.debug('Marketing data collected:', {
                sessionId: marketingData.sessionId,
                utmSource: marketingData.utm.source,
                country: marketingData.geo.country,
                deviceType: marketingData.browser.deviceType,
            });

            return marketingData;
        } catch (error) {
            logger.error('Error collecting marketing data:', error);
            // Return empty marketing data to not break the flow
            return {
                utm: { source: '', medium: '', campaign: '', term: '', content: '' },
                clickIds: { gclid: '', fbclid: '', msclkid: '' },
                geo: { ip: '', country: '', region: '', city: '', latitude: null, longitude: null, timezone: '' },
                browser: { name: '', version: '', os: '', deviceType: '', userAgent: '', language: '' },
                page: { referrer: '', landingPage: '', currentPage: '' },
                sessionId: '',
                timestamp: new Date(),
            };
        }
    }

    // Format marketing data for Zoho webhook
    formatForZoho(marketingData) {
        return {
            utm_source: marketingData.utm.source || '',
            utm_medium: marketingData.utm.medium || '',
            utm_campaign: marketingData.utm.campaign || '',
            utm_term: marketingData.utm.term || '',
            utm_content: marketingData.utm.content || '',
            gclid: marketingData.clickIds.gclid || '',
            fbclid: marketingData.clickIds.fbclid || '',
            msclkid: marketingData.clickIds.msclkid || '',
            visitor_ip: marketingData.geo.ip || '',
            visitor_country: marketingData.geo.country || '',
            visitor_region: marketingData.geo.region || '',
            visitor_city: marketingData.geo.city || '',
            visitor_latitude: marketingData.geo.latitude || '',
            visitor_longitude: marketingData.geo.longitude || '',
            visitor_timezone: marketingData.geo.timezone || '',
            browser_name: marketingData.browser.name || '',
            browser_version: marketingData.browser.version || '',
            operating_system: marketingData.browser.os || '',
            device_type: marketingData.browser.deviceType || '',
            user_agent: marketingData.browser.userAgent || '',
            browser_language: marketingData.browser.language || '',
            referrer: marketingData.page.referrer || '',
            landing_page: marketingData.page.landingPage || '',
            current_page: marketingData.page.currentPage || '',
            session_id: marketingData.sessionId || '',
            timestamp: marketingData.timestamp ? new Date(marketingData.timestamp).toISOString() : '',
        };
    }
}

module.exports = new MarketingService();