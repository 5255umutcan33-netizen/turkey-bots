const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// --- 1. BOT AYARLARI ---
const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // SS'leri okumak için şart!
    ]
});

client.commands = new Collection();

// --- 2. VERİTABANI BAĞLANTISI ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ [DB] MongoDB bağlantısı mermi gibi!'))
    .catch(err => console.error('❌ [DB] Bağlantı hatası:', err));

// --- 3. GÜVENLİ KOMUT YÜKLEYİCİ ---
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        try {
            const command = require(path.join(commandsPath, file));
            if (command.data && command.data.name) {
                client.commands.set(command.data.name, command);
            }
        } catch (error) {
            console.error(`❌ [HATA] ${file} komutu yüklenemedi:`, error.message);
        }
    }
}

// --- 4. GÜVENLİ EVENT YÜKLEYİCİ (ÇİFT ÇALIŞMA KORUMALI) ---
client.removeAllListeners(); // Tüm eski dinleyicileri temizle, duplicate engelle!

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        try {
            const event = require(path.join(eventsPath, file));
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
        } catch (error) {
            console.error(`❌ [HATA] ${file} eventi yüklenemedi:`, error.message);
        }
    }
}

// --- 5. ROBLOX VERIFY API ---
app.get('/verify', async (req, res) => {
    const { key, hwid } = req.query;
    if (!key || !hwid) return res.json({ success: false, message: "EKSİK VERİ!" });

    try {
        const KeyModel = require('./models/key');
        const data = await KeyModel.findOne({ key: key });

        if (!data) return res.json({ success: false, message: "GEÇERSİZ ANAHTAR!" });
        if (data.hwid && data.hwid !== hwid) return res.json({ success: false, message: "HWID KİLİDİ (Farklı Cihaz)!" });

        if (!data.hwid) {
            data.hwid = hwid;
            await data.save();
        }

        return res.json({ success: true, message: "GİRİŞ BAŞARILI!" });
    } catch (err) {
        return res.json({ success: false, message: "SUNUCU HATASI!" });
    }
});

// Render'da canlı kalmak için
app.get('/', (req, res) => res.send('RYPHERA OS ONLINE 🚀'));

// --- 6. BAŞLATMA ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 [API] Port ${PORT} aktif.`));

client.login(process.env.TOKEN);