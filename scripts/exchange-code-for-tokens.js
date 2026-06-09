// scripts/exchange-code-for-tokens.js
const axios = require('axios');
const qs = require('qs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function exchangeCodeForTokens() {
    const clientId = '1000.0CFJZ6CRYM7GX8Q9AIIR0TFERGLHNL';
    const clientSecret = '1b2a6902714fb37967a17f9202de66f3cff5bc017d';
    const redirectUri = 'https://backend.aisensy.com/apps/zoho/v1/callback';

    rl.question('\n📝 Paste the authorization code from the URL: ', async (authCode) => {
        console.log('\n🔄 Exchanging code for tokens...\n');

        try {
            const response = await axios.post('https://accounts.zoho.in/oauth/v2/token',
                qs.stringify({
                    code: authCode.trim(),
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

            console.log('\n✅ SUCCESS! Copy these to your Render environment variables:\n');
            console.log('═══════════════════════════════════════════════════════════');
            console.log(`ZOHO_CLIENT_ID=${clientId}`);
            console.log(`ZOHO_CLIENT_SECRET=${clientSecret}`);
            console.log(`ZOHO_REFRESH_TOKEN=${response.data.refresh_token}`);
            console.log(`ZOHO_ACCESS_TOKEN=${response.data.access_token}`);
            console.log(`ZOHO_REDIRECT_URI=${redirectUri}`);
            console.log(`ZOHO_API_DOMAIN=https://www.zohoapis.in`);
            console.log(`ZOHO_CRM_VERSION=v2`);
            console.log('═══════════════════════════════════════════════════════════\n');

            console.log('💡 These tokens will work on your Render backend!\n');

            rl.close();
        } catch (error) {
            console.error('\n❌ Error:', error.response?.data || error.message);

            if (error.response?.data?.error === 'invalid_code') {
                console.error('\n🔧 The code expired or was already used.');
                console.error('   Get a new code by running: node scripts/get-zoho-auth.js\n');
            }
            rl.close();
        }
    });
}

exchangeCodeForTokens();