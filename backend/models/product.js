const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    images: [String], // <--- CHANGED TO ARRAY
    category: String,
    inStock: { type: Boolean, default: true }
});

module.exports = mongoose.model('Product', productSchema);