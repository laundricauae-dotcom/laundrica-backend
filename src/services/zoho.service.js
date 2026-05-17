const axios = require('axios');
const qs = require('qs');

class ZohoService {
    constructor() {
        this.clientId = process.env.ZOHO_CLIENT_ID;
        this.clientSecret = process.env.ZOHO_CLIENT_SECRET;
        this.refreshToken = process.env.ZOHO_REFRESH_TOKEN;
        this.accessToken = process.env.ZOHO_ACCESS_TOKEN;
        this.apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';
        this.crmVersion = process.env.ZOHO_CRM_VERSION || 'v2';
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
            return this.accessToken;
        }

        try {
            const response = await axios.post('https://accounts.zoho.in/oauth/v2/token',
                qs.stringify({
                    refresh_token: this.refreshToken,
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'refresh_token',
                }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            console.log('✅ Zoho token refreshed');
            return this.accessToken;
        } catch (error) {
            console.error('❌ Zoho token refresh failed:', error.response?.data || error.message);
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

    async upsertContact(customerInfo) {
        try {
            const searchResult = await this.makeRequest(
                'GET',
                `Contacts/search?phone=${encodeURIComponent(customerInfo.phone)}`
            );

            let contactId = null;

            if (searchResult.data && searchResult.data.length > 0) {
                contactId = searchResult.data[0].id;
                await this.makeRequest('PUT', `Contacts/${contactId}`, {
                    data: [{
                        Last_Name: customerInfo.name.split(' ').pop() || 'Customer',
                        First_Name: customerInfo.name.split(' ')[0] || customerInfo.name,
                        Phone: customerInfo.phone,
                        Email: customerInfo.email || '',
                        Description: customerInfo.address,
                        Mailing_Street: customerInfo.address,
                        Mailing_City: customerInfo.city || 'Dubai',
                    }],
                });
                console.log(`✅ Contact updated: ${contactId}`);
            } else {
                const createResult = await this.makeRequest('POST', 'Contacts', {
                    data: [{
                        Last_Name: customerInfo.name.split(' ').pop() || 'Customer',
                        First_Name: customerInfo.name.split(' ')[0] || customerInfo.name,
                        Phone: customerInfo.phone,
                        Email: customerInfo.email || '',
                        Description: customerInfo.address,
                        Mailing_Street: customerInfo.address,
                        Mailing_City: customerInfo.city || 'Dubai',
                    }],
                });
                if (createResult.data && createResult.data[0]) {
                    contactId = createResult.data[0].details.id;
                    console.log(`✅ New contact created: ${contactId}`);
                }
            }
            return contactId;
        } catch (error) {
            console.error('❌ Contact upsert failed:', error.message);
            return null;
        }
    }

    async createDeal(order, contactId) {
        try {

            const itemsText = order.items.map(item =>
                `• ${item.name} x${item.quantity} = AED ${(item.price * item.quantity).toFixed(2)}`
            ).join('\n');

            const dealData = {
                data: [{
                    Deal_Name: `Laundrica Order - ${order.orderNumber}`,

                    Stage: 'Qualification',

                    Amount: order.total,

                    Closing_Date: new Date(
                        Date.now() + 7 * 24 * 60 * 60 * 1000
                    ).toISOString().split('T')[0],

                    Contact_Person: contactId
                        ? { id: contactId }
                        : null,

                    // CUSTOMER DETAILS

                    Customer_Phone:
                        order.customerInfo.phone || '',

                    Customer_Email:
                        order.customerInfo.email || '',

                    Customer_Address:
                        order.customerInfo.address || '',

                    Customer_City:
                        order.customerInfo.city || '',

                    Customer_Notes:
                        order.customerInfo.notes || '',

                    // TOGGLE VALUES

                    Carpet_Contact_Enabled:
                        order.customerInfo.crmPreferences?.carpetContactEnabled || false,

                    Shoes_Contact_Enabled:
                        order.customerInfo.crmPreferences?.shoesContactEnabled || false,

                    // ORDER DETAILS

                    Order_Number:
                        order.orderNumber,

                    Order_Items:
                        itemsText,

                    Description: `
Order Number: ${order.orderNumber}

Customer Name:
${order.customerInfo.name}

Phone:
${order.customerInfo.phone}

Email:
${order.customerInfo.email}

Address:
${order.customerInfo.address}

City:
${order.customerInfo.city}

Carpet Contact Enabled:
${order.customerInfo.crmPreferences?.carpetContactEnabled ? 'YES' : 'NO'}

Shoes Contact Enabled:
${order.customerInfo.crmPreferences?.shoesContactEnabled ? 'YES' : 'NO'}

Items:
${itemsText}

Total:
AED ${order.total}

Notes:
${order.customerInfo.notes || 'N/A'}
                `,
                }],
            };

            const result = await this.makeRequest(
                'POST',
                'Deals',
                dealData
            );

            if (result.data && result.data[0]) {
                console.log(
                    `✅ Deal created: ${result.data[0].details.id}`
                );

                return result.data[0].details.id;
            }

            return null;

        } catch (error) {

            console.error(
                '❌ Deal creation failed:',
                error.response?.data || error.message
            );

            return null;
        }
    }

    generateOrderDescription(order) {
        const itemsList = order.items.map(item =>
            `• ${item.name} x${item.quantity} = AED ${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');
        return `Order #: ${order.orderNumber}\nItems:\n${itemsList}\n\nSubtotal: AED ${order.subtotal.toFixed(2)}\nDelivery: AED ${order.deliveryFee.toFixed(2)}\nTax: AED ${order.tax.toFixed(2)}\nTotal: AED ${order.total.toFixed(2)}\n\nCustomer Notes: ${order.customerInfo.notes || 'N/A'}`;
    }

    async updateDealStatus(orderNumber, status, dealId) {
        try {
            if (!dealId) return false;
            const stageMap = {
                'pending': 'Qualification',
                'processing': 'Needs Analysis',
                'completed': 'Closed Won',
                'cancelled': 'Closed Lost',
            };
            const stage = stageMap[status] || 'Qualification';
            await this.makeRequest('PUT', `Deals/${dealId}`, {
                data: [{ Stage: stage }],
            });
            console.log(`✅ Deal status updated: ${orderNumber} -> ${status}`);
            return true;
        } catch (error) {
            console.error('❌ Deal status update failed:', error.message);
            return false;
        }
    }

    async syncOrderToZoho(order) {
        try {
            console.log(`🔄 Syncing order ${order.orderNumber} to Zoho CRM...`);
            const contactId = await this.upsertContact(order.customerInfo);
            const dealId = await this.createDeal(order, contactId);
            if (dealId) {
                order.zohoDealId = dealId;
                await order.save();
            }
            console.log(`✅ Order ${order.orderNumber} synced to Zoho`);
            return { success: true, contactId, dealId };
        } catch (error) {
            console.error(`❌ Failed to sync order ${order.orderNumber} to Zoho:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ZohoService();