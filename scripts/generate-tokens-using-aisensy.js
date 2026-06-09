// get-final-tokens.js
const axios = require('axios');
const qs = require('qs');

// YOUR CREDENTIALS
const clientId = '1000.6D30FF7XM2DGAICDJTMMWPXBQJROFX';
const clientSecret = '4b37b575fe9347304ddee6fce0f549ba41b31c7505';
const redirectUri = 'https://laundrica-backend-5mmf.onrender.com/callback';

// THE NEW CODE FROM YOUR URL - UPDATE THIS NOW
const authCode = '1000.58a389ff8de6cce2dd5959149bcd2853.3244d6fcf51faefd26ab3f14493b205c';

console.log('🚀 Getting Zoho tokens...\n');
console.log('Client ID:', clientId);
console.log('Code:', authCode.substring(0, 50) + '...\n');

async function getTokens() {
    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token',
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

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                    ✅ SUCCESS!                             ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        console.log('📋 COPY THESE TO YOUR RENDER ENVIRONMENT VARIABLES:\n');
        console.log('─────────────────────────────────────────────────────────────');
        console.log(`ZOHO_CLIENT_ID=${clientId}`);
        console.log(`ZOHO_CLIENT_SECRET=${clientSecret}`);
        console.log(`ZOHO_REFRESH_TOKEN=${response.data.refresh_token}`);
        console.log(`ZOHO_ACCESS_TOKEN=${response.data.access_token}`);
        console.log(`ZOHO_REDIRECT_URI=${redirectUri}`);
        console.log(`ZOHO_API_DOMAIN=https://www.zohoapis.com`);
        console.log(`ZOHO_CRM_VERSION=v2`);
        console.log('─────────────────────────────────────────────────────────────\n');

        console.log('✅ Done! Add these to your Render dashboard now.\n');

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);

        if (error.response?.data?.error === 'invalid_code') {
            console.error('\n⚠️ Code expired! Get a new code by opening:');
            console.log(`https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(redirectUri)}`);
            console.log('\nThen update the authCode variable and run again.\n');
        }
    }
}

getTokens();