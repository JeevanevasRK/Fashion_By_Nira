const router = require('express').Router();
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

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
            products, totalAmount, shippingAddress, customerName, customerPhone, status: 'Pending'
        });
        await newOrder.save();
        res.json({ message: "Order placed successfully!", orderId: newOrder._id });
    } catch (err) {
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

// ... (Your existing routes are above here)

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
// ... (Your existing routes are above here)

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