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

        const KEY_LOG_ID = '1505092320091967498'; 
        const logChannel = client.channels.cache.get(KEY_LOG_ID);
        if (logChannel) {
            const keyLog = new EmbedBuilder()
                .setTitle('🔑 YENİ MANUEL KEY OLUŞTURULDU')
                .setColor('#FEE75C')
                .addFields(
                    { name: '🛠️ Oluşturan', value: `<@${userId}>`, inline: true },
                    { name: '📜 Key Adı', value: `\`${keyName}\``, inline: true },
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

// --- 7. ROBLOX / SCRIPT VERIFY SİSTEMİ ---
app.get('/verify', async (req, res) => {
    const { key, hwid } = req.query;
    if (!key || !hwid) return res.json({ success: false, message: "EKSİK VERİ!" });
    try {
        const data = await KeyModel.findOne({ key: key });
        if (!data) return res.json({ success: false, message: "GEÇERSİZ KEY!" });

        if (data.expiry === '24 Saat') {
            const creationTime = data._id.getTimestamp().getTime();
            if (Date.now() - creationTime >= 24 * 60 * 60 * 1000) {
                await KeyModel.findByIdAndDelete(data._id);
                return res.json({ success: false, message: "SÜRESİ DOLMUŞ!" });
            }
        }
        
        if (key.includes('FREE')) {
            return res.json({ success: true, message: "BAŞARILI" });
        }

        if (data.hwid && data.hwid !== hwid) return res.json({ success: false, message: "HWID KİLİDİ!" });
        if (!data.hwid) { data.hwid = hwid; await data.save(); }
        return res.json({ success: true, message: "BAŞARILI" });
    } catch (e) { return res.json({ success: false, message: "HATA" }); }
});

// =========================================================
// 🚨 LUAWARE LOOTLABS SAF IP SİSTEMİ (ID İPTAL) 🚨
// =========================================================
app.get('/key-al', async (req, res) => {
    // Discord ID'yi tamamen umursamıyoruz, URL'de ne yazarsa yazsın IP baz alınacak
    let userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Bilinmeyen-IP';
    if (userIp.includes(',')) userIp = userIp.split(',')[0].trim(); 

    const baseCSS = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
            body {
                background: linear-gradient(-45deg, #0f0c29, #302b63, #0f0c29);
                background-size: 400% 400%;
                animation: gradientBG 15s ease infinite;
                color: #fff;
                font-family: 'Poppins', sans-serif;
                margin: 0;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
            }
            @keyframes gradientBG {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .container {
                background: rgba(25, 25, 35, 0.6);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                max-width: 550px;
                width: 90%;
                animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            @keyframes popIn {
                0% { opacity: 0; transform: scale(0.8); }
                100% { opacity: 1; transform: scale(1); }
            }
            h1 { margin-top: 0; font-weight: 800; }
            .glow-text-green {
                background: -webkit-linear-gradient(45deg, #57F287, #00D4FF);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-shadow: 0 0 20px rgba(87, 242, 135, 0.3);
            }
            .glow-text-yellow {
                background: -webkit-linear-gradient(45deg, #FEE75C, #ffaa00);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-shadow: 0 0 20px rgba(254, 231, 92, 0.3);
            }
            .key-box {
                background: rgba(0, 0, 0, 0.4);
                border: 2px solid #57F287;
                padding: 20px;
                border-radius: 12px;
                margin: 25px 0;
                box-shadow: 0 0 25px rgba(87, 242, 135, 0.2);
                transition: transform 0.3s;
            }
            .key-box:hover { transform: scale(1.05); box-shadow: 0 0 35px rgba(87, 242, 135, 0.4); }
            .key-box.yellow { border-color: #FEE75C; box-shadow: 0 0 25px rgba(254, 231, 92, 0.2); }
            .key-box.yellow:hover { box-shadow: 0 0 35px rgba(254, 231, 92, 0.4); }
            .key-text {
                font-size: 32px;
                letter-spacing: 3px;
                margin: 0;
                color: #fff;
                font-family: monospace;
                text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
            }
            .desc { color: #ccc; font-size: 14px; margin-bottom: 5px; }
            .warning { font-size: 13px; color: #ff5555; font-weight: 600; margin-top: 25px; padding: 10px; background: rgba(255, 0, 0, 0.1); border-radius: 8px; }
            .footer { margin-top: 20px; font-size: 11px; color: #666; letter-spacing: 1px; }
        </style>
    `;

    try {
        const userKey = await KeyModel.findOne({ owner: userIp }); // Sadece IP arar

        if (userKey) {
            const creationTime = userKey._id.getTimestamp().getTime();
            const elapsedHours = (Date.now() - creationTime) / (1000 * 60 * 60);

            if (elapsedHours >= 24 && userKey.expiry === '24 Saat') {
                await KeyModel.findByIdAndDelete(userKey._id);
            } else {
                const htmlMevcut = `
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>LUAWARE - Active License</title>
                        ${baseCSS}
                    </head>
                    <body>
                        <div class="container">
                            <h1 class="glow-text-yellow">⚠️ Active Key Found</h1>
                            <p class="desc">🇹🇷 Sisteme kayıtlı aktif bir anahtarın zaten bulunuyor.</p>
                            <p class="desc">🇬🇧 You already have an active license key in the system.</p>
                            
                            <div class="key-box yellow">
                                <h2 class="key-text">${userKey.key}</h2>
                            </div>
                            
                            <div class="warning">
                                🇹🇷 24 saatin dolmadan yeni anahtar üretemezsin.<br>
                                🇬🇧 You cannot generate a new key until your 24 hours expire.
                            </div>
                            <div class="footer">LUAWARE SECURITY SYSTEM</div>
                        </div>
                    </body>
                    </html>
                `;
                return res.send(htmlMevcut);
            }
        }

        const part1 = Math.random().toString(36).substr(2, 4).toUpperCase();
        const part2 = Math.random().toString(36).substr(2, 4).toUpperCase();
        const newKeyString = `LUA-USER-${part1}-${part2}`;
        const licenseId = Math.floor(10000 + Math.random() * 90000).toString(); 

        // Veritabanına owner olarak direkt IP kaydediyoruz.
        await new KeyModel({ key: newKeyString, expiry: '24 Saat', owner: userIp, licenseId: licenseId }).save();

        try {
            const OTO_LOG_ID = '1505092320091967498'; 
            const logChannel = client.channels.cache.get(OTO_LOG_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🔑 YENİ REKLAM KEYİ ÜRETİLDİ!')
                    .setColor('#57F287')
                    .setDescription(`Bir kullanıcı LootLabs'ı geçti ve sistem ona özel yepyeni bir anahtar oluşturdu.`)
                    .addFields(
                        { name: '🌐 Kullanıcı IP', value: `||${userIp}||`, inline: true }, 
                        { name: '📜 Key Adı', value: `\`${newKeyString}\``, inline: true },
                        { name: '⏳ Süre', value: `\`24 Saat\``, inline: true }
                    )
                    .setFooter({ text: 'LUAWARE Akıllı Üretim Sistemi' })
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        } catch (logHata) {}

        const htmlYeni = `
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>LUAWARE - Key Generated</title>
                ${baseCSS}
            </head>
            <body>
                <div class="container">
                    <h1 class="glow-text-green">✅ Access Granted</h1>
                    <p class="desc">🇹🇷 Destek olduğun için teşekkürler. İşte 24 saatlik anahtarın:</p>
                    <p class="desc">🇬🇧 Thank you for your support. Here is your 24-hour key:</p>
                    
                    <div class="key-box">
                        <h2 class="key-text">${newKeyString}</h2>
                    </div>
                    
                    <div class="warning">
                        🇹🇷 Bu anahtar HWID sistemine kilitlenecektir. Kimseyle paylaşma!<br><br>
                        🇬🇧 This key will be locked to your HWID. Do not share it!
                    </div>
                    <div class="footer">LUAWARE SECURITY SYSTEM</div>
                </div>
            </body>
            </html>
        `;
        return res.send(htmlYeni);

    } catch (err) {
        console.error("Anahtar Üretim Hatası:", err);
        return res.send(`
            <html lang="en">
            <head>
                <style>body { background: #121212; color: #ff5555; font-family: sans-serif; text-align: center; padding-top: 100px; }</style>
            </head>
            <body>
                <h2>❌ System Error / Sistem Hatası</h2>
                <p>Database connection failed. Please try again later.</p>
            </body>
            </html>
        `);
    }
});

// --- 8. BAŞLATMA VE PORT AYARI ---
app.get('/', (req, res) => res.send('LUAWARE OS ONLINE 🚀'));

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

// =========================================================================
// ⏰ LUAWARE 24 SAATLİK KEY BİTİŞ SİLİCİ
// =========================================================================
setInterval(async () => {
    try {
        const keys = await KeyModel.find({ expiry: '24 Saat' });

        for (const k of keys) {
            const creationTime = k._id.getTimestamp().getTime(); 
            const elapsedHours = (Date.now() - creationTime) / (1000 * 60 * 60);

            if (elapsedHours >= 24) {
                await KeyModel.findByIdAndDelete(k._id);
            }
        }
    } catch (err) {
        console.error("🚨 [Silici Hatası]:", err);
    }
}, 5 * 60 * 1000); 

client.login(process.env.TOKEN);

process.on('unhandledRejection', (reason, promise) => {
    console.log('🚨 [Anti-Crash] İşlenmeyen Hata Engellendi (unhandledRejection):', reason);
});
process.on('uncaughtException', (err, origin) => {
    console.log('🚨 [Anti-Crash] Beklenmeyen Hata Engellendi (uncaughtException):', err);
});
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('🚨 [Anti-Crash] Beklenmeyen Hata Monitörü:', err);
});