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

// 🚨 GİF VE MÜZİK İÇİN PUBLIC KLASÖRÜ AÇIK
app.use(express.static('public'));

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
// 4. LUAWARE KÖPRÜ (COOKIE SİSTEMİ) VE V1 PREMIUM WEB ARAYÜZÜ
// ==========================================

app.get('/basla', (req, res) => {
    const userId = req.query.userid; 
    if (userId) {
        res.cookie('luaware_userid', userId, { maxAge: 3600000, httpOnly: true }); 
    }
    res.redirect('https://lootdest.org/s?ZYoyDZKM'); 
});

app.get('/key-al', async (req, res) => {
    const userId = (req.cookies && req.cookies.luaware_userid) ? req.cookies.luaware_userid : req.query.userid; 
    let userIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || 'Bilinmeyen-IP';
    if (typeof userIp === 'string' && userIp.includes(',')) userIp = userIp.split(',')[0].trim(); 

    // 💎 ULTRA PREMIUM GLASSMORPHISM TASARIMI (V1)
    const baseCSS = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;500;700&display=swap');
            @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
            
            body { background: #050505; color: #e0e0e0; font-family: 'Inter', sans-serif; margin: 0; height: 100vh; display: flex; justify-content: center; align-items: center; overflow: hidden; }
            
            /* GİF VE ARKA PLAN (Daha Zarif) */
            .bg-gif { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: url('/giphy.gif'); background-size: cover; background-position: center; z-index: -2; opacity: 0.25; filter: grayscale(30%); }
            .bg-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background: radial-gradient(circle at center, rgba(15, 15, 20, 0.4) 0%, rgba(5, 5, 5, 0.95) 100%); }

            /* GİRİŞ ANİMASYONU */
            #entrance-loader { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #050505; display: flex; justify-content: center; align-items: center; z-index: 9999; animation: fadeOutLoader 1.5s forwards 1.8s; pointer-events: none; }
            #entrance-loader h1 { color: #ffffff; font-family: 'Inter', sans-serif; font-weight: 300; font-size: 3em; letter-spacing: 12px; opacity: 0; animation: fadeInText 1s forwards 0.3s; text-align: center; }
            #entrance-loader h1 span { font-weight: 700; color: #fff; }
            
            @keyframes fadeOutLoader { 100% { opacity: 0; visibility: hidden; } }
            @keyframes fadeInText { 100% { opacity: 1; transform: scale(1.02); } }

            /* TIKLA VE BAŞLA EKRANI */
            #click-to-start { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); z-index: 9998; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer; opacity: 0; visibility: hidden; transition: opacity 0.5s; }
            #click-to-start.show { opacity: 1; visibility: visible; }
            .click-text { font-size: 24px; font-weight: 500; letter-spacing: 4px; color: #ffffff; animation: breathe 2s infinite ease-in-out; text-align: center; }
            .click-sub { font-size: 14px; color: #888; margin-top: 10px; font-weight: 300; letter-spacing: 2px; }
            @keyframes breathe { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

            /* SAĞ ÜST MÜZİK BUTONU */
            .music-btn { position: fixed; top: 25px; right: 25px; z-index: 9999; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 12px 16px; border-radius: 50%; cursor: pointer; transition: 0.3s; display: none; font-size: 18px; backdrop-filter: blur(5px); }
            .music-btn:hover { background: rgba(255,255,255,0.15); transform: scale(1.1); }

            /* ANA PANEL KUTUSU (GLASSMORPHISM) */
            .container { background: rgba(20, 20, 25, 0.45); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 50px 40px; text-align: center; box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6); max-width: 500px; width: 90%; opacity: 0; transform: translateY(20px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); display: none; }
            .container.show { opacity: 1; transform: translateY(0); display: block; }
            
            h1.title { margin-top: 0; font-weight: 700; font-size: 28px; color: #ffffff; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 10px; }
            .success-icon { color: #4ade80; }
            .warning-icon { color: #facc15; }
            .error-icon { color: #f87171; }
            
            /* KEY KUTUSU (Zarif Cam Tasarım) */
            .key-box { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 16px; margin: 30px 0; position: relative; overflow: hidden; }
            .key-box::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #4ade80, transparent); }
            .key-box.yellow::before { background: linear-gradient(90deg, transparent, #facc15, transparent); }
            
            .key-label { margin: 0 0 5px 0; color: #888; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500; }
            .key-text { font-size: 24px; letter-spacing: 1px; margin: 0; color: #ffffff; font-family: 'Courier New', monospace; font-weight: 700; }
            
            .divider { height: 1px; background: rgba(255, 255, 255, 0.05); margin: 20px 0; }
            
            .desc { color: #a0a0a0; font-size: 14px; margin-bottom: 10px; line-height: 1.6; font-weight: 300; }
            .warning-text { color: #f87171; font-size: 12px; font-weight: 500; margin-top: 15px; }
            
            /* SOSYAL MEDYA BUTONLARI (Zarif ve Temiz) */
            .social-container { display: flex; justify-content: center; gap: 15px; margin-top: 30px; }
            .social-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; border-radius: 12px; text-decoration: none; font-weight: 500; font-size: 14px; transition: all 0.3s ease; width: 100%; color: #fff; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); }
            .social-btn:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-2px); }
            .btn-yt:hover { border-color: rgba(255, 0, 0, 0.5); box-shadow: 0 5px 15px rgba(255, 0, 0, 0.15); }
            .btn-dc:hover { border-color: rgba(88, 101, 242, 0.5); box-shadow: 0 5px 15px rgba(88, 101, 242, 0.15); }
            
            .footer { margin-top: 35px; font-size: 11px; color: #555; letter-spacing: 3px; font-weight: 500; }
        </style>
    `;

    const interactionScript = `
        <script>
            document.addEventListener("DOMContentLoaded", () => {
                const clickScreen = document.getElementById("click-to-start");
                const container = document.querySelector(".container");
                const bgMusic = document.getElementById("bg-music");
                const musicBtn = document.getElementById("music-toggle");
                const musicIcon = document.getElementById("music-icon");

                setTimeout(() => { clickScreen.classList.add("show"); }, 3300);

                clickScreen.addEventListener("click", () => {
                    clickScreen.classList.remove("show");
                    container.classList.add("show");
                    musicBtn.style.display = "block";
                    bgMusic.volume = 0.3;
                    bgMusic.play().catch(e => console.log("Ses oynatılamadı:", e));
                });

                musicBtn.addEventListener("click", () => {
                    if (bgMusic.paused) {
                        bgMusic.play();
                        musicIcon.className = "fa-solid fa-volume-high";
                    } else {
                        bgMusic.pause();
                        musicIcon.className = "fa-solid fa-volume-xmark";
                    }
                });
            });
        </script>
    `;

    const loadingHTML = `
        <div id="entrance-loader"><h1>LUAWARE <span>V1</span></h1></div>
        <div id="click-to-start">
            <div class="click-text">SİSTEME GİRİŞ YAP</div>
            <div class="click-sub">Click anywhere to start</div>
        </div>
        <div class="bg-gif"></div><div class="bg-overlay"></div>
        <audio id="bg-music" loop><source src="/music.mp3" type="audio/mpeg"></audio>
        <button id="music-toggle" class="music-btn"><i id="music-icon" class="fa-solid fa-volume-high"></i></button>
    `;

    if (!userId) {
        return res.send(`
            <html lang="en">
            <head><title>LUAWARE - Error</title>${baseCSS}</head>
            <body>
                ${loadingHTML}
                <div class="container">
                    <h1 class="title"><i class="fa-solid fa-triangle-exclamation error-icon"></i> Bağlantı Hatası</h1>
                    <p class="desc">Güvenlik bağlantısı koptu veya oturum zaman aşımına uğradı. Lütfen Discord üzerinden "Get Key" butonuna tekrar tıklayın.</p>
                </div>
                ${interactionScript}
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
                        ${loadingHTML}
                        <div class="container">
                            <h1 class="title"><i class="fa-solid fa-shield-halved warning-icon"></i> Aktif Lisans</h1>
                            <p class="desc">Sisteme kayıtlı 24 saatlik aktif bir lisans anahtarınız zaten bulunuyor.</p>
                            
                            <div class="key-box yellow">
                                <p class="key-label">LİSANS ANAHTARI</p>
                                <h2 class="key-text">${userKey.key}</h2>
                                <div class="divider"></div>
                                <p class="key-label">LİSANS ID</p>
                                <h2 class="key-text" style="color: #facc15;">#${userKey.licenseId || '00000'}</h2>
                            </div>

                            <div class="social-container">
                                <a href="https://discord.gg/luaware" class="social-btn btn-dc" target="_blank"><i class="fa-brands fa-discord"></i> Discord</a>
                                <a href="https://www.youtube.com/@LuawareScrpt" class="social-btn btn-yt" target="_blank"><i class="fa-brands fa-youtube"></i> YouTube</a>
                            </div>
                            <div class="footer">LUAWARE OS V1</div>
                        </div>
                        ${interactionScript}
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

        try {
            const dUser = await client.users.fetch(userId).catch(() => null);
            if (dUser) {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🎉 LUAWARE | Lisansınız Hazır!')
                    .setColor('#2B2D31')
                    .setDescription(`🇹🇷 **Merhaba <@${userId}>**, işleminiz başarıyla tamamlandı.\n🇬🇧 **Hello <@${userId}>**, your process is successfully completed.\n\n🔑 **Key / Anahtar:** \`${newKeyString}\`\n🆔 **Key ID:** \`#${licenseId}\`\n⏳ **Time / Süre:** \`24 Saat/Hours\`\n\n📌 *Bu ID'yi Discord üzerinden HWID sıfırlamak için kullanabilirsiniz.*`)
                    .setFooter({ text: 'LUAWARE OS V1' })
                    .setTimestamp();
                await dUser.send({ embeds: [dmEmbed] }).catch(() => {});
            }
        } catch(e) {}

        return res.send(`
            <html lang="en">
            <head><title>LUAWARE - Key Generated</title>${baseCSS}</head>
            <body>
                ${loadingHTML}
                <div class="container">
                    <h1 class="title"><i class="fa-solid fa-check-circle success-icon"></i> Lisans Oluşturuldu</h1>
                    <p class="desc">İşleminiz başarıyla tamamlandı. Özel lisans anahtarınız Discord DM kutunuza da iletilmiştir.</p>
                    
                    <div class="key-box">
                        <p class="key-label">LİSANS ANAHTARI</p>
                        <h2 class="key-text">${newKeyString}</h2>
                        <div class="divider"></div>
                        <p class="key-label">LİSANS ID</p>
                        <h2 class="key-text" style="color: #4ade80;">#${licenseId}</h2>
                    </div>

                    <p class="warning-text">Lütfen anahtarınızı yetkililer dahil kimseyle paylaşmayınız. Anahtar ilk girildiği cihaza kilitlenir.</p>

                    <div class="social-container">
                        <a href="https://discord.gg/luaware" class="social-btn btn-dc" target="_blank"><i class="fa-brands fa-discord"></i> Discord</a>
                        <a href="https://www.youtube.com/@LuawareScrpt" class="social-btn btn-yt" target="_blank"><i class="fa-brands fa-youtube"></i> YouTube</a>
                    </div>
                    
                    <div class="footer">LUAWARE OS V1</div>
                </div>
                ${interactionScript}
            </body>
            </html>
        `);

    } catch (err) {
        return res.send(`<html lang="en"><body style="background:#050505;color:#f87171;text-align:center;padding-top:100px;font-family:sans-serif;"><h2>❌ Sistem Hatası</h2></body></html>`);
    }
});

app.get('/', (req, res) => res.send('LUAWARE OS V1 ONLINE 🚀'));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 [🌐 Sunucu] Port ${PORT} üzerinde aktif.`));

client.once('ready', async () => {
    console.log(`🚀 [🤖 Bot] Aktif: ${client.user.tag}`);
    try {
        await client.application.commands.set(commandsArray);
        console.log('✅ Slash Komutları Kaydedildi!');
    } catch (error) { console.error('❌ Kayıt hatası:', error); }
});

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

process.on('unhandledRejection', (reason, promise) => { console.log('🚨 [Anti-Crash] İşlenmeyen Hata Engellendi (unhandledRejection):', reason); });
process.on('uncaughtException', (err, origin) => { console.log('🚨 [Anti-Crash] Beklenmeyen Hata Engellendi (uncaughtException):', err); });
process.on('uncaughtExceptionMonitor', (err, origin) => { console.log('🚨 [Anti-Crash] Beklenmeyen Hata Monitörü:', err); });