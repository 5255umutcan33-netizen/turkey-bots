const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    hwid: { type: String, default: null }, // Null ise boşta, doluysa bir cihaza kayıtlı
    expiry: { type: String, default: 'Sınırsız' },
    owner: { type: String, default: null }, // Hangi Discord ID'sine ait
    licenseId: { type: String }, // 📌 İŞTE O 5 HANELİ ID BURAYA KAYDOLACAK
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RypheraKey', keySchema);