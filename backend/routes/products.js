 const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const jwt = require('jsonwebtoken');

// Middleware to check if user is Admin
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Access Denied" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified.role !== 'admin') {
            return res.status(403).json({ error: "Admins only!" });
        }
        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid Token" });
    }
};

// 1. ADD PRODUCT (Only Admins can do this)
router.post('/', verifyAdmin, async (req, res) => {
    const { title, price, description, image, category } = req.body;
    try {
        const newProduct = new Product({ title, price, description, image, category });
        await newProduct.save();
        res.json({ message: "Product added successfully!", product: newProduct });
    } catch (err) {
        res.status(500).json({ error: "Could not add product" });
    }
});

// 2. GET ALL PRODUCTS (Everyone can see this)
router.get('/', async (req, res) => {
    try {
        // Prevent caching so users always see the latest image updates
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        
        // Fetch products and sort them (optional: .sort({ _id: -1 }) shows newest first)
        const products = await Product.find().sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch products" });
    }
});

// 3. UPDATE PRODUCT (Admin Only)
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        // Find product by ID and update it with new data
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // Return the updated version
        );
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: "Could not update product" });
    }
});

// 4. DELETE PRODUCT (Admin Only)
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Could not delete product" });
    }
});

module.exports = router;
