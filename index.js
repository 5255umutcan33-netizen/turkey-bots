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
        GatewayIntentBits.MessageContent // SS'leri görmek için şart!
    ]
});

client.commands = new Collection();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Bağlandı!'))
    .catch(err => console.error('❌ DB Hatası:', err));

// Komut Yükleyici
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
}

// Event Yükleyici
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    client.on(event.name, (...args) => event.execute(...args));
}

// ROBLOX API
app.get('/verify', async (req, res) => {
    const { key, hwid } = req.query;
    if (!key || !hwid) return res.json({ success: false, message: "EKSİK VERİ!" });

    try {
        const KeyModel = require('./models/key');
        const data = await KeyModel.findOne({ key: key });
        if (!data) return res.json({ success: false, message: "GEÇERSİZ KEY!" });
        if (data.hwid && data.hwid !== hwid) return res.json({ success: false, message: "HWID KİLİDİ!" });
        if (!data.hwid) { data.hwid = hwid; await data.save(); }
        return res.json({ success: true, message: "GİRİŞ BAŞARILI" });
    } catch (e) { return res.json({ success: false, message: "SUNUCU HATASI" }); }
});

app.get('/', (req, res) => res.send('RYPHERA ONLINE 🚀'));
app.listen(process.env.PORT || 10000, () => console.log('🚀 API AKTİF'));

client.login(process.env.TOKEN);