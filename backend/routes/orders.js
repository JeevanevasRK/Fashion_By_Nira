const router = require('express').Router();
const Order = require('../models/order'); // Fixed: Capital 'O' to match filename
const jwt = require('jsonwebtoken');
// REPLACE THESE WITH YOUR TWILIO CREDENTIALS
// --- REPLACE THE OLD TWILIO LINES WITH THIS ---
// --- LOAD KEYS FROM .ENV FILE ---
require('dotenv').config();
const accountSid = process.env.TWILIO_ACCOUNT_SID; // No "AC..." string here!
const authToken = process.env.TWILIO_AUTH_TOKEN;   // No random characters here!
const client = require('twilio')(accountSid, authToken);


// Middleware for Admin Checks
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Access Denied" });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid Token" });
    }
};

// 1. PLACE ORDER (Public)
router.post('/', async (req, res) => {
    try {
        const { products, totalAmount, shippingAddress, customerName, customerPhone } = req.body;

        const newOrder = new Order({
            products,
            totalAmount,
            shippingAddress,
            customerName,
            customerPhone,
            status: 'Pending'
        });

        // Save the order
        const savedOrder = await newOrder.save();

        // --- START WHATSAPP NOTIFICATION ---
        try {
            // Format the date and time cleanly
            const orderDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

            await client.messages.create({
                from: 'whatsapp:+14155238886', // Twilio Sandbox Number
                to: 'whatsapp:+91585026838',   // REPLACE WITH YOUR PHONE NUMBER
                body: `🔔 *New Order Received!*\n\n👤 *Customer:* ${customerName}\n📞 *Phone:* ${customerPhone}\n💰 *Amount:* ₹${totalAmount}\n📍 *Address:* ${shippingAddress}\n📅 *Date/Time:* ${orderDate}`
            });
            console.log("WhatsApp notification sent.");
        } catch (waError) {
            console.error("WhatsApp failed:", waError.message);
        }
        // --- END WHATSAPP NOTIFICATION ---

        res.json({ message: "Order placed successfully!", orderId: savedOrder._id });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Could not place order" });
    }
});

// 2. TRACK ORDER (Public - New Route)
router.post('/track', async (req, res) => {
    try {
        const { phone } = req.body;
        // Find orders matching the phone number and sort by newest first
        const orders = await Order.find({ customerPhone: phone })
            .populate('products.productId', 'title price image')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch orders" });
    }
});

// 3. GET ALL ORDERS (Admin Only) - UPDATED TO INCLUDE IMAGE
router.get('/all-orders', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
    try {
        // We added 'image' to the list of fields to fetch
        const orders = await Order.find()
            .populate('products.productId', 'title price image')
            .sort({ createdAt: -1 }); // Sort by newest first
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch orders" });
    }
});

// 4. UPDATE ORDER STATUS (Admin Only)
router.put('/:id/status', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
    try {
        const { status } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status });
        res.json({ message: "Status updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

// 5. DELETE ORDER (Admin Only)
router.delete('/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: "Order deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

module.exports = router;