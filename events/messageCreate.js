const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const AboneChannel = require('../models/aboneChannel');

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
        // 2. RYPHERA GUARD: SPAM VE FLOOD KORUMASI
        // ---------------------------------------------------------
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
        const protectedChannels = JSON.parse(fs.readFileSync(dbPath));

        if (protectedChannels.includes(message.channel.id)) {
            const userId = message.author.id;
            const userData = spamTracker.get(userId) || { msgCount: 0, timer: null };

            userData.msgCount++;

            if (userData.msgCount >= 5) {
                try {
                    await message.member.timeout(120000, "Ryphera Guard: Flood/Spam Koruması");
                    const reply = await message.reply(`🚨 <@${userId}>, çok hızlı mesaj atıyorsun! 2 dakika susturuldun.`);
                    setTimeout(() => reply.delete().catch(()=>null), 5000); 
                    
                    await message.channel.bulkDelete(5).catch(()=>null); 
                } catch (err) {
                    console.error("Mute atılamadı:", err);
                }
                spamTracker.delete(userId); 
                return; 
            } else {
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
        // 4. SS OKUMA SİSTEMİ (TESSERACT) & KANAL GİZLEME
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
                
                // 1. Abone Rolünü Ver
                await message.member.roles.add(ROLE_ID).catch(() => {});
                
                // 2. Çift Dilli Onay Mesajı
                const okMsg = await message.reply('`✅ APPROVED: Subscriber role granted. / ONAYLANDI: Abone rolünüz verildi.`');
                
                // 3. İstenilen 2 Kanalı Kullanıcıdan Gizle
                const hiddenChannels = ['1491457136159621301', '1491457214974656552'];
                for (const channelId of hiddenChannels) {
                    const hideChannel = message.guild.channels.cache.get(channelId);
                    if (hideChannel) {
                        await hideChannel.permissionOverwrites.edit(message.author.id, {
                            ViewChannel: false // Kanalı Görme yetkisini kapatır
                        }).catch(() => console.log(`Kanal gizlenemedi: ${channelId}`));
                    }
                }

                // 4. Log Kanalına Bildir
                const logChan = client.channels.cache.get(LOG_ID);
                if (logChan) {
                    const log = new EmbedBuilder()
                        .setTitle('ABONE ONAYLANDI / SUB VERIFIED')
                        .setColor('#00FF00')
                        .addFields({name:'Kullanıcı', value:`<@${message.author.id}>`})
                        .setImage(attachment.url);
                    logChan.send({ embeds: [log] });
                }
                
                // Temizlik İşlemi
                setTimeout(() => { message.delete().catch(()=>{}); okMsg.delete().catch(()=>{}); }, 4000);
            } else {
                const failMsg = await message.reply('`❌ RED: Ryphera Script ibaresi bulunamadı. / REJECTED: Ryphera Script text not found.`');
                setTimeout(() => { message.delete().catch(()=>{}); failMsg.delete().catch(()=>{}); }, 5000);
            }
        } catch (e) { 
            console.error("SS Okunurken hata:", e); 
        }
    }
};