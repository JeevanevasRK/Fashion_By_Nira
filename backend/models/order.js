const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional
    customerName: String,
    customerPhone: String,
    
        // 🔴 IMPORTANT CHANGE BELOW 🔴
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: { type: Number, default: 1 },
            
            // 🟢 ADD THIS LINE TO SAVE THE COLOR
            selectedColor: { type: String },

            // SNAPSHOT FIELDS: These "freeze" the data at the moment of purchase
            price: { type: Number, required: true },
            title: { type: String },              // Useful if you delete the original product
            image: { type: String }               // Useful if you change the product image later
        }
    ],
    

    totalAmount: Number,
    shippingAddress: String,
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
