const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser'); 
require('dotenv').config();

// ==========================================
// 1. MODELLER VE SUNUCU/BOT BAŞLATMA
// ==========================================
const KeyModel = require('./models/key.js'); 

const app = express();
app.set('trust proxy', true); 

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
app.use(cookieParser()); 

client.commands = new Collection();
const commandsArray = [];

// ==========================================
// 2. VERİTABANI VE KOMUT/EVENT YÜKLEYİCİ
// ==========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ [DB] MongoDB Bağlantısı Başarılı!'))
    .catch(err => console.error('❌ [DB] Bağlantı Hatası:', err));

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

// ==========================================
// 3. ROBLOX API KÖPRÜLERİ (EXECUTOR & PANEL)
// ==========================================
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
        const licenseId = Math.floor(10000 + Math.random() * 90000).toString();
        const newKey = new KeyModel({ key: keyName, expiry: expiry || 'Sınırsız', hwid: null, owner: userId, licenseId: licenseId });
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

app.get('/verify', async (req, res) => {
    const { key, hwid } = req.query;
    if (!key || !hwid) return res.json({ success: false, message: "EKSİK VERİ!" });
    try {
        const data = await KeyModel.findOne({ key: key });
        if (!data) return res.json({ success: false, message: "GEÇERSİZ KEY VEYA SÜRESİ DOLMUŞ!" });

        if (data.expiry === '24 Saat') {
            const creationTime = data._id.getTimestamp().getTime();
            if (Date.now() - creationTime >= 24 * 60 * 60 * 1000) {
                await KeyModel.findByIdAndDelete(data._id);
                return res.json({ success: false, message: "SÜRESİ DOLMUŞ!" });
            }
        }
        
        if (key.includes('FREE')) return res.json({ success: true, message: "BAŞARILI" });

        if (data.hwid && data.hwid !== hwid) return res.json({ success: false, message: "HWID KİLİDİ! BAŞKA CİHAZDA KULLANILAMAZ." });
        if (!data.hwid) { data.hwid = hwid; await data.save(); }
        return res.json({ success: true, message: "BAŞARILI" });
    } catch (e) { return res.json({ success: false, message: "SUNUCU HATASI" }); }
});

// ==========================================
// 4. LUAWARE KÖPRÜ (COOKIE SİSTEMİ) VE YENİ WEB ARAYÜZÜ
// ==========================================

// KÖPRÜ
app.get('/basla', (req, res) => {
    const userId = req.query.userid; 
    if (userId) {
        res.cookie('luaware_userid', userId, { maxAge: 3600000, httpOnly: true }); 
    }
    res.redirect('https://lootdest.org/s?ZYoyDZKM'); 
});

