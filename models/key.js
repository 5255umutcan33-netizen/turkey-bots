const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Modelin dışarıya doğru aktarıldığından emin oluyoruz
const Key = mongoose.model('Key', keySchema);
module.exports = Key;