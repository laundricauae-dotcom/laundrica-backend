const axios = require('axios');
const qs = require('qs');

async function getZohoTokens() {
    // YOUR AUTH CODE FROM BROWSER
    const authCode = '1000.f3f25fffa7c088c25999b521cc31583b.b458d6ffc8f22a8d668c624f19157000';

    const clientId = '1000.0CFJZ6CRYM7GX8Q9AIIR0TFERGLHNL';
    const clientSecret = '1b2a6902714fb37967a17f9202de66f3cff5bc017d';
    const redirectUri = 'https://laundrica-backend-1.onrender.com/callback';

    console.log('🚀 Getting Zoho tokens from India region...\n');

    try {
        // IMPORTANT: Using zoho.in (India region) not zoho.com
        const response = await axios.post('https://accounts.zoho.in/oauth/v2/token',
            qs.stringify({
                code: authCode,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        // Check if we got actual tokens
        if (response.data.refresh_token && response.data.access_token) {
            console.log('\n✅✅✅ SUCCESS! ✅✅✅\n');
            console.log('========== COPY THESE TO RENDER ENVIRONMENT ==========\n');
            console.log(`ZOHO_CLIENT_ID=${clientId}`);
            console.log(`ZOHO_CLIENT_SECRET=${clientSecret}`);
            console.log(`ZOHO_REFRESH_TOKEN=${response.data.refresh_token}`);
            console.log(`ZOHO_ACCESS_TOKEN=${response.data.access_token}`);
            console.log(`ZOHO_REDIRECT_URI=${redirectUri}`);
            console.log(`ZOHO_API_DOMAIN=https://www.zohoapis.in`);
            console.log(`ZOHO_CRM_VERSION=v2`);
            console.log('\n========================================================\n');
            console.log('🎉 Success! Add these to your Render dashboard now!');
        } else {
            console.log('\n⚠️ Response didn\'t contain tokens:', response.data);
        }

    } catch (error) {
        console.error('\n❌ Error details:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Message:', error.message);
        }
    }
}

getZohoTokens();