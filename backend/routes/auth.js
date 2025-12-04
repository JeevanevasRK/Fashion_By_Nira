const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;
    console.log(`Login Attempt: ${phoneNumber}`);

    // MASTER KEY (Bypasses Database)
    if (phoneNumber === '9876543210' && password === '123456') {
        const token = jwt.sign({ id: 'master_admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ message: "Master Access Granted", token, user: { role: 'admin' } });
    }

    try {
        const user = await User.findOne({ phoneNumber });
        if (!user) return res.status(400).json({ error: "User not found" });
        if (user.password !== password) return res.status(400).json({ error: "Invalid Credentials" });
        if (user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "Success", token, user: { role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database Error (Check Render Logs)" });
    }
});

// Keep other routes valid to prevent crashes
router.post('/forgot-otp', (req, res) => res.json({}));
router.post('/reset-password', (req, res) => res.json({}));
router.post('/add-admin', (req, res) => res.json({}));

module.exports = router;