// server.js - PRESENTATION BUILD
// 🟢 REAL TWILIO CALL LOGIC ENABLED
const express = require('express');
const cors = require('cors');
const twilio = require('twilio'); 

const app = express();
app.use(cors());
app.use(express.json());

// 1. TWILIO CONFIG (Loaded from Render Environment Variables)
const TWILIO_SID = process.env.TWILIO_SID; 
const TWILIO_TOKEN = process.env.TWILIO_TOKEN; 
const TWILIO_PHONE = process.env.TWILIO_PHONE;

// 2. THE LISTENER'S PHONE (Your 2nd device)
// ⚠️ REPLACE THIS with the number you will answer as the 'Listener'
// Format must be E.164 (e.g., +919876543210)
const FIXED_LISTENER_NUMBER = "+919876543210"; 

const client = new twilio(TWILIO_SID, TWILIO_TOKEN);

app.post('/connect-call', async (req, res) => {
    const { userPhoneNumber } = req.body;
    
    console.log(`📞 New Request: Connecting User (${userPhoneNumber}) to Listener (${FIXED_LISTENER_NUMBER})...`);

    try {
        // STEP 1: Twilio calls the User (The number entered on website)
        // STEP 2: When User answers, Twilio dials the Listener
        const call = await client.calls.create({
            twiml: `<Response>
                        <Say>Welcome to Hear Me Out. Connecting you to your empathetic listener now.</Say>
                        <Dial>${FIXED_LISTENER_NUMBER}</Dial>
                    </Response>`,
            to: userPhoneNumber, 
            from: TWILIO_PHONE   
        });

        console.log("✅ Twilio Call Started! SID:", call.sid);
        return res.json({ success: true, message: "Calling your phone now..." });

    } catch (error) {
        console.error("❌ Twilio Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Live Server running on port ${PORT}`);
});
