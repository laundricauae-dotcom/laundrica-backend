const axios = require('axios');

async function testZohoOrder() {
    const sessionId = 'zoho-test-' + Date.now();

    const orderData = {
        sessionId: sessionId,
        customerInfo: {
            name: "Ahmed Al Mansoori",
            phone: "+971501234567",
            email: "ahmed@example.com",
            address: "Downtown Dubai, Burj Khalifa Area, Dubai, UAE",
            city: "Dubai",
            notes: "Test order to verify Zoho CRM sync"
        },
        items: [
            {
                name: "Wash & Press - Shirts",
                price: 25,
                quantity: 3
            },
            {
                name: "Dry Cleaning - Suit",
                price: 75,
                quantity: 1
            }
        ]
    };

    try {
        console.log('🚀 Creating test order...\n');
        const response = await axios.post('https://laundrica-backend-1.onrender.com/api/orders', orderData);

        console.log('✅ ORDER CREATED!');
        console.log('=====================================');
        console.log(`Order Number: ${response.data.order.orderNumber}`);
        console.log(`Total Amount: AED ${response.data.order.total}`);
        console.log(`Zoho Synced: ${response.data.order.zohoSynced}`);
        console.log(`Zoho Deal ID: ${response.data.zoho?.dealId || 'N/A'}`);
        console.log('=====================================\n');

        console.log('📊 Check Zoho CRM at: https://crm.zoho.in');
        console.log('Look for:');
        console.log(`- Contact: Ahmed Al Mansoori (${response.data.order.orderNumber})`);
        console.log(`- Deal: Laundrica Order - ${response.data.order.orderNumber}`);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testZohoOrder();