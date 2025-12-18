const router = require('express').Router();
const Order = require('../models/order'); // Fixed: Capital 'O' to match filename
const Product = require('../models/product'); // <--- ADD THIS LINE
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

// 1. PLACE ORDER (Public) - [UPDATED FOR INVOICE FIX]
router.post('/', async (req, res) => {
    try {
        const { products, shippingAddress, customerName, customerPhone } = req.body;

        // A. Prepare variables
        let finalTotal = 0;
        const frozenProducts = [];

        // B. Loop through every item requested by the customer
        for (const item of products) {
            // Find the REAL product in the database to get the current price
            const dbProduct = await Product.findById(item.productId);

            if (!dbProduct) {
                return res.status(404).json({ error: `Product not found: ${item.productId}` });
            }

            // C. Calculate cost using the DB price (Secure)
            const lineTotal = dbProduct.price * item.quantity;
            finalTotal += lineTotal;

            // D. Create the "Frozen Snapshot"
            // We save the price, title, and image NOW so they never change in the future
            frozenProducts.push({
                productId: dbProduct._id,
                quantity: item.quantity,
                price: dbProduct.price,    // <--- THE FIX: Saving price explicitly
                title: dbProduct.title,    // <--- Saving title explicitly
                image: dbProduct.image || (dbProduct.images && dbProduct.images[0]) || "" // Robust image fallback
            });
        }

        // E. Save the order with the frozen data
        const newOrder = new Order({
            products: frozenProducts,   // Use our new detailed array
            totalAmount: finalTotal,    // Use the calculated total
            shippingAddress,
            customerName,
            customerPhone,
            status: 'Pending'
        });

        await newOrder.save();
        res.json({ message: "Order placed successfully!", orderId: newOrder._id });

    } catch (err) {
        console.error("Order Error:", err);
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