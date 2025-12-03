const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. REGISTER: REQUEST OTP
router.post('/register-otp', async (req, res) => {
    const { phoneNumber } = req.body;
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) return res.status(400).json({ error: "User already exists. Please Login." });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    let user = new User({ phoneNumber, otp });
    await user.save();

    console.log(`XXX-- - REGISTER OTP for ${phoneNumber} is: ${otp} --- XXX`);
    res.json({ message: "OTP sent for registration" });
});

// 2. REGISTER: COMPLETE
router.post('/register-complete', async (req, res) => {
    const { phoneNumber, otp, password } = req.body;
    const user = await User.findOne({ phoneNumber });
    if (!user || user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

    user.password = password;
    user.otp = null;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: "Registration Successful", token, user: { role: user.role } });
});

// 3. LOGIN
router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;
    const user = await User.findOne({ phoneNumber });
    if (!user) return res.status(400).json({ error: "User not found" });
    if (user.password !== password) return res.status(400).json({ error: "Invalid Credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: "Login Successful", token, user: { role: user.role } });
});

// --- NEW: FORGOT PASSWORD ROUTES ---

// 4. FORGOT PASSWORD: SEND OTP
router.post('/forgot-otp', async (req, res) => {
    const { phoneNumber } = req.body;

    // Check if user exists (You can't reset password for a ghost!)
    const user = await User.findOne({ phoneNumber });
    if (!user) return res.status(400).json({ error: "User not found. Please Register first." });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = otp;
    await user.save();

    console.log(`XXX-- - RESET PASSWORD OTP for ${phoneNumber} is: ${otp} --- XXX`);
    res.json({ message: "OTP sent to your phone." });
});

// 5. RESET PASSWORD: VERIFY & UPDATE
router.post('/reset-password', async (req, res) => {
    const { phoneNumber, otp, newPassword } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user || user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

    user.password = newPassword; // Update password
    user.otp = null; // Clear OTP
    await user.save();

    res.json({ message: "Password Reset Successful! Please Login." });
});

module.exports = router;