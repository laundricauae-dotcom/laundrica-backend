// scripts/get-zoho-auth.js
const clientId = '1000.0CFJZ6CRYM7GX8Q9AIIR0TFERGLHNL';
const redirectUri = 'https://backend.aisensy.com/apps/zoho/v1/callback';

const authUrl = `https://accounts.zoho.in/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(redirectUri)}`;

console.log('\n🔑 STEP 1: Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n📝 STEP 2: Login to Zoho and authorize the application');
console.log('📝 STEP 3: After redirect, copy the "code=" parameter from the URL');
console.log('📝 STEP 4: It will look like: 1000.abc123def456...\n');