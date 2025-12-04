require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// IMPORT ROUTES
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();

// --- 1. CORS: ALLOW EVERYONE (To fix the block) ---
app.use(cors({
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());

// --- 2. DB CONNECTION (Non-Blocking) ---
// We don't wait for this to start the server. 
// If it fails, it logs the error but keeps the server alive.
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MONGODB ERROR:", err.message));

// --- 3. ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send("Backend is Online! (Check logs for DB status)");
});

// --- 4. START SERVER (IMMEDIATELY) ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});