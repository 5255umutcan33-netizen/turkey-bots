const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    hwid: { type: String, default: null }, // İlk girişte buraya kaydedilecek
    createdBy: { type: String, required: true }, // Oluşturanın Discord ID'si
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
});

module.exports = mongoose.model('Key', keySchema);