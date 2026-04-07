const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// --- 1. KURULUMLAR ---
const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages
    ]
});

client.commands = new Collection();

// --- 2. VERİTABANI BAĞLANTISI ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ [DB] MongoDB bağlantısı mermi gibi!'))
    .catch(err => console.error('❌ [DB] Bağlantı hatası:', err));

// --- 3. KOMUT VE EVENT YÜKLEYİCİ (DÜZELTİLDİ) ---
const commandsPath = path.join(__dirname, 'commands'); // __dirname olarak güncellendi
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (command.data && command.data.name) {
        client.commands.set(command.data.name, command);
    }
}

const eventsPath = path.join(__dirname, 'events'); // __dirname olarak güncellendi
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// --- 4. ANTI-LEAVE SİSTEMİ ---
client.on('guildMemberRemove', async (member) => {
    try {
        const KeyModel = require('./models/key');
        const deletedKey = await KeyModel.findOneAndDelete({ createdBy: member.id });
        if (deletedKey) {
            console.log(`🚫 [SİSTEM] ${member.user.tag} çıktı, keyi (\`${deletedKey.key}\`) iptal edildi.`);
        }
    } catch (err) {
        console.error('Anti-Leave hatası:', err);
    }
});

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

        return res.json({ success: true, message: "ERİŞİM ONAYLANDI!" });

    } catch (err) {
        console.error("API Hatası:", err);
        return res.json({ success: false, message: "SUNUCU HATASI!" });
    }
});

// Sağlık kontrolü
app.get('/', (req, res) => {
    res.send('RYPHERA OS ONLINE 🚀');
});

// --- 6. BAŞLATMA ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 [API] Port ${PORT} aktif.`);
});

client.login(process.env.TOKEN);