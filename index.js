const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const KeyModel = require('./models/Key.js'); // Az önce oluşturduğumuz dosyanın yolu

const app = express();
app.use(cors()); // Sitenin bota bağlanmasına izin verir
app.use(express.json()); // Gelen verileri okumasını sağlar

// 1. SİTEDEN TÜM KEYLERİ İSTEME KÖPRÜSÜ
app.get('/api/keys', async (req, res) => {
    try {
        const keys = await KeyModel.find().sort({ createdAt: -1 });
        res.json(keys);
    } catch (err) {
        res.status(500).json({ error: 'Veritabanı hatası' });
    }
});

// 2. SİTEDEN YENİ KEY OLUŞTURMA KÖPRÜSÜ
app.post('/api/keys/generate', async (req, res) => {
    const { userId, keyName, expiry } = req.body;

    // Sadece Kurucu ID'si key üretebilir (Güvenlik Duvarı)
    if (userId !== '345821033414262794') {
        return res.status(403).json({ error: 'Yetkisiz işlem!' });
    }

    try {
        const newKey = new KeyModel({
            key: keyName,
            expiry: expiry,
            hwid: null,
            owner: userId
        });
        await newKey.save();
        res.json({ success: true, message: 'Key başarıyla üretildi.', key: newKey });
    } catch (err) {
        res.status(500).json({ error: 'Key oluşturulamadı' });
    }
});

// 3. SİTEDEN KEY SİLME VEYA HWID SIFIRLAMA KÖPRÜSÜ
app.post('/api/keys/action', async (req, res) => {
    const { userId, keyId, action } = req.body;
    
    if (userId !== '345821033414262794') return res.status(403).json({ error: 'Yetki yok!' });

    try {
        if (action === 'delete') {
            await KeyModel.findByIdAndDelete(keyId);
            res.json({ success: true, message: 'Silindi' });
        } else if (action === 'reset') {
            await KeyModel.findByIdAndUpdate(keyId, { hwid: null });
            res.json({ success: true, message: 'Sıfırlandı' });
        }
    } catch (err) {
        res.status(500).json({ error: 'İşlem başarısız' });
    }
});

// Sunucuyu Ayaklandır
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[🌐 API] Web Köprüsü Port ${PORT} Üzerinde Aktif!`);
});
const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent 
    ]
});

client.commands = new Collection();
const commandsArray = []; // Discord'a gönderilecek komutlar

// --- 1. VERİTABANI BAĞLANTISI ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ [DB] MongoDB Mermi Gibi!'))
    .catch(err => console.error('❌ [DB] Hata:', err));

// --- 2. KOMUT YÜKLEYİCİ ---
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

// --- 3. EVENT YÜKLEYİCİ ---
client.removeAllListeners();
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

// --- 4. KOMUTLARI DİSCORD'A KAYDET ---
client.once('ready', async () => {
    console.log(`🚀 Bot aktif: ${client.user.tag}`);
    try {
        await client.application.commands.set(commandsArray);
        console.log('✅ Bütün Slash Komutları Discord\'a Kaydedildi!');
    } catch (error) { console.error('❌ Komut kayıt hatası:', error); }
});

// --- 5. ROBLOX API ---
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