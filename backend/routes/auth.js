const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify Admin (for internal tools)
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Access Denied" });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified.role !== 'admin') return res.status(403).json({ error: "Not Authorized" });
        next();
    } catch (err) { res.status(400).json({ error: "Invalid Token" }); }
};

// 1. LOGIN (Admin Only)
router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;
    try {
        const user = await User.findOne({ phoneNumber });

        if (!user) return res.status(400).json({ error: "User not found" });
        if (user.password !== password) return res.status(400).json({ error: "Invalid Credentials" });
        if (user.role !== 'admin') return res.status(403).json({ error: "Access Denied: Not an Admin" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "Login Successful", token, user: { role: user.role } });
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

// 2. FORGOT PASSWORD (Admin Only Check)
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

// 3. RESET PASSWORD
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

// 4. CREATE NEW ADMIN (Protected)
router.post('/add-admin', verifyToken, async (req, res) => {
    const { phoneNumber, password } = req.body;
    try {
        const existing = await User.findOne({ phoneNumber });
        if (existing) return res.status(400).json({ error: "User already exists" });

        const newAdmin = new User({ phoneNumber, password, role: 'admin' });
        await newAdmin.save();
        res.json({ message: "New Admin Created Successfully" });
    } catch (err) { res.status(500).json({ error: "Error creating admin" }); }
});

// --- 5. EMERGENCY ADMIN CREATOR (BROWSER ROUTE) ---
// This is a GET request so you can run it in Chrome/Edge directly
router.get('/create-admin', async (req, res) => {
    try {
        const phone = "9876543210";
        const pass = "Admin@123";

        const existing = await User.findOne({ phoneNumber: phone });
        if (existing) {
            existing.password = pass;
            existing.role = 'admin';
            await existing.save();
            return res.send(`<h1>UPDATED!</h1> <p>Admin Updated.</p> <p>Phone: ${phone}</p> <p>Password: ${pass}</p>`);
        }

        const newAdmin = new User({ phoneNumber: phone, password: pass, role: "admin" });
        await newAdmin.save();
        res.send(`<h1>SUCCESS!</h1> <p>Admin Created.</p> <p>Phone: ${phone}</p> <p>Password: ${pass}</p>`);
    } catch (err) {
        res.send("Error creating admin: " + err.message);
    }
});

module.exports = router;