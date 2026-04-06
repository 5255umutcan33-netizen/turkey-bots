require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    REST, 
    Routes 
} = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const moment = require('moment');

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

// --- 1. MONGODB BAĞLANTISI VE MODELİ ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ [DATABASE] MongoDB Bağlantısı Mermi Gibi!'))
    .catch(err => console.error('❌ [DATABASE] Hata:', err));

const KeyModel = mongoose.model('Key', new mongoose.Schema({
    key: String,
    hwid: { type: String, default: null }, // İlk girişte buraya kilitlenir
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
}));

// --- 2. ROBLOX VERIFY API (HWID KİLİTLİ) ---
app.get('/verify', async (req, res) => {
    const { key, hwid } = req.query;

    if (!key || !hwid) return res.json({ success: false, message: "Eksik parametre (Key/HWID)!" });

    try {
        const keyData = await KeyModel.findOne({ key: key });

        if (!keyData) return res.json({ success: false, message: "Geçersiz Lisans Anahtarı!" });

        // Süre Kontrolü
        if (new Date() > keyData.expiresAt) {
            await KeyModel.deleteOne({ key: key });
            return res.json({ success: false, message: "Lisans süresi dolmuş!" });
        }

        // HWID Kilitleme Mantığı
        if (keyData.hwid === null) {
            // İlk giriş, cihazı kaydet
            keyData.hwid = hwid;
            await keyData.save();
            return res.json({ success: true, message: "Cihazınız Sisteme Kaydedildi!" });
        } else if (keyData.hwid !== hwid) {
            // Başka cihaz girmeye çalışıyor
            return res.json({ success: false, message: "HWID HATASI! Bu key başka bir cihaza ait." });
        }

        return res.json({ success: true, message: "Giriş Başarılı!" });
    } catch (err) {
        res.json({ success: false, message: "Sistem hatası!" });
    }
});

// --- 3. SLASH KOMUTLARI KAYDETME (Deploy Commands) ---
const commands = [
    {
        name: 'keyalkur',
        description: 'Key alma panelini kurar (Admin Özel)',
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Slash komutları yükleniyor...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Slash komutları başarıyla kaydedildi!');
    } catch (error) {
        console.error(error);
    }
})();

// --- 4. DISCORD ETKİLEŞİMLERİ (Interaction) ---
client.on('interactionCreate', async (interaction) => {
    
    // /keyalkur Komutu İşleme
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'keyalkur') {
            if (!interaction.member.permissions.has('Administrator')) {
                return interaction.reply({ content: '❌ Bu komutu sadece adminler kullanabilir kanka!', ephemeral: true });
            }

            const setupEmbed = new EmbedBuilder()
                .setTitle('🇹🇷 TURKEY HUB | LİSANS SİSTEMİ')
                .setDescription('> Aşağıdaki butona basarak **24 Saatlik** ücretsiz anahtarını alabilirsin.\n\n**⚠️ DİKKAT:** Aldığın anahtar ilk girdiğin cihaza kilitlenir!')
                .setColor('#FF0000')
                .setImage('https://i.ibb.co/vzY8M9v/turkey-banner.png') // Buraya kendi bannerını koyabilirsin
                .setFooter({ text: 'Turkey Hub Services • 2026', iconURL: client.user.displayAvatarURL() });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('get_key')
                    .setLabel('🔑 Anahtar Al')
                    .setStyle(ButtonStyle.Danger)
            );

            await interaction.reply({ embeds: [setupEmbed], components: [row] });
        }
    }

    // Buton Tıklama (Key Üretme)
    if (interaction.isButton()) {
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
                    .setTitle('🇹🇷 TURKEY HUB | LİSANS TANIMLANDI')
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setColor('#FF0000')
                    .addFields(
                        { name: '🔑 ANAHTARIN', value: `\`${generatedKey}\``, inline: false },
                        { name: '👤 OLUŞTURAN', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '📅 TARİH', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                        { name: '⌛ BİTİŞ SÜRESİ', value: `<t:${Math.floor(expireDate.getTime() / 1000)}:F>`, inline: false },
                        { name: '⚠️ ÖNEMLİ', value: 'Bu anahtar girdiğin ilk cihazın **HWID** adresine kilitlenecektir.', inline: false }
                    )
                    .setFooter({ text: 'İyi oyunlar kanka! - Turkey Hub' })
                    .setTimestamp();

                await interaction.user.send({ embeds: [dmEmbed] });
                await interaction.reply({ content: '✅ Lisans anahtarın DM üzerinden gönderildi kanka!', ephemeral: true });
            } catch (err) {
                await interaction.reply({ content: '❌ DM kutun kapalı olduğu için anahtarını gönderemedim!', ephemeral: true });
            }
        }
    }
});

// --- 5. BAŞLATMA ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 [WEB] API ${PORT} portunda aktif!`));
client.login(process.env.TOKEN);