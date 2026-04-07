const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const { createWorker } = require('tesseract.js');
require('dotenv').config();

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent 
    ]
});

// --- AYARLAR ---
const OWNER_ID = "938061453473136660"; // KANKA BURAYA KENDİ ID'Nİ YAZDIĞINDAN EMİN OL!

// --- 1. MODELLER ---
const keySchema = new mongoose.Schema({
    key: String, hwid: { type: String, default: null }, createdBy: String, createdAt: { type: Date, default: Date.now }
});
const RypheraKey = mongoose.models.RypheraKey || mongoose.model('RypheraKey', keySchema);

const channelSchema = new mongoose.Schema({ channelId: String, lang: String });
const AboneChannel = mongoose.models.AboneChannel || mongoose.model('AboneChannel', channelSchema);

// --- 2. OCR MOTORU ---
let worker = null;
(async () => {
    worker = await createWorker('eng+tur');
    console.log('✅ [OCR] Tarayıcı hazır.');
})();

const processing = new Set();

// --- 3. DB BAĞLANTISI ---
mongoose.connect(process.env.MONGO_URI).then(() => console.log('✅ [DB] Bağlandı.'));

// --- 4. MESSAGE CREATE (ABONE SİSTEMİ) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || processing.has(message.id)) return;
    const channelData = await AboneChannel.findOne({ channelId: message.channelId });
    if (!channelData) return;
    const attachment = message.attachments.first();
    if (!attachment || !attachment.contentType.startsWith('image')) return;

    processing.add(message.id);
    const isEn = channelData.lang === 'en';
    const ROLE_ID = '1490996828974612530';
    const LOG_ID = '1490998881553743932';

    const pMsg = await message.reply(isEn ? '`⚡ Analyzing...`' : '`⚡ Analiz ediliyor...`');

    try {
        const { data: { text } } = await worker.recognize(attachment.url);
        const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
        const hasRyphera = cleanText.includes('ryphera');
        const hasScript = cleanText.includes('script') || cleanText.includes('scr1pt') || cleanText.includes('scrpt');

        if (hasRyphera && hasScript) {
            await message.member.roles.add(ROLE_ID).catch(() => {});
            await pMsg.edit(isEn ? '`✅ VERIFIED!`' : '`✅ ONAYLANDI!`');
            try { await message.author.send(isEn ? '🚀 Verified!' : '🚀 Onaylandın!'); } catch (e) {}
            const logCh = message.guild.channels.cache.get(LOG_ID);
            if (logCh) {
                const log = new EmbedBuilder().setTitle('✅ ONAY').setColor('#00FF00').addFields({name:'User', value:`<@${message.author.id}>`}).setImage(attachment.url);
                logCh.send({ embeds: [log] });
            }
        } else {
            await pMsg.edit(isEn ? '`❌ FAILED!`' : '`❌ BAŞARISIZ!`');
        }
    } catch (e) { await pMsg.edit('`ERROR`'); }

    setTimeout(async () => {
        try { await message.delete(); await pMsg.delete(); } catch (e) {}
        processing.add(message.id);
    }, 5000);
});

// --- 5. INTERACTION CREATE (STAT, KEY, YETKİ) ---
client.on('interactionCreate', async (interaction) => {
    // A. SLASH KOMUTLAR
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // /STAT KOMUTU
        if (commandName === 'stat') {
            const total = interaction.guild.memberCount;
            const bots = interaction.guild.members.cache.filter(m => m.user.bot).size;
            const keys = await RypheraKey.countDocuments({});
            
            const statEmbed = new EmbedBuilder()
                .setTitle('📊 RYPHERA İSTATİSTİK')
                .setColor('#FF0000')
                .addFields(
                    { name: '👥 Üyeler', value: `Toplam: \`${total}\` | Bot: \`${bots}\``, inline: true },
                    { name: '🔑 Lisans', value: `Aktif Key: \`${keys}\``, inline: true },
                    { name: '👑 Kurucu', value: `<@${OWNER_ID}>`, inline: false }
                );
            return interaction.reply({ embeds: [statEmbed] });
        }

        // KURULUM KOMUTLARI
        if (commandName === 'trabonekur') {
            await AboneChannel.findOneAndUpdate({ channelId: interaction.channelId }, { lang: 'tr' }, { upsert: true });
            return interaction.reply('✅ `TR Ayarlandı.`');
        }
        if (commandName === 'engaboness') {
            await AboneChannel.findOneAndUpdate({ channelId: interaction.channelId }, { lang: 'en' }, { upsert: true });
            return interaction.reply('✅ `EN Ayarlandı.`');
        }
    }

    // B. BUTONLAR
    if (interaction.isButton()) {
        const cid = interaction.customId;

        // KEY SİLME (YETKİ KONTROLÜ BURADA)
        if (cid === 'confirm_delete_all') {
            // DEBUG LOG: Kim girmeye çalışıyor?
            console.log(`[YETKİ DENETİMİ] Gelen ID: ${interaction.user.id} | Beklenen ID: ${OWNER_ID}`);

            if (String(interaction.user.id) !== String(OWNER_ID)) {
                return interaction.reply({ content: `\`❌ HATA: Yetkin yok! (Senin ID: ${interaction.user.id})\``, ephemeral: true });
            }

            await RypheraKey.deleteMany({});
            return interaction.update({ content: '`✅ Tüm keyler silindi!`', embeds: [], components: [] });
        }

        // KEY ALMA
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            const existing = await RypheraKey.findOne({ createdBy: interaction.user.id });
            if (existing) return interaction.reply({ content: `\`Key: ${existing.key}\``, ephemeral: true });

            const rypKey = `RYP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            await new RypheraKey({ key: rypKey, createdBy: interaction.user.id }).save();
            try {
                await interaction.user.send(`🚀 Key: \`${rypKey}\``);
                return interaction.reply({ content: '`DM kutuna bak!`', ephemeral: true });
            } catch (e) { return interaction.reply({ content: '`DM kapalı!`', ephemeral: true }); }
        }
    }
});

app.get('/', (req, res) => res.send('ONLINE 🚀'));
app.listen(process.env.PORT || 10000);
client.login(process.env.TOKEN);