// services/zoho-service.js
const axios = require('axios');
const qs = require('qs');

class ZohoService {
    constructor() {
        this.clientId = process.env.ZOHO_CLIENT_ID;
        this.clientSecret = process.env.ZOHO_CLIENT_SECRET;
        this.refreshToken = process.env.ZOHO_REFRESH_TOKEN;
        this.accessToken = process.env.ZOHO_ACCESS_TOKEN;
        this.redirectUri = process.env.ZOHO_REDIRECT_URI;

        // IMPORTANT: Use .com because your app is on US servers
        this.apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
        this.authDomain = 'https://accounts.zoho.com';
        this.crmVersion = process.env.ZOHO_CRM_VERSION || 'v2';
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            console.log('🔄 Refreshing Zoho token...');

            const response = await axios.post(`${this.authDomain}/oauth/v2/token`,
                qs.stringify({
                    refresh_token: this.refreshToken,
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'refresh_token',
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            console.log('✅ Zoho token refreshed successfully');
            return this.accessToken;

        } catch (error) {
            console.error('❌ Token refresh failed:', error.response?.data || error.message);
            throw new Error('Failed to refresh Zoho token');
        }
    }

    async makeRequest(method, endpoint, data = null) {
        const token = await this.getAccessToken();
        const url = `${this.apiDomain}/crm/${this.crmVersion}/${endpoint}`;

        try {
            const response = await axios({
                method,
                url,
                data,
                headers: {
                    'Authorization': `Zoho-oauthtoken ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        } catch (error) {
            console.error(`Zoho API error:`, error.response?.data || error.message);
            throw error;
        }
    }

    async syncOrderToZoho(orderData) {
        try {
            console.log('📦 Syncing order to Zoho CRM:', orderData.orderNumber);

            // Create Contact
            const contactData = {
                data: [{
                    Last_Name: orderData.name.split(' ').pop() || 'Customer',
                    First_Name: orderData.name.split(' ')[0] || orderData.name,
                    Phone: orderData.phone,
                    Email: orderData.email || '',
                    Mailing_Street: orderData.address,
                    Description: `Source: ${orderData.source}\nOrder: ${orderData.orderNumber}`
                }]
            };

            const contactResponse = await this.makeRequest('POST', 'Contacts', contactData);
            const contactId = contactResponse.data[0].details.id;
            console.log(`✅ Contact created: ${contactId}`);

            // Create Deal
            const dealData = {
                data: [{
                    Deal_Name: `${orderData.source} - ${orderData.orderNumber}`,
                    Stage: 'Qualification',
                    Contact_Person: { id: contactId },
                    Amount: orderData.orderTotal || 0,
                    Closing_Date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    Description: `
Order Details:
━━━━━━━━━━━━━━━━━━━━━━
Order Number: ${orderData.orderNumber}
Customer Name: ${orderData.name}
Phone: ${orderData.phone}
Email: ${orderData.email || 'N/A'}
Address: ${orderData.address}
Source: ${orderData.source}
Total Amount: AED ${orderData.orderTotal || 0}
Items Count: ${orderData.itemsCount || 0}
Notes: ${orderData.notes || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━
                    `
                }]
            };

            const dealResponse = await this.makeRequest('POST', 'Deals', dealData);
            const dealId = dealResponse.data[0].details.id;
            console.log(`✅ Deal created: ${dealId}`);

            return {
                success: true,
                contactId: contactId,
                dealId: dealId,
                message: 'Order synced to Zoho CRM successfully'
            };

        } catch (error) {
            console.error('❌ Zoho sync failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new ZohoService();