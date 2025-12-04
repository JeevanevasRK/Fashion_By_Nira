require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// IMPORT ROUTES
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();

// ==============================================
// 1. ROBUST CORS CONFIGURATION (THE FIX)
// ==============================================
// This tells the server exactly who is allowed to connect
app.use(cors({
    origin: [
        "https://fashion-by-nira.vercel.app", // Your Live Vercel Site
        "http://localhost:5173"               // Your Laptop (for testing)
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// ==============================================
// 2. MIDDLEWARE
// ==============================================
app.use(express.json());

// ==============================================
// 3. DATABASE CONNECTION
// ==============================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ Connection failed:", err));

// ==============================================
// 4. ROUTES
// ==============================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// BASIC TEST ROUTE
app.get('/', (req, res) => {
    res.send("Backend is running!");
});

// ==============================================
// 5. START SERVER
// ==============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});