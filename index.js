const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 1. MODELLER
const KeyModel = require('./models/key.js'); 

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

// Middleware
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

// --- 6. WEB API KÖPRÜLERİ ---
app.get('/api/keys', async (req, res) => {
    try {
        const keys = await KeyModel.find().sort({ createdAt: -1 });
        res.json(keys);
    } catch (err) { res.status(500).json({ error: 'Veritabanı hatası' }); }
});

app.post('/api/keys/generate', async (req, res) => {
    const { userId, keyName, expiry } = req.body;
    if (userId !== '345821033414262794') return res.status(403).json({ error: 'Yetki yok!' });
    
    try {
        const newKey = new KeyModel({ key: keyName, expiry: expiry || 'Sınırsız', hwid: null, owner: userId });
        await newKey.save();

        const KEY_LOG_ID = '1491473038204469308'; 
        const logChannel = client.channels.cache.get(KEY_LOG_ID);
        if (logChannel) {
            const keyLog = new EmbedBuilder()
                .setTitle('🔑 YENİ KEY OLUŞTURULDU')
                .setColor('#FEE75C')
                .addFields(
                    { name: '🛠️ Oluşturan', value: `<@${userId}>`, inline: true },
                    { name: '📜 Key Adı', value: `\`${keyName}\``, inline: true },
                    { name: '🆔 Key ID', value: `\`${newKey._id}\``, inline: true },
                    { name: '⏳ Süre', value: `${expiry || 'Sınırsız'}`, inline: true }
                )
                .setTimestamp();
            logChannel.send({ embeds: [keyLog] }).catch(()=>{});
        }
        res.json({ success: true, key: newKey });
    } catch (err) { 
        res.status(500).json({ error: 'Oluşturma hatası' }); 
    }
});

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
    } catch (err) { res.status(500).json({ error: 'İşlem hatası' }); }
});

app.get('/api/staff', async (req, res) => {
    try {
        const guild = client.guilds.cache.first(); 
        if (!guild) return res.json([]);
        await guild.members.fetch(); 
        const staffMembers = guild.members.cache.filter(m => 
            !m.user.bot && (m.permissions.has('Administrator') || m.roles.cache.some(r => r.name.toLowerCase().match(/admin|mod|kurucu|owner|yetkili/)))
        );
        const staffList = staffMembers.map(m => {
            const highestRole = m.roles.cache.sort((a, b) => b.position - a.position).first();
            let roleColor = '#5865F2'; 
            if (highestRole && highestRole.hexColor !== '#000000') roleColor = highestRole.hexColor;
            return {
                id: m.user.id,
                username: m.user.username,
                avatar: m.user.displayAvatarURL({ dynamic: true, format: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png',
                role: highestRole ? highestRole.name : 'YETKİLİ',
                color: roleColor
            };
        });
        res.json(staffList);
    } catch (err) { res.status(500).json([]); }
});

// --- 7. ROBLOX / SCRIPT VERIFY SİSTEMİ ---
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

// =========================================================
// 🚨 LUAWARE LINKVERTISE REKLAM SONRASI KEY TESLİMAT SAYFASI 🚨
// =========================================================
app.get('/key-al', async (req, res) => {
    const userId = req.query.userid;
    if (!userId) return res.send('<h1 style="color:red; text-align:center; margin-top:50px;">Hata! Discord ID bulunamadı. Lütfen Discord üzerinden tekrar tıklayın.</h1>');

    try {
        let userKey = await KeyModel.findOne({ owner: userId });
        
        if (!userKey) {
            const part1 = Math.random().toString(36).substr(2, 4).toUpperCase();
            const part2 = Math.random().toString(36).substr(2, 4).toUpperCase();
            const newKeyString = `LUA-USER-${part1}-${part2}`;
            const licenseId = Math.floor(10000 + Math.random() * 90000).toString(); 
            userKey = await new KeyModel({ key: newKeyString, expiry: 'Sınırsız', owner: userId, licenseId: licenseId }).save();
        }

        const htmlSayfa = `
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>LUAWARE Key System</title>
                <style>
                    body { background-color: #2B2D31; color: white; font-family: sans-serif; text-align: center; padding-top: 100px; }
                    .key-box { background-color: #1E1F22; padding: 30px; border-radius: 15px; display: inline-block; border: 2px solid #00D4FF; }
                    h1 { color: #57F287; }
                    .key { font-size: 28px; color: #00D4FF; font-family: monospace; font-weight: bold; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1>✅ Reklamı Başarıyla Geçtin!</h1>
                <p>İşte LUAWARE Script Anahtarın:</p>
                <div class="key-box"><div class="key">${userKey.key}</div></div>
                <p style="color: #ED4245; margin-top: 20px;">DİKKAT: Anahtar hesabına kodlanmıştır, başkasıyla paylaşma!</p>
            </body>
            </html>
        `;
        res.send(htmlSayfa);
    } catch (err) {
        res.send('<h1 style="color:red; text-align:center;">Sistem Hatasi! Lütfen yöneticilere ulaşın.</h1>');
    }
});
// =========================================================

// --- 8. BAŞLATMA VE PORT AYARI ---
app.get('/', (req, res) => res.send('RYPHERA OS ONLINE 🚀'));

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

// --- 🛡️ RYPHERA ANTI-CRASH SİSTEMİ (ÖLÜMSÜZLÜK KALKANI) ---
process.on('unhandledRejection', (reason, promise) => {
    console.log('🚨 [Anti-Crash] İşlenmeyen Hata Engellendi (unhandledRejection):', reason);
});
process.on('uncaughtException', (err, origin) => {
    console.log('🚨 [Anti-Crash] Beklenmeyen Hata Engellendi (uncaughtException):', err);
});
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('🚨 [Anti-Crash] Beklenmeyen Hata Monitörü:', err);
});