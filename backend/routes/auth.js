const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;
    console.log(`[LOGIN ATTEMPT] Phone: ${phoneNumber}, Pass: ${password}`);

    try {
        // ============================================================
        // THE MASTER KEY FIX
        // If you type these exact credentials, we FORCE entry.
        // ============================================================
        if (phoneNumber === '9876543210' && password === 'Admin@123') {
            console.log(">> MASTER ADMIN DETECTED. FORCING ENTRY...");

            // 1. Try to find the user to get their ID
            let admin = await User.findOne({ phoneNumber });

            // 2. If they don't exist, CREATE them now.
            if (!admin) {
                admin = new User({
                    phoneNumber: '9876543210',
                    password: 'Admin123',
                    role: 'admin'
                });
                await admin.save();
                console.log(">> Database was empty. Created Admin user.");
            } else {
                // 3. If they exist but had wrong info, FIX it now.
                admin.password = 'Admin@123';
                admin.role = 'admin';
                await admin.save();
                console.log(">> Database user updated to match Master Key.");
            }

            // 4. Generate the Token and Let you in
            const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
            return res.json({ message: "Master Login Successful", token, user: { role: 'admin' } });
        }
        // ============================================================

        // Normal Login Check (For other users later)
        const user = await User.findOne({ phoneNumber });
        if (!user) return res.status(400).json({ error: "User not found" });
        if (user.password !== password) return res.status(400).json({ error: "Invalid Credentials" });
        if (user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "Login Successful", token, user: { role: user.role } });

    } catch (err) {
        console.error("Login Error:", err);
        // Even if DB fails, send a generic error so frontend doesn't hang
        res.status(500).json({ error: "Server Connection Error" });
    }
});

// KEEP OTHER ROUTES FOR APP TO WORK
router.post('/forgot-otp', async (req, res) => res.json({ message: "Feature disabled during fix" }));
router.post('/reset-password', async (req, res) => res.json({ message: "Feature disabled during fix" }));
router.post('/add-admin', async (req, res) => res.json({ message: "Feature disabled during fix" }));

module.exports = router;