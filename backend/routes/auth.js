const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// MIDDLEWARE
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Access Denied" });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified.role !== 'admin') return res.status(403).json({ error: "Not Authorized" });
        next();
    } catch (err) { res.status(400).json({ error: "Invalid Token" }); }
};

// 1. LOGIN (Standard Secure Login)
router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;
    try {
        // Check Database
        const user = await User.findOne({ phoneNumber });
        if (!user) return res.status(400).json({ error: "User not found" });

        // Validate Password
        if (user.password !== password) return res.status(400).json({ error: "Invalid Credentials" });

        // Validate Role
        if (user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });

        // Issue Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "Login Successful", token, user: { role: user.role } });
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

// 2. GET ALL ADMINS
router.get('/admins', verifyToken, async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' });
        res.json(admins);
    } catch (err) { res.status(500).json({ error: "Error fetching admins" }); }
});

// 3. CREATE ADMIN
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

// 4. EDIT ADMIN
router.put('/admins/:id', verifyToken, async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;
        const updateData = { phoneNumber };
        if (password && password.trim() !== "") updateData.password = password;

        await User.findByIdAndUpdate(req.params.id, updateData);
        res.json({ message: "Admin Updated" });
    } catch (err) { res.status(500).json({ error: "Error updating" }); }
});

// 5. DELETE ADMIN
router.delete('/admins/:id', verifyToken, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Admin Deleted" });
    } catch (err) { res.status(500).json({ error: "Error deleting" }); }
});

module.exports = router;