const mongoose = require('mongoose');

const aboneChannelSchema = new mongoose.Schema({
    channelId: { type: String, required: true },
    lang: { type: String, enum: ['tr', 'en'], required: true }
});

module.exports = mongoose.model('AboneChannel', aboneChannelSchema);