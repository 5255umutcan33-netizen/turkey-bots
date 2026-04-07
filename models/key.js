const mongoose = require('mongoose');

const rypheraSchema = new mongoose.Schema({
    key: { type: String, required: true }, // RYP-XXXXX
    keyId: { type: String, required: true }, // 6 Haneli Teknik ID
    hwid: { type: String, default: null },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RypheraKey', rypheraSchema);