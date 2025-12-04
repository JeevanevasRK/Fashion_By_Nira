const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. LOGIN ROUTE (With Debugging)
router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;

    console.log(`[LOGIN ATTEMPT] Phone: ${phoneNumber}, Pass: ${password}`);

    try {
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            console.log("[LOGIN FAILED] User not found in DB");
            return res.status(400).json({ error: "User not found" });
        }

        console.log(`[LOGIN FOUND] DB User: ${user.phoneNumber}, DB Pass: ${user.password}, Role: ${user.role}`);

        // Direct String Comparison
        if (user.password !== password) {
            console.log("[LOGIN FAILED] Password mismatch");
            return res.status(400).json({ error: "Invalid Credentials" });
        }

        if (user.role !== 'admin') {
            console.log("[LOGIN FAILED] Not an admin");
            return res.status(403).json({ error: "Access Denied: Not an Admin" });
        }

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

// 3. EMERGENCY RESET TO 123456 (Browser Route)
router.get('/create-admin', async (req, res) => {
    try {
        const phone = "9876543210";
        const pass = "123456"; // SIMPLE PASSWORD

        let user = await User.findOne({ phoneNumber: phone });

        if (user) {
            user.password = pass;
            user.role = 'admin';
            await user.save();
            return res.send(`<h1>UPDATED!</h1> <p>Admin Reset Successful.</p> <p>Phone: <b>${phone}</b></p> <p>Password: <b>${pass}</b></p>`);
        }

        user = new User({ phoneNumber: phone, password: pass, role: "admin" });
        await user.save();
        res.send(`<h1>CREATED!</h1> <p>New Admin Created.</p> <p>Phone: <b>${phone}</b></p> <p>Password: <b>${pass}</b></p>`);
    } catch (err) {
        res.send("Error: " + err.message);
    }
});

module.exports = router;