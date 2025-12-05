const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    image: String,
    category: String,
    inStock: { type: Boolean, default: true } // <--- NEW FIELD
});

module.exports = mongoose.model('Product', productSchema);