const { Client, GatewayIntentBits, Collection } = require('discord.js');
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

// Middleware (Sitenin bota bağlanması için şart)
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

// --- 5. ETKİLEŞİM YAKALAYICI (KOMUTLAR VE BUTONLAR İÇİN) ---
client.on('interactionCreate', async interaction => {
    
    // a. SLASH KOMUTLARI ÇALIŞTIRMA MOTORU
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error("Komut çalışırken hata:", error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ Komut çalıştırılırken bir hata oluştu!', ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Komut çalıştırılırken bir hata oluştu!', ephemeral: true });
            }
        }
    }

    // b. VERIFY BUTONLARI MOTORU (TÜRKÇE VE İNGİLİZCE)
    if (interaction.isButton()) {
        if (interaction.customId === 'verify_tr' || interaction.customId === 'verify_en') {
            const entryRole = '1491450686637080737'; // Kayıtsız (İlk girince verilen) rol
            const verifiedRole = '1491452394087780552'; // Doğrulanmış asıl rol

            const member = interaction.member;

            try {
                // Zaten doğrulanmışsa engelle
                if (member.roles.cache.has(verifiedRole)) {
                    const alreadyMsg = interaction.customId === 'verify_tr' 
                        ? '❌ Zaten doğrulama yapmışsın aslanım!' 
                        : '❌ You are already verified!';
                    return interaction.reply({ content: alreadyMsg, ephemeral: true });
                }

                // Asıl rolü ver, giriş rolünü al
                await member.roles.add(verifiedRole);
                await member.roles.remove(entryRole).catch(() => {});

                // Bayrağa göre mesaj at
                const successMsg = interaction.customId === 'verify_tr' 
                    ? '✅ **Başarıyla Doğrulandın!** Sunucuya tam erişim sağlandı.' 
                    : '✅ **Successfully Verified!** Full access to the server granted.';

                await interaction.reply({ content: successMsg, ephemeral: true });
                console.log(`🛡️ [VERIFY] ${member.user.tag} (${interaction.customId}) üzerinden doğrulandı.`);
            } catch (err) {
                console.error('Verify hatası:', err);
                const errMsg = interaction.customId === 'verify_tr' 
                    ? '❌ Yetkim yetmedi, rol veremedim! Yöneticiye bildir.' 
                    : '❌ Missing permissions to give roles! Contact an admin.';
                await interaction.reply({ content: errMsg, ephemeral: true });
            }
        }
    }
});

// --- 6. WEB API KÖPRÜLERİ (Vercel Sitesi İçin) ---
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
        res.json({ success: true, key: newKey });
    } catch (err) { res.status(500).json({ error: 'Oluşturma hatası' }); }
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