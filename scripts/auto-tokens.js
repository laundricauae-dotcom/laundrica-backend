// simple-tokens.js
const axios = require('axios');
const qs = require('qs');
const http = require('http');
const url = require('url');

const clientId = '1000.6D30FF7XM2DGAICDJTMMWPXBQJROFX';
const clientSecret = '4b37b575fe9347304ddee6fce0f549ba41b31c7505';
const redirectUri = 'http://localhost:3000/callback';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║     ZOHO TOKEN GENERATOR - AUTO MODE                      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Create server to catch the callback
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/callback' && parsedUrl.query.code) {
        const authCode = parsedUrl.query.code;

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>Zoho Auth Success</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1 style="color: green;">✅ Authorization Successful!</h1>
                <p>You can close this window now.</p>
                <p>Check your terminal for the tokens.</p>
                <script>window.close();</script>
            </body>
            </html>
        `);

        console.log('✅ Authorization code received!');
        console.log('🔄 Exchanging for tokens...\n');

        try {
            const response = await axios.post('https://accounts.zoho.com/oauth/v2/token',
                qs.stringify({
                    code: authCode,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            console.log('\n╔════════════════════════════════════════════════════════════╗');
            console.log('║                    ✅ SUCCESS!                             ║');
            console.log('╚════════════════════════════════════════════════════════════╝\n');

            console.log('📋 COPY THESE TO YOUR RENDER ENVIRONMENT VARIABLES:\n');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log(`ZOHO_CLIENT_ID=${clientId}`);
            console.log(`ZOHO_CLIENT_SECRET=${clientSecret}`);
            console.log(`ZOHO_REFRESH_TOKEN=${response.data.refresh_token}`);
            console.log(`ZOHO_ACCESS_TOKEN=${response.data.access_token}`);
            console.log(`ZOHO_REDIRECT_URI=https://laundrica-backend-5mmf.onrender.com/callback`);
            console.log(`ZOHO_API_DOMAIN=https://www.zohoapis.com`);
            console.log(`ZOHO_CRM_VERSION=v2`);
            console.log('═══════════════════════════════════════════════════════════════\n');

            console.log('✅ Done! You can close this terminal now.\n');
            server.close();
            process.exit(0);

        } catch (error) {
            console.error('❌ Error getting tokens:', error.response?.data || error.message);
            server.close();
            process.exit(1);
        }
    }
});

// Start server
server.listen(3000, () => {
    console.log('🚀 Local server running on http://localhost:3000');
    console.log('\n📱 MANUAL STEP: Open this URL in your browser:\n');
    console.log(`https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(redirectUri)}`);
    console.log('\n👉 Login and authorize the app');
    console.log('👉 The script will automatically get the tokens\n');
    console.log('⏳ Waiting for authorization...\n');
});