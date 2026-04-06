require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const moment = require('moment');

const app = express();
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
    partials: [Partials.Channel]
});

// --- VERİTABANI AYARLARI ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ [DATABASE] Bağlantı Başarılı!'))
    .catch(err => console.error('❌ [DATABASE] Hata:', err));

const KeyModel = mongoose.model('Key', new mongoose.Schema({
    key: String,
    hwid: { type: String, default: null },
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
}));

// --- ROBLOX DOĞRULAMA (API) ---
app.get('/verify', async (req, res) => {
    const { key, hwid } = req.query;

    if (!key || !hwid) return res.json({ success: false, message: "Eksik parametre (Key/HWID)!" });

    try {
        const keyData = await KeyModel.findOne({ key: key });

        if (!keyData) return res.json({ success: false, message: "Geçersiz Lisans!" });

        // Süre Kontrolü
        if (new Date() > keyData.expiresAt) {
            await KeyModel.deleteOne({ key: key });
            return res.json({ success: false, message: "Lisans süresi dolmuş!" });
        }

        // HWID Kilidi
        if (keyData.hwid === null) {
            keyData.hwid = hwid;
            await keyData.save();
            return res.json({ success: true, message: "Cihazınız başarıyla zimmetlendi!" });
        } else if (keyData.hwid !== hwid) {
            return res.json({ success: false, message: "HWID Hatası! Bu key başka bir cihaza ait." });
        }

        return res.json({ success: true, message: "Giriş Başarılı!" });
    } catch (err) {
        res.json({ success: false, message: "Sunucu hatası oluştu!" });
    }
});

// --- DISCORD ETKİLEŞİM (Modern DM & Panel) ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'get_key') {
        const generatedKey = `TURKEY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const expireDate = moment().add(24, 'hours').toDate();

        const newKey = new KeyModel({
            key: generatedKey,
            createdBy: interaction.user.id,
            expiresAt: expireDate
        });

        try {
            await newKey.save();

            const dmEmbed = new EmbedBuilder()
                .setTitle('🇹🇷 TURKEY HUB | LİSANS ONAYI')
                .setThumbnail(interaction.user.displayAvatarURL())
                .setColor('#FF0000')
                .addFields(
                    { name: '🔑 ANAHTARIN', value: `\`${generatedKey}\``, inline: false },
                    { name: '👤 OLUŞTURAN', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '📅 TARİH', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                    { name: '⌛ BİTİŞ', value: `<t:${Math.floor(expireDate.getTime() / 1000)}:F>`, inline: false },
                    { name: '⚠️ NOT', value: 'Bu key sadece ilk girdiğin cihazda çalışır (HWID Lock).', inline: false }
                )
                .setFooter({ text: 'Turkey Hub Premium Services' })
                .setTimestamp();

            await interaction.user.send({ embeds: [dmEmbed] });
            await interaction.reply({ content: '✅ Keyin DM kutuna mermi gibi gönderildi kanka!', ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: '❌ Hata: DM kutun kapalı olabilir!', ephemeral: true });
        }
    }
});

app.listen(process.env.PORT || 3000, () => console.log('🚀 [WEB] API Aktif!'));
client.login(process.env.TOKEN);