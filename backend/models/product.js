const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
     // 🟢 NEW: MRP / Original Price Field
    originalPrice: { type: Number }, 
    description: String,

    // Supports multiple images
    images: [String],

    // Legacy support for single image (optional, keeps old data safe)
    image: String,

    category: String,

    // Stock Status
    inStock: { type: Boolean, default: true }, // <--- Added comma here

    // 🟢 NEW: Stock Quantity Logic
    stock: { type: Number, default: 0 }
        // 🟢 NEW: Color Options Schema
    colors: [{ 
        name: String, 
        inStock: { type: Boolean, default: true } 
    }],
    

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
