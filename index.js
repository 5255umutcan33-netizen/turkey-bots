const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 1. MODELLER
// Not: Klasöründeki dosya adı 'Key.js' ise öyle kalsın, 'key.js' ise küçük yap.
const KeyModel = require('./models/Key.js'); 

// 2. SUNUCU VE BOT BAŞLATMA
const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ]
});

// Middleware Ayarları
app.use(cors());
app.use(express.json());

client.commands = new Collection();
const commandsArray = [];

// --- 3. VERİTABANI BAĞLANTISI ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ [DB] MongoDB Bağlantısı Başarılı!'))
    .catch(err => console.error('❌ [DB] Bağlantı Hatası:', err));

// --- 4. KOMUT VE EVENT YÜKLEYİCİ ---
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
            commandsArray.push(command.data.toJSON());
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

// --- 5. WEB API KÖPRÜLERİ (SİTE İÇİN) ---

// Tüm Keyleri Listeleme
app.get('/api/keys', async (req, res) => {
    try {
        const keys = await KeyModel.find().sort({ createdAt: -1 });
        res.json(keys);
    } catch (err) {
        res.status(500).json({ error: 'Veritabanı hatası' });
    }
});

// Yeni Key Oluşturma
app.post('/api/keys/generate', async (req, res) => {
    const { userId, keyName, expiry } = req.body;
    if (userId !== '345821033414262794') return res.status(403).json({ error: 'Yetki yok!' });

    try {
        const newKey = new KeyModel({
            key: keyName,
            expiry: expiry,
            hwid: null,
            owner: userId
        });
        await newKey.save();
        res.json({ success: true, key: newKey });
    } catch (err) {
        res.status(500).json({ error: 'Oluşturma hatası' });
    }
});

// Key Silme / Resetleme
app.post('/api/keys/action', async (req, res) => {
    const { userId, keyId, action } = req.body;
    if (userId !== '345821033414262794') return res.status(403).json({ error: 'Yetki yok!' });

    try {
        if (action === 'delete') {
            await KeyModel.findByIdAndDelete(keyId);
            res.json({ success: true });
        } else if (action === 'reset') {
            await KeyModel.findByIdAndUpdate(keyId, { hwid: null });
            res.json({ success: true });
        }
    } catch (err) {
        res.status(500).json({ error: 'İşlem hatası' });
    }
});

// --- 6. ROBLOX API (ESKİ SİSTEM) ---
app.get('/verify', async (req, res) => {
    const { key, hwid } = req.query;
    if (!key || !hwid) return res.json({ success: false, message: "EKSİK VERİ!" });
    try {
        const data = await KeyModel.findOne({ key: key });
        if (!data) return res.json({ success: false, message: "GEÇERSİZ KEY!" });
        if (data.hwid && data.hwid !== hwid) return res.json({ success: false, message: "HWID KİLİDİ!" });
        if (!data.hwid) { data.hwid = hwid; await data.save(); }
        return res.json({ success: true, message: "BAŞARILI" });
    } catch (e) { return res.json({ success: false, message: "HATA" }); }
});

// --- 7. BAŞLATMA ---
app.get('/', (req, res) => res.send('RYPHERA OS ONLINE 🚀'));

// SADECE BİR TANE LISTEN OLMALI!
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 [🌐 Sunucu] Port ${PORT} üzerinde aktif.`);
});

client.once('ready', async () => {
    console.log(`🚀 [🤖 Bot] Aktif: ${client.user.tag}`);
    try {
        await client.application.commands.set(commandsArray);
        console.log('✅ Slash Komutları Kaydedildi!');
    } catch (error) { console.error('❌ Kayıt hatası:', error); }
});

client.login(process.env.TOKEN);