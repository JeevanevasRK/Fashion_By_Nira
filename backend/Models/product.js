const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    image: String, // We will save the image link here
    category: String
});

module.exports = mongoose.model('Product', productSchema);