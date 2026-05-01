/**
 * Zoho OAuth Token Helper
 * Run this script once to get your refresh token
 * 
 * Step 1: Go to https://api-console.zoho.com/
 * Step 2: Create Server-based Application
 * Step 3: Get Client ID and Client Secret
 * Step 4: Set Authorized Redirect URI to: https://yourdomain.com/callback
 * Step 5: Visit: https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=https://yourdomain.com/callback
 * Step 6: Copy code from redirect URL
 * Step 7: Run this script to get refresh token
 */

const axios = require('axios');
const qs = require('qs');
require('dotenv').config();

async function getTokens() {
    const code = process.env.ZOHO_AUTH_CODE; // Paste the code you got from redirect

    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', qs.stringify({
            code: code,
            client_id: process.env.ZOHO_CLIENT_ID,
            client_secret: process.env.ZOHO_CLIENT_SECRET,
            redirect_uri: process.env.ZOHO_REDIRECT_URI || 'https://yourdomain.com/callback',
            grant_type: 'authorization_code',
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        console.log('✅ Access Token:', response.data.access_token);
        console.log('✅ Refresh Token:', response.data.refresh_token);
        console.log('✅ Expires In:', response.data.expires_in, 'seconds');

        // Save these to your .env file:
        // ZOHO_ACCESS_TOKEN=your_access_token
        // ZOHO_REFRESH_TOKEN=your_refresh_token
    } catch (error) {
        console.error('❌ Error getting tokens:', error.response?.data || error.message);
    }
}

// Run if executed directly
if (require.main === module) {
    getTokens();
}

module.exports = { getTokens };