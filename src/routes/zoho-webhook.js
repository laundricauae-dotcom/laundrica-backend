// routes/zoho-webhook.js

const express = require("express");
const router = express.Router();

router.post("/send", async (req, res) => {
    try {
        console.log("Sending to Zoho:", req.body);

        const response = await fetch(
            "https://flow.zoho.com/925120593/flow/webhook/incoming?zapikey=YOUR_KEY&isdebug=false",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(req.body),
            }
        );

        const result = await response.text();

        console.log("Zoho Response:", result);

        return res.json({
            success: true,
            zohoResponse: result,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

module.exports = router;