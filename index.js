require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const express = require('express');

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

client.commands = new Collection();

// --- MONGODB BAĞLANTISI ---
const mongoURI = 'mongodb+srv://botadmin:botadmin123@cluster0.kouskjx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
    .then(() => console.log('✅ [DATABASE] MongoDB Bağlantısı Başarılı!'))
    .catch(err => console.error('❌ [DATABASE] Bağlantı Hatası:', err));

const KeyModel = require('./models/Key');

// --- ROBLOX API (KONTROL NOKTASI) ---
app.get('/verify', async (req, res) => {
    const key = req.query.key;
    if (!key) return res.json({ success: false });

    try {
        const checkKey = await KeyModel.findOne({ key: key });
        if (checkKey) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        res.json({ success: false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 [WEB] API ${PORT} portunda aktif!`));

// --- KOMUT VE EVENT YÜKLEYİCİ ---
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.login(process.env.TOKEN);