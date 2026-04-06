const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
    key: { type: String, required: true },
    keyId: { type: String, required: true }, // Yeni: 6 haneli teknik ID
    hwid: { type: String, default: null },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Key', keySchema);