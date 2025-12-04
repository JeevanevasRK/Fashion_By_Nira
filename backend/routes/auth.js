const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify if requester is an Admin (for creating new users)
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

// 2. FORGOT PASSWORD: SEND OTP (Admin Only Security Check)
router.post('/forgot-otp', async (req, res) => {
    const { phoneNumber } = req.body;
    try {
        const user = await User.findOne({ phoneNumber });

        // SECURITY CHECK: If user exists but is NOT admin, block them.
        if (user && user.role !== 'admin') {
            return res.status(403).json({ error: "NOT_AUTHORIZED" }); // Special code for frontend
        }

        if (!user) return res.status(400).json({ error: "User not found" });

        // Generate OTP
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
        user.otp = null; // Clear OTP
        await user.save();

        res.json({ message: "Password Reset Successful" });
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

// 4. CREATE NEW ADMIN (Protected Route - Only logged in Admins can do this)
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

module.exports = router;