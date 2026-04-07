const mongoose = require('mongoose');

const aboneChannelSchema = new mongoose.Schema({
    channelId: { type: String, required: true },
    lang: { type: String, enum: ['tr', 'en'], required: true }
});

// Hata almamak için kalkanlı model
module.exports = mongoose.models.AboneChannel || mongoose.model('AboneChannel', aboneChannelSchema);