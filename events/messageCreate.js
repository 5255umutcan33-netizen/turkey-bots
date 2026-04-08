const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const AboneChannel = require('../models/aboneChannel'); // Eski SS sistemin

// --- GLOBAL DEĞİŞKENLER (OCR VE SPAM TAKİP) ---
let worker = null;
(async () => { worker = await createWorker('eng'); })();

const spamTracker = new Map();
const dbPath = path.join(__dirname, '../spam-db.json');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        
        // ---------------------------------------------------------
        // 1. WEBHOOK BAŞVURU YAKALAMA OPERASYONU
        // ---------------------------------------------------------
        if (message.webhookId) {
            const embed = message.embeds[0];
            if (embed && embed.footer && embed.footer.text && embed.footer.text.includes('User ID:')) {
                const userId = embed.footer.text.replace('User ID: ', '').trim();
                
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`app_onay_${userId}`).setLabel('Onayla ✅').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`app_red_${userId}`).setLabel('Reddet ❌').setStyle(ButtonStyle.Danger)
                );

                await message.channel.send({ embeds: [embed], components: [row] });
                return message.delete().catch(() => {}); 
            }
            return; 
        }

        // Botların kendi mesajlarını okumasını engelle
        if (message.author.bot) return;

        // ---------------------------------------------------------
        // 2. RYPHERA GUARD: SPAM VE FLOOD KORUMASI (YENİ EKLENDİ)
        // ---------------------------------------------------------
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
        const protectedChannels = JSON.parse(fs.readFileSync(dbPath));

        // Eğer mesaj atılan kanal koruma altındaysa izlemeye al
        if (protectedChannels.includes(message.channel.id)) {
            const userId = message.author.id;
            const userData = spamTracker.get(userId) || { msgCount: 0, timer: null };

            userData.msgCount++;

            if (userData.msgCount >= 5) {
                // 5 Mesajı geçti, affetme!
                try {
                    await message.member.timeout(120000, "Ryphera Guard: Flood/Spam Koruması");
                    const reply = await message.reply(`🚨 <@${userId}>, çok hızlı mesaj atıyorsun! 2 dakika susturuldun.`);
                    setTimeout(() => reply.delete().catch(()=>null), 5000); 
                    
                    await message.channel.bulkDelete(5).catch(()=>null); // O 5 mesajı temizle
                } catch (err) {
                    console.error("Mute atılamadı (Yetki yetersiz olabilir):", err);
                }
                spamTracker.delete(userId); 
                return; // Spam yapıldıysa aşağıdaki SS veya Komut sistemlerine inmesine izin verme
            } else {
                // 5 saniye içinde 5 mesaj atmazsa sicilini temizle
                if (userData.timer) clearTimeout(userData.timer);
                userData.timer = setTimeout(() => {
                    spamTracker.delete(userId);
                }, 5000);

                spamTracker.set(userId, userData);
            }
        }

        // ---------------------------------------------------------
        // 3. BASİT KOMUTLAR (r!yardım)
        // ---------------------------------------------------------
        if (message.content.toLowerCase() === 'r!yardım') {
            const help = new EmbedBuilder()
                .setTitle('💬 RYPHERA OS | YARDIM')
                .setColor('#2B2D31')
                .setDescription(`>>> 👋 **Merhaba <@${message.author.id}>!**\n\n• \`/format\` : Script Tanıtımı\n• \`/trticketkur\` : Türkçe Bilet Sistemi\n• \`r!yardım\` : Bu Menü`)
                .setFooter({ text: 'Ryphera Solutions' });
            return message.reply({ embeds: [help] });
        }

        // ---------------------------------------------------------
        // 4. SS OKUMA SİSTEMİ (TESSERACT)
        // ---------------------------------------------------------
        const channelData = await AboneChannel.findOne({ channelId: message.channelId }).catch(() => null);
        if (!channelData) return;

        const attachment = message.attachments.first();
        if (!attachment || !attachment.contentType.startsWith('image')) return;

        const ROLE_ID = '1490996828974612530';
        const LOG_ID = '1490998881553743932';

        try {
            const { data: { text } } = await worker.recognize(attachment.url);
            const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (clean.includes('ryphera') && (clean.includes('script') || clean.includes('scr1pt'))) {
                await message.member.roles.add(ROLE_ID).catch(() => {});
                const okMsg = await message.reply('`✅ ONAYLANDI: Abone rolünüz verildi.`');
                
                const logChan = client.channels.cache.get(LOG_ID);
                if (logChan) {
                    const log = new EmbedBuilder()
                        .setTitle('ABONE ONAYLANDI')
                        .setColor('#00FF00')
                        .addFields({name:'Kullanıcı', value:`<@${message.author.id}>`})
                        .setImage(attachment.url);
                    logChan.send({ embeds: [log] });
                }
                setTimeout(() => { message.delete().catch(()=>{}); okMsg.delete().catch(()=>{}); }, 4000);
            } else {
                const failMsg = await message.reply('`❌ RED: Ryphera Script ibaresi bulunamadı.`');
                setTimeout(() => { message.delete().catch(()=>{}); failMsg.delete().catch(()=>{}); }, 5000);
            }
        } catch (e) { 
            console.error("SS Okunurken hata:", e); 
        }
    }
};