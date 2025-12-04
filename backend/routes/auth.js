const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. SELF-HEALING LOGIN ROUTE
router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;
    console.log(`[LOGIN ATTEMPT] Phone: ${phoneNumber}, Pass: ${password}`);

    try {
        // --- THE MASTER KEY FIX ---
        // If you use these exact credentials, we FORCE the system to let you in
        // and fix the database automatically.
        if (phoneNumber === '9876543210' && password === '123456') {
            console.log(">> MASTER ADMIN DETECTED. FIXING DB...");

            let admin = await User.findOne({ phoneNumber });
            if (!admin) {
                // Create if missing
                admin = new User({ phoneNumber, password, role: 'admin' });
                await admin.save();
                console.log(">> Admin Created automatically.");
            } else {
                // Fix password/role if wrong
                admin.password = password;
                admin.role = 'admin';
                await admin.save();
                console.log(">> Admin Password/Role fixed automatically.");
            }

            // Issue Token immediately
            const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
            return res.json({ message: "Master Login Successful", token, user: { role: 'admin' } });
        }
        // ---------------------------

        // NORMAL LOGIN FLOW (For other admins you create later)
        const user = await User.findOne({ phoneNumber });
        if (!user) return res.status(400).json({ error: "User not found" });
        if (user.password !== password) return res.status(400).json({ error: "Invalid Credentials" });
        if (user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "Login Successful", token, user: { role: user.role } });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
});

// 2. FORGOT PASSWORD
router.post('/forgot-otp', async (req, res) => {
    const { phoneNumber } = req.body;
    try {
        const user = await User.findOne({ phoneNumber });
        if (user && user.role !== 'admin') return res.status(403).json({ error: "NOT_AUTHORIZED" });
        if (!user) return res.status(400).json({ error: "User not found" });

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        user.otp = otp;
        await user.save();

        console.log(`XXX --- ADMIN RESET OTP for ${phoneNumber} is: ${otp} --- XXX`);
        res.json({ message: "OTP Sent" });
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

router.post('/reset-password', async (req, res) => {
    const { phoneNumber, otp, newPassword } = req.body;
    try {
        const user = await User.findOne({ phoneNumber });
        if (!user || user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

        user.password = newPassword;
        user.otp = null;
        await user.save();

        res.json({ message: "Password Reset Successful" });
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

// 3. CREATE NEW ADMIN (Protected)
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Access Denied" });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified.role !== 'admin') return res.status(403).json({ error: "Not Authorized" });
        next();
    } catch (err) { res.status(400).json({ error: "Invalid Token" }); }
};

router.post('/add-admin', verifyToken, async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;
        const existing = await User.findOne({ phoneNumber });
        if (existing) return res.status(400).json({ error: "User exists" });
        const newAdmin = new User({ phoneNumber, password, role: 'admin' });
        await newAdmin.save();
        res.json({ message: "Admin Created" });
    } catch (err) { res.status(500).json({ error: "Error" }); }
});

module.exports = router;