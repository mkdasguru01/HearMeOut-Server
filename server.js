// server.js - The Brain of HearMeOut

const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update } = require('firebase/database');
const twilio = require('twilio'); // <--- This is now active!

const app = express();
app.use(cors());
app.use(express.json());

// 1. FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBxfz54velghE_G9OSLnIuEqxzx3-7L2a0",
  authDomain: "hearmeout-8595b.firebaseapp.com",
  databaseURL: "https://hearmeout-8595b-default-rtdb.firebaseio.com",
  projectId: "hearmeout-8595b",
  storageBucket: "hearmeout-8595b.firebasestorage.app",
  messagingSenderId: "820646656093",
  appId: "1:820646656093:web:c68b24bc29dbedb257f5b4",
  measurementId: "G-CRB8XBK09X"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// 2. YOUR TWILIO CONFIG (PASTE YOUR KEYS INSIDE THE QUOTES BELOW)
const TWILIO_SID = "AC268276109bba3bf9c158508e9848cb6f";     // <--- Paste Account SID here (Keep the quotes!)
const TWILIO_TOKEN = "6233016e6dd63d68f4019df74d6273bd";     // <--- Paste Auth Token here
const TWILIO_PHONE = "+19787055809";   // <--- Paste Twilio Number here

const client = new twilio(TWILIO_SID, TWILIO_TOKEN);

// Route: Connect Call
app.post('/connect-call', async (req, res) => {
    const { userId, userPhoneNumber } = req.body; 
    // Note: In a real app, userPhoneNumber comes from the database, not the frontend request for security.
    
    console.log(`📞 New Call Request from: ${userId}`);

    try {
        // A. Check Wallet
        const walletRef = ref(db, 'users/' + userId + '/wallet');
        const snapshot = await get(walletRef);
        const balance = snapshot.val();

        if (balance < 4) {
            return res.json({ success: false, message: "Low Balance" });
        }

        // B. Connect the Call via Twilio
        // IMPORTANT: On a Free Trial, you can ONLY call your own verified number.
        // For this demo, we will call YOU (the admin) as the "Listener".
        
        const call = await client.calls.create({
            url: 'https://handler.twilio.com/twiml/EH2c099532fa0c1154f7983dbaca746520', // This plays a demo voice message
            to: userPhoneNumber, // The number to call (User)
            from: TWILIO_PHONE   // Your Twilio number
        });

        console.log("✅ Call started! SID:", call.sid);

        return res.json({ 
            success: true, 
            message: "Calling you now..." 
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(3000, () => {
    console.log("🚀 HearMeOut Server is running on http://localhost:3000");
});
