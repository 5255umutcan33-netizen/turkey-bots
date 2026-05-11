const { Schema, model } = require('mongoose');

const partnerSchema = new Schema({
    temsilciId: String, // Partneri getiren kişinin ID'si
    mesajId: String,    // Bota attırdığımız partner mesajının ID'si
    kanalId: String,    // Mesajın atıldığı kanal
    guildId: String     // Sunucu ID'si
});

module.exports = model('Partner', partnerSchema);