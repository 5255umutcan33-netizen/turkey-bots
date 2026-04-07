const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// --- 1. BOT KURULUMU ---
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
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            
            // Hata kontrolü: 'data' veya 'name' eksikse botu çökertme!
            if (command && command.data && command.data.name) {
                client.commands.set(command.data.name, command);
                console.log(`✅ [KOMUT] ${command.data.name} yüklendi.`);
            } else {
                console.warn(`⚠️ [UYARI] ${file} dosyasında 'data.name' eksik! Dosyayı kontrol et.`);
            }
        } catch (error) {
            console.error(`❌ [HATA] ${file} yüklenirken bir sorun oluştu:`, error.message);
        }
    }
}

// --- 4. GÜVENLİ EVENT YÜKLEYİCİ ---
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        try {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
            console.log(`✅ [EVENT] ${event.name} aktif.`);
        } catch (error) {
            console.error(`❌ [HATA] ${file} eventi yüklenemedi:`, error.message);
        }
    }
}

// --- 5. ROBLOX VERIFY API ---
app.get('/verify', async (req, res) => {
    const { key, hwid } = req.query;

    if (!key || !hwid) {
        return res.json({ success: false, message: "EKSİK VERİ!" });
    }

    try {
        const KeyModel = require('./models/key');
        const existingKey = await KeyModel.findOne({ key: key });

        if (!existingKey) {
            return res.json({ success: false, message: "GEÇERSİZ ANAHTAR!" });
        }

        if (existingKey.hwid && existingKey.hwid !== hwid) {
            return res.json({ success: false, message: "FARKLI CİHAZ (HWID)!" });
        }

        if (!existingKey.hwid) {
            existingKey.hwid = hwid;
            await existingKey.save();
        }

        return res.json({ success: true, message: "GİRİŞ BAŞARILI!" });

    } catch (err) {
        console.error("API Hatası:", err);
        return res.json({ success: false, message: "VERİTABANI HATASI!" });
    }
});

// Render Sağlık Kontrolü
app.get('/', (req, res) => res.send('RYPHERA OS ONLINE 🚀'));

// --- 6. BAŞLATMA ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 [API] Port ${PORT} üzerinde dinleniyor.`));

client.login(process.env.TOKEN);