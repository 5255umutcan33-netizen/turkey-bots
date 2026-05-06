const mongoose = require('mongoose');

const staffStatSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    claims: { type: Number, default: 0 }
});

module.exports = mongoose.model('StaffStat', staffStatSchema);