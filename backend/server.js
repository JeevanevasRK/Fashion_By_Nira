require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// IMPORT ROUTES
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();

// --- 1. CORS: ALLOW EVERYONE (To eliminate CORS errors) ---
app.use(cors({
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());

// --- 2. DB CONNECTION (Non-Blocking) ---
// We do NOT wait for this to finish. The server starts immediately.
console.log("Attempting to connect to MongoDB...");
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => {
        console.error("❌ MONGODB CONNECTION FAILED:", err.message);
        console.log("⚠️ Server is running in Offline Mode (Login via Master Key only)");
    });

// --- 3. ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send("Backend is Online! Check Render Logs for DB Status.");
});

// --- 4. FORCE SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});