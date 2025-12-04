const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;
    console.log(`[Login Attempt] Phone: ${phoneNumber} | Password: ${password}`);

    // ======================================================
    // 1. MASTER KEY (Bypasses Database Completely)
    // ======================================================
    if (phoneNumber === '9876543210' && password === '123456') {
        console.log(">> MASTER KEY USED. ACCESS GRANTED.");

        // Create a valid token manually
        const token = jwt.sign(
            { id: 'master_admin_id', role: 'admin' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        // Send Success Response immediately
        return res.json({
            message: "Master Access Granted",
            token,
            user: { role: 'admin' }
        });
    }
    // ======================================================

    try {
        // Normal Database Check (Only runs if not using Master Key)
        const user = await User.findOne({ phoneNumber });
        if (!user) return res.status(400).json({ error: "User not found" });
        if (user.password !== password) return res.status(400).json({ error: "Invalid Credentials" });
        if (user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "Login Successful", token, user: { role: user.role } });

    } catch (err) {
        console.error("DB Error:", err.message);
        res.status(500).json({ error: "Database Error. Use Master Key (9876543210 / 123456) to login." });
    }
});

// Prevent crashes on other routes
router.post('/forgot-otp', (req, res) => res.json({ message: "Use Master Key" }));
router.post('/reset-password', (req, res) => res.json({ message: "Use Master Key" }));
router.post('/add-admin', (req, res) => res.json({ message: "Use Master Key" }));

module.exports = router;