// routes/zoho.js
const express = require('express');
const router = express.Router();
const zohoService = require('../services/zoho-service');

router.post('/sync-order', async (req, res) => {
    try {
        const result = await zohoService.syncOrderToZoho(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Zoho Integration' });
});

module.exports = router;