// HEDEF (V1 - TR/EN - Animasyonsuz)
app.get('/key-al', async (req, res) => {
    const userId = (req.cookies && req.cookies.luaware_userid) ? req.cookies.luaware_userid : req.query.userid; 
    let userIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || 'Bilinmeyen-IP';
    if (typeof userIp === 'string' && userIp.includes(',')) userIp = userIp.split(',')[0].trim(); 

    const baseCSS = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
            @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
            body { background: #07051a; color: #fff; font-family: 'Poppins', sans-serif; margin: 0; height: 100vh; display: flex; justify-content: center; align-items: center; overflow: hidden; }
            .bg-animation { position: absolute; width: 100%; height: 100%; z-index: -1; background: radial-gradient(circle at center, #1a1543 0%, #07051a 100%); }
            .container { background: rgba(20, 18, 40, 0.7); backdrop-filter: blur(15px); border: 1px solid rgba(87, 242, 135, 0.2); border-radius: 20px; padding: 40px; text-align: center; box-shadow: 0 10px 50px rgba(0, 0, 0, 0.8); max-width: 550px; width: 90%; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            @keyframes popIn { 0% { opacity: 0; transform: scale(0.8) translateY(30px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
            h1 { margin-top: 0; font-weight: 800; font-size: 32px; }
            .glow-text-green { color: #57F287; text-shadow: 0 0 20px rgba(87, 242, 135, 0.5); }
            .glow-text-yellow { color: #FEE75C; text-shadow: 0 0 20px rgba(254, 231, 92, 0.5); }
            .glow-text-red { color: #ff416c; text-shadow: 0 0 20px rgba(255, 65, 108, 0.5); }
            .key-box { background: rgba(0, 0, 0, 0.6); border: 2px dashed #57F287; padding: 25px; border-radius: 12px; margin: 30px 0; box-shadow: inset 0 0 20px rgba(87, 242, 135, 0.1); }
            .key-box.yellow { border-color: #FEE75C; box-shadow: inset 0 0 20px rgba(254, 231, 92, 0.1); }
            .key-text { font-size: 28px; letter-spacing: 2px; margin: 0; color: #fff; font-family: monospace; font-weight: bold; }
            .key-id { font-size: 22px; color: #FEE75C; margin-top: 15px; }
            .desc { color: #b3b0c4; font-size: 15px; margin-bottom: 10px; line-height: 1.5; }
            .social-container { display: flex; justify-content: center; gap: 15px; margin-top: 25px; }
            .social-btn { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 25px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.3s; width: 100%; color: #fff; }
            .btn-yt { background: linear-gradient(45deg, #ff0000, #cc0000); box-shadow: 0 5px 15px rgba(255, 0, 0, 0.3); }
            .btn-yt:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(255, 0, 0, 0.5); }
            .btn-dc { background: linear-gradient(45deg, #5865F2, #4752C4); box-shadow: 0 5px 15px rgba(88, 101, 242, 0.3); }
            .btn-dc:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(88, 101, 242, 0.5); }
            .footer { margin-top: 30px; font-size: 12px; color: #5a5675; letter-spacing: 2px; text-transform: uppercase; }
        </style>
    `;

    if (!userId) {
        return res.send(`
            <html lang="en">
            <head><title>LUAWARE - Error</title>${baseCSS}</head>
            <body>
                <div class="bg-animation"></div>
                <div class="container">
                    <h1 class="glow-text-red"><i class="fa-solid fa-triangle-exclamation"></i> Error / Hata</h1>
                    <p class="desc">🇹🇷 Güvenlik bağlantısı koptu. Lütfen Discord'dan tekrar butona tıklayın.<br>🇬🇧 Security connection lost. Please click the button on Discord again.</p>
                </div>
            </body>
            </html>
        `);
    }

    try {
        const userKey = await KeyModel.findOne({ owner: userId });

        if (userKey) {
            const creationTime = userKey._id.getTimestamp().getTime();
            const elapsedHours = (Date.now() - creationTime) / (1000 * 60 * 60);

            if (elapsedHours >= 24 && userKey.expiry === '24 Saat') {
                await KeyModel.findByIdAndDelete(userKey._id);
            } else {
                return res.send(`
                    <html lang="en">
                    <head><title>LUAWARE - Active License</title>${baseCSS}</head>
                    <body>
                        <div class="bg-animation"></div>
                        <div class="container">
                            <h1 class="glow-text-yellow"><i class="fa-solid fa-shield-halved"></i> Active License</h1>
                            <p class="desc">🇹🇷 Sisteme kayıtlı aktif bir anahtarın zaten bulunuyor.<br>🇬🇧 You already have an active license key.</p>
                            <div class="key-box yellow">
                                <p style="margin:0; color:#FEE75C; font-size:12px;">KEY / ANAHTAR</p>
                                <h2 class="key-text">${userKey.key}</h2>
                                <hr style="border-color: rgba(254,231,92,0.2); margin: 15px 0;">
                                <p style="margin:0; color:#FEE75C; font-size:12px;">KEY ID</p>
                                <h2 class="key-text key-id">#${userKey.licenseId || '00000'}</h2>
                            </div>
                            <div class="social-container">
                                <a href="https://discord.gg/luaware" class="social-btn btn-dc" target="_blank"><i class="fa-brands fa-discord"></i> Discord</a>
                                <a href="https://www.youtube.com/@LuawareScrpt" class="social-btn btn-yt" target="_blank"><i class="fa-brands fa-youtube"></i> YouTube</a>
                            </div>
                            <div class="footer">LUAWARE SECURITY SYSTEM V1</div>
                        </div>
                    </body>
                    </html>
                `);
            }
        }

        const part1 = Math.random().toString(36).substr(2, 4).toUpperCase();
        const part2 = Math.random().toString(36).substr(2, 4).toUpperCase();
        const newKeyString = `LUA-USER-${part1}-${part2}`;
        const licenseId = Math.floor(10000 + Math.random() * 90000).toString(); 

        await new KeyModel({ key: newKeyString, expiry: '24 Saat', owner: userId, licenseId: licenseId }).save();
        res.clearCookie('luaware_userid'); 

        // OTO-DM TR/EN DESTEKLİ
        try {
            const dUser = await client.users.fetch(userId).catch(() => null);
            if (dUser) {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🎉 LUAWARE | Key Generated / Anahtar Üretildi')
                    .setColor('#57F287')
                    .setDescription(`🇹🇷 **Merhaba <@${userId}>**, başarıyla reklamı geçtin ve anahtarın üretildi!\n🇬🇧 **Hello <@${userId}>**, you successfully passed the ad and your key is generated!\n\n🔑 **Key / Anahtar:** \`${newKeyString}\`\n🆔 **Key ID:** \`#${licenseId}\`\n⏳ **Time / Süre:** \`24 Saat/Hours\`\n\n📌 *🇹🇷 Bu ID'yi Discord üzerinden HWID sıfırlamak için kullanabilirsin.*\n📌 *🇬🇧 You can use this ID to reset your HWID on Discord.*`)
                    .setFooter({ text: 'LUAWARE Auto-Delivery V1' })
                    .setTimestamp();
                await dUser.send({ embeds: [dmEmbed] }).catch(() => {});
            }
        } catch(e) {}

        return res.send(`
            <html lang="en">
            <head><title>LUAWARE - Key Generated</title>${baseCSS}</head>
            <body>
                <div class="bg-animation"></div>
                <div class="container">
                    <h1 class="glow-text-green"><i class="fa-solid fa-check-circle"></i> Success / Başarılı</h1>
                    <p class="desc">🇹🇷 Anahtarın üretildi ve Discord DM kutuna gönderildi.<br>🇬🇧 Your key is generated and sent to your Discord DM.</p>
                    
                    <div class="key-box">
                        <p style="margin:0; color:#57F287; font-size:12px;">KEY / ANAHTAR</p>
                        <h2 class="key-text">${newKeyString}</h2>
                        <hr style="border-color: rgba(87,242,135,0.2); margin: 15px 0;">
                        <p style="margin:0; color:#FEE75C; font-size:12px;">KEY ID</p>
                        <h2 class="key-text key-id">#${licenseId}</h2>
                    </div>

                    <p class="desc" style="color: #ff5555; font-size: 13px;">⚠️ 🇹🇷 Bu anahtar HWID kilitlidir. Paylaşmayın!<br>🇬🇧 This key is HWID locked. Do not share!</p>

                    <div class="social-container">
                        <a href="https://discord.gg/luaware" class="social-btn btn-dc" target="_blank"><i class="fa-brands fa-discord"></i> Discord</a>
                        <a href="https://www.youtube.com/@LuawareScrpt" class="social-btn btn-yt" target="_blank"><i class="fa-brands fa-youtube"></i> YouTube</a>
                    </div>
                    
                    <div class="footer">LUAWARE SECURITY SYSTEM V1</div>
                </div>
            </body>
            </html>
        `);

    } catch (err) {
        return res.send(`<html lang="en"><body style="background:#07051a;color:#ff5555;text-align:center;padding-top:100px;font-family:sans-serif;"><h2>❌ System Error</h2></body></html>`);
    }
});

app.get('/', (req, res) => res.send('LUAWARE OS ONLINE 🚀'));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 [🌐 Sunucu] Port ${PORT} üzerinde aktif.`));

client.once('ready', async () => {
    console.log(`🚀 [🤖 Bot] Aktif: ${client.user.tag}`);
    try {
        await client.application.commands.set(commandsArray);
        console.log('✅ Slash Komutları Kaydedildi!');
    } catch (error) { console.error('❌ Kayıt hatası:', error); }
});

// =========================================================================
// 5. SUNUCUDAN ÇIKANIN KEYİNİ ANINDA SİLME (ANTI-LEAVE SİSTEMİ)
// =========================================================================
client.on('guildMemberRemove', async (member) => {
    try {
        const deletedKey = await KeyModel.findOneAndDelete({ owner: member.id });
        if (deletedKey) {
            console.log(`🚨 [ANTI-LEAVE] ${member.user.tag} sunucudan çıktı, lisansı imha edildi!`);
            const OTO_LOG_ID = '1505092320091967498'; 
            const logChannel = member.guild.channels.cache.get(OTO_LOG_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🚪 LİSANS İPTAL EDİLDİ!')
                    .setColor('#ED4245')
                    .setDescription(`Bir kullanıcı sunucudan ayrıldığı için aktif lisansı anında imha edildi.`)
                    .addFields(
                        { name: '👤 Kaçak Kullanıcı', value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true },
                        { name: '🗑️ Silinen Key', value: `\`${deletedKey.key}\``, inline: true }
                    )
                    .setFooter({ text: 'LUAWARE Anti-Leave System' })
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
    } catch (err) { console.error("🚨 [Anti-Leave Hatası]:", err); }
});

// =========================================================================
// 6. LUAWARE 24 SAATLİK KEY BİTİŞ HATIRLATICISI VE OTO-SİLİCİ
// =========================================================================
setInterval(async () => {
    try {
        const keys = await KeyModel.find({ expiry: '24 Saat' });

        for (const k of keys) {
            const creationTime = k._id.getTimestamp().getTime(); 
            const elapsedHours = (Date.now() - creationTime) / (1000 * 60 * 60);

            if (elapsedHours >= 24) {
                await KeyModel.findByIdAndDelete(k._id);
                continue; 
            }

            if (elapsedHours >= 23 && elapsedHours < 24 && !k.notifiedBeforeExpiry) {
                if (/^\d{17,20}$/.test(k.owner)) {
                    const discordUser = await client.users.fetch(k.owner).catch(() => null);
                    if (discordUser) {
                        const reminderEmbed = new EmbedBuilder()
                            .setTitle('⚠️ LUAWARE | Anahtarının Süresi Bitmek Üzere!')
                            .setColor('#FEE75C')
                            .setDescription(
                                `👋 Merhaba <@${k.owner}>,\n\nSistemden aldığın **24 Saatlik** ücretsiz LUAWARE hile anahtarının süresi **1 saat içinde dolacak.**\n\n` +
                                `Oyun keyfinin yarıda kesilmemesi ve hilenin kapanmaması için süren bittiğinde **Lisans Merkezi** kanalından yeni bir reklam geçerek taze bir anahtar oluşturabilirsin!\n\n` +
                                `🔑 **Mevcut Anahtarın:** \`${k.key}\``
                            )
                            .setFooter({ text: 'LUAWARE Otomatik Hatırlatıcı Sistemi' })
                            .setTimestamp();

                        await discordUser.send({ embeds: [reminderEmbed] }).catch(() => {});
                    }
                }
                await KeyModel.findByIdAndUpdate(k._id, { $set: { notifiedBeforeExpiry: true } });
            }
        }
    } catch (err) { console.error("🚨 [Hatırlatıcı/Silici Hatası]:", err); }
}, 5 * 60 * 1000); 

// ==========================================
// 7. ANTI-CRASH (ÇÖKME ÖNLEYİCİ)
// ==========================================
client.login(process.env.TOKEN);
process.on('unhandledRejection', (reason, promise) => { console.log('🚨 [Anti-Crash] İşlenmeyen Hata Engellendi (unhandledRejection):', reason); });
process.on('uncaughtException', (err, origin) => { console.log('🚨 [Anti-Crash] Beklenmeyen Hata Engellendi (uncaughtException):', err); });
process.on('uncaughtExceptionMonitor', (err, origin) => { console.log('🚨 [Anti-Crash] Beklenmeyen Hata Monitörü:', err); });