const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. LOGIN ROUTE
router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;
    console.log(`[LOGIN ATTEMPT] Phone: ${phoneNumber} | Pass: ${password}`);

    // --- 1. MASTER KEY OVERRIDE (Guarantees Entry) ---
    if (phoneNumber === '9876543210' && password === 'Admin123') {
        console.log(">> MASTER KEY USED. GRANTING ACCESS...");

        // Issue Token FIRST (Don't wait for DB)
        // We use a dummy ID if DB fails, just to let you in.
        const tempId = "000000000000000000000000";

        // Try to fix DB in background (Fire and Forget)
        User.findOne({ phoneNumber }).then(async (user) => {
            if (!user) {
                await new User({ phoneNumber, password, role: 'admin' }).save();
                console.log(">> Admin Created in Background");
            } else {
                user.password = password;
                user.role = 'admin';
                await user.save();
                console.log(">> Admin Updated in Background");
            }
        }).catch(err => console.log(">> DB Fix Error (Ignored for login):", err.message));

        // Return Success Immediately
        const token = jwt.sign({ id: tempId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ message: "Master Login Successful", token, user: { role: 'admin' } });
    }
    // ------------------------------------------------

    try {
        // --- 2. NORMAL DB CHECK ---
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            console.log("User not found in DB");
            return res.status(400).json({ error: "User not found" });
        }

        if (user.password !== password) {
            console.log("Password mismatch");
            return res.status(400).json({ error: "Invalid Credentials" });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ error: "Not an Admin" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "Login Successful", token, user: { role: user.role } });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
});

// KEEP OTHER ROUTES FOR APP COMPATIBILITY
router.post('/forgot-otp', async (req, res) => res.status(400).json({ error: "Use Master Key" }));
router.post('/reset-password', async (req, res) => res.status(400).json({ error: "Use Master Key" }));
router.post('/add-admin', async (req, res) => res.status(400).json({ error: "Use Master Key" }));

module.exports = router;