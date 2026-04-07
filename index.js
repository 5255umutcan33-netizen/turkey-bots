const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent 
    ]
});

client.commands = new Collection();

// --- 1. VERİTABANI BAĞLANTISI ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ [DB] MongoDB Mermi Gibi Bağlandı!'))
    .catch(err => console.error('❌ [DB] Bağlantı Hatası:', err));

// --- 2. KOMUT VE EVENT YÜKLEYİCİ ---
client.removeAllListeners(); // Çift çalışmayı engellemek için

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

// --- 3. ROBLOX API SİSTEMİ ---
app.get('/verify', async (req, res) => {
    const { key, hwid } = req.query;
    if (!key || !hwid) return res.json({ success: false, message: "EKSİK VERİ!" });

    try {
        const KeyModel = require('./models/key');
        const data = await KeyModel.findOne({ key: key });

        if (!data) return res.json({ success: false, message: "GEÇERSİZ KEY!" });
        if (data.hwid && data.hwid !== hwid) return res.json({ success: false, message: "HWID KİLİDİ!" });
        
        if (!data.hwid) { 
            data.hwid = hwid; 
            await data.save(); 
        }
        
        return res.json({ success: true, message: "BAŞARILI" });
    } catch (e) { 
        return res.json({ success: false, message: "SUNUCU HATASI" }); 
    }
});

// Sağlık Kontrolü
app.get('/', (req, res) => res.send('RYPHERA OS ONLINE 🚀'));

// --- 4. PORT VE BAŞLATMA ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 API Port ${PORT} Aktif.`));

client.login(process.env.TOKEN);