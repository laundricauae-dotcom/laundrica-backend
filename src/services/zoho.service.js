const axios = require('axios');
const qs = require('qs');

class ZohoService {
    constructor() {
        this.clientId = process.env.ZOHO_CLIENT_ID;
        this.clientSecret = process.env.ZOHO_CLIENT_SECRET;
        this.refreshToken = process.env.ZOHO_REFRESH_TOKEN;
        this.accessToken = process.env.ZOHO_ACCESS_TOKEN;
        this.apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
        this.crmVersion = process.env.ZOHO_CRM_VERSION || 'v2';
        this.tokenExpiry = null;
    }

    /**
     * Get valid access token (auto-refresh if expired)
     */
    async getAccessToken() {
        // Check if token is still valid (with 5 min buffer)
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
            return this.accessToken;
        }

        // Refresh token
        try {
            const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', qs.stringify({
                refresh_token: this.refreshToken,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'refresh_token',
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            this.accessToken = response.data.access_token;
            // Tokens typically expire in 3600 seconds (1 hour)
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

            console.log('✅ Zoho token refreshed successfully');
            return this.accessToken;
        } catch (error) {
            console.error('❌ Zoho token refresh failed:', error.response?.data || error.message);
            throw new Error('Failed to refresh Zoho token');
        }
    }

    /**
     * Make API request to Zoho CRM
     */
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
            console.error(`Zoho API error (${method} ${endpoint}):`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Create or Find Contact in Zoho CRM
     * Using upsert to avoid duplicates based on phone number [citation:6]
     */
    async upsertContact(customerInfo) {
        try {
            // First, try to find existing contact by phone
            const searchResult = await this.makeRequest(
                'GET',
                `Contacts/search?phone=${encodeURIComponent(customerInfo.phone)}`
            );

            let contactId = null;

            if (searchResult.data && searchResult.data.length > 0) {
                // Contact exists
                contactId = searchResult.data[0].id;
                console.log(`📞 Existing contact found: ${contactId}`);

                // Update contact with latest info
                await this.makeRequest('PUT', `Contacts/${contactId}`, {
                    data: [
                        {
                            Last_Name: customerInfo.name.split(' ').pop() || 'Customer',
                            First_Name: customerInfo.name.split(' ')[0] || customerInfo.name,
                            Phone: customerInfo.phone,
                            Email: customerInfo.email || '',
                            Description: customerInfo.address,
                        },
                    ],
                });
                console.log(`✅ Contact updated: ${contactId}`);
            } else {
                // Create new contact
                const createResult = await this.makeRequest('POST', 'Contacts', {
                    data: [
                        {
                            Last_Name: customerInfo.name.split(' ').pop() || 'Customer',
                            First_Name: customerInfo.name.split(' ')[0] || customerInfo.name,
                            Phone: customerInfo.phone,
                            Email: customerInfo.email || '',
                            Description: customerInfo.address,
                            Mailing_Street: customerInfo.address,
                            Mailing_City: customerInfo.city || 'Dubai',
                        },
                    ],
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

    /**
     * Create Deal (Order) in Zoho CRM
     * Required fields: Deal_Name, Stage, Pipeline [citation:1]
     */
    async createDeal(order, contactId) {
        try {
            // Prepare line items from order items
            const lineItems = order.items.map(item => ({
                product: { name: item.name },
                quantity: item.quantity,
                list_price: item.price,
                total: item.price * item.quantity,
                description: item.serviceItems?.map(si => si.name).join(', ') || '',
            }));

            const dealData = {
                data: [
                    {
                        Deal_Name: `Laundrica Order - ${order.orderNumber}`,
                        Stage: 'Qualification', // Initial stage
                        Pipeline: 'Laundrica Orders',
                        Amount: order.total,
                        Closing_Date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
                        Description: this.generateOrderDescription(order),
                        Contact_Person: contactId ? { id: contactId } : null,
                        // Custom fields for order tracking
                        $laundrica_order_number: order.orderNumber,
                        $laundrica_status: order.status,
                        $laundrica_item_count: order.items.length,
                        $laundrica_created_at: order.createdAt,
                    },
                ],
            };

            // Add line items if the module supports them
            if (lineItems.length > 0) {
                dealData.data[0].Line_Items = lineItems;
            }

            const result = await this.makeRequest('POST', 'Deals', dealData);

            if (result.data && result.data[0]) {
                console.log(`✅ Deal created in Zoho: ${result.data[0].details.id}`);
                return result.data[0].details.id;
            }

            return null;
        } catch (error) {
            console.error('❌ Deal creation failed:', error.message);
            return null;
        }
    }

    /**
     * Generate order description for CRM
     */
    generateOrderDescription(order) {
        const itemsList = order.items.map(item =>
            `• ${item.name} x${item.quantity} = AED ${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');

        return `Order #: ${order.orderNumber}
Items:
${itemsList}

Subtotal: AED ${order.subtotal.toFixed(2)}
Delivery: AED ${order.deliveryFee.toFixed(2)}
Tax: AED ${order.tax.toFixed(2)}
Total: AED ${order.total.toFixed(2)}

Customer Notes: ${order.customerInfo.notes || 'N/A'}`;
    }

    /**
     * Update Deal status in Zoho CRM
     */
    async updateDealStatus(orderNumber, status, dealId) {
        try {
            if (!dealId) return false;

            // Map internal status to Zoho stages
            const stageMap = {
                'pending': 'Qualification',
                'processing': 'Needs Analysis',
                'completed': 'Closed Won',
                'cancelled': 'Closed Lost',
            };

            const stage = stageMap[status] || 'Qualification';

            await this.makeRequest('PUT', `Deals/${dealId}`, {
                data: [
                    {
                        Stage: stage,
                        Description: `Order status updated to: ${status}\n${new Date().toLocaleString()}`,
                    },
                ],
            });

            console.log(`✅ Deal status updated: ${orderNumber} -> ${status}`);
            return true;
        } catch (error) {
            console.error('❌ Deal status update failed:', error.message);
            return false;
        }
    }

    /**
     * Sync complete order to Zoho CRM
     * Main method to call from order controller
     */
    async syncOrderToZoho(order) {
        try {
            console.log(`🔄 Syncing order ${order.orderNumber} to Zoho CRM...`);

            // Step 1: Create/Update Contact
            const contactId = await this.upsertContact(order.customerInfo);

            // Step 2: Create Deal
            const dealId = await this.createDeal(order, contactId);

            if (dealId) {
                // Store Zoho deal ID in order for future updates
                order.zohoDealId = dealId;
                await order.save();
            }

            console.log(`✅ Order ${order.orderNumber} synced to Zoho CRM successfully`);
            return { success: true, contactId, dealId };
        } catch (error) {
            console.error(`❌ Failed to sync order ${order.orderNumber} to Zoho:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ZohoService();