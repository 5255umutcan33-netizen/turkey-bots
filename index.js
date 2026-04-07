const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent 
    ]
});

client.commands = new Collection();
const commandsArray = []; // Discord'a gönderilecek komutların listesi

// --- 1. VERİTABANI ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ [DB] MongoDB Mermi Gibi!'))
    .catch(err => console.error('❌ [DB] Hata:', err));

// --- 2. KOMUT YÜKLEYİCİ VE KAYDEDİCİ ---
client.removeAllListeners();

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
            commandsArray.push(command.data.toJSON()); // Discord için hazırla
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

// BOT HAZIR OLDUĞUNDA KOMUTLARI DİSCORD'A KAYDET! (Sorunun çözümü burası)
client.once('ready', async () => {
    console.log(`🚀 Bot aktif: ${client.user.tag}`);
    try {
        console.log('⏳ Slash komutları Discord\'a yükleniyor...');
        await client.application.commands.set(commandsArray);
        console.log('✅ Bütün Slash Komutları Mermi Gibi Kaydedildi!');
    } catch (error) {
        console.error('❌ Komut kayıt hatası:', error);
    }
});

// --- 3. ROBLOX API ---
app.get('/verify', async (req, res) => {
    const { key, hwid } = req.query;
    if (!key || !hwid) return res.json({ success: false, message: "EKSİK VERİ!" });
    try {
        const KeyModel = require('./models/key');
        const data = await KeyModel.findOne({ key: key });
        if (!data) return res.json({ success: false, message: "GEÇERSİZ KEY!" });
        if (data.hwid && data.hwid !== hwid) return res.json({ success: false, message: "HWID KİLİDİ!" });
        if (!data.hwid) { data.hwid = hwid; await data.save(); }
        return res.json({ success: true, message: "BAŞARILI" });
    } catch (e) { return res.json({ success: false, message: "HATA" }); }
});

app.get('/', (req, res) => res.send('RYPHERA OS ONLINE 🚀'));
app.listen(process.env.PORT || 10000, () => console.log('🚀 API Aktif.'));

client.login(process.env.TOKEN);