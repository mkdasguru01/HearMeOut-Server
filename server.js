// server.js - The "Uber" Logic Brain
const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update } = require('firebase/database');
const twilio = require('twilio'); 

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
  appId: "1:820646656093:web:c68b24bc29dbedb257f5b4"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// 2. TWILIO CONFIG (Securely loaded from Render)
const TWILIO_SID = process.env.TWILIO_SID; 
const TWILIO_TOKEN = process.env.TWILIO_TOKEN; 
const TWILIO_PHONE = process.env.TWILIO_PHONE;
const client = new twilio(TWILIO_SID, TWILIO_TOKEN);

// --- THE SMART ROUTE ---
app.post('/connect-call', async (req, res) => {
    const { userId, userPhoneNumber } = req.body;
    console.log(`📞 Call Request from: ${userId} (${userPhoneNumber})`);

    try {
        // A. Check Wallet Balance
        const userWalletRef = ref(db, 'users/' + userId + '/wallet');
        const walletSnap = await get(userWalletRef);
        const balance = walletSnap.val();

        if (balance < 4) {
            return res.json({ success: false, message: "Low Balance. Please recharge." });
        }

        // B. FIND AN AVAILABLE LISTENER (The "Uber" Logic)
        const listenersRef = ref(db, 'listeners');
        const listenersSnap = await get(listenersRef);
        
        if (!listenersSnap.exists()) {
            return res.json({ success: false, message: "No listeners system found." });
        }

        const listeners = listenersSnap.val();
        let selectedListener = null;

        // Loop through all listeners to find one who is "available"
        for (const [id, data] of Object.entries(listeners)) {
            if (data.status === 'available') {
                selectedListener = { id, ...data };
                break; // Stop looking, we found one!
            }
        }

        if (!selectedListener) {
            return res.json({ success: false, message: "All listeners are currently busy. Try again in 2 mins." });
        }

        console.log(`✅ Match Found! Connecting to listener: ${selectedListener.name}`);

        // C. Connect the Call via Twilio
        // Note: In Free Trial, we can only call Verified Numbers. 
        // Ensure BOTH user and listener numbers are verified in Twilio Console.
        const call = await client.calls.create({
            twiml: `<Response>
                        <Say>Connecting you to ${selectedListener.name}, your empathetic listener.</Say>
                        <Dial>${selectedListener.phone}</Dial>
                    </Response>`,
            to: userPhoneNumber, 
            from: TWILIO_PHONE   
        });

        console.log("✅ Call Bridged! SID:", call.sid);

        // D. Mark Listener as "Busy" (Optional - prevents double booking)
        // await update(ref(db, 'listeners/' + selectedListener.id), { status: 'busy' });

        return res.json({ 
            success: true, 
            message: `Connecting you to ${selectedListener.name}...` 
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
