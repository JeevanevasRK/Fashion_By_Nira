const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String }, // New field for password
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    otp: { type: String },
    otpExpires: { type: Date }
});

module.exports = mongoose.model('User', userSchema);