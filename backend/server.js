require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// IMPORT ROUTES
const authRoutes = require('./routes/auth'); // <--- ADD THIS
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders'); // <--- ADD THIS

const app = express();

//MIDDLEWARE
app.use(cors());
app.use(express.json());

//DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ Connection failed:", err));

// USE ROUTES
app.use('/api/auth', authRoutes); // <--- ADD THIS
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes); // <--- ADD THIS

//BASIC TEST ROUTE
app.get('/', (req, res) => {
    res.send("Backend is running!");
});

// START SERVER
// process.env.PORT lets the cloud define the port. 5000 is just a backup.
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});