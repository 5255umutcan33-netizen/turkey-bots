const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const AboneChannel = require('../models/aboneChannel');

// OCR İşçisini Başlat
let worker = null;
(async () => { worker = await createWorker('eng'); })();

const spamTracker = new Map();
const dbPath = path.join(__dirname, '../spam-db.json');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        
        // 1. WEBHOOK BAŞVURU YAKALAMA
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

        if (message.author.bot) return;

        // 2. SPAM VE FLOOD KORUMASI
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
        const protectedChannels = JSON.parse(fs.readFileSync(dbPath));

        if (protectedChannels.includes(message.channel.id)) {
            const userId = message.author.id;
            const userData = spamTracker.get(userId) || { msgCount: 0, timer: null };
            userData.msgCount++;

            if (userData.msgCount >= 5) {
                try {
                    await message.member.timeout(120000, "Ryphera Guard: Spam Protection");
                    const reply = await message.reply(`🚨 <@${userId}>, stop spamming! 2 min mute. / Çok hızlısın, 2 dakika mola.`);
                    setTimeout(() => reply.delete().catch(()=>null), 5000); 
                    await message.channel.bulkDelete(5).catch(()=>null); 
                } catch (err) {}
                spamTracker.delete(userId); 
                return; 
            } else {
                if (userData.timer) clearTimeout(userData.timer);
                userData.timer = setTimeout(() => spamTracker.delete(userId), 5000);
                spamTracker.set(userId, userData);
            }
        }

        // 3. BASİT KOMUTLAR
        if (message.content.toLowerCase() === 'r!yardım') {
            const help = new EmbedBuilder()
                .setTitle('💬 RYPHERA OS | YARDIM')
                .setColor('#2B2D31')
                .setDescription(`>>> 👋 **Merhaba <@${message.author.id}>!**\n\n• \`/format\` : Script Tanıtımı\n• \`/trticketkur\` : Türkçe Bilet Sistemi\n• \`r!yardım\` : Bu Menü`)
                .setFooter({ text: 'Ryphera Solutions' });
            return message.reply({ embeds: [help] });
        }

        // 4. SS OKUMA SİSTEMİ (ONAY/RED/DM/LOG/GİZLEME)
        const channelData = await AboneChannel.findOne({ channelId: message.channelId }).catch(() => null);
        if (!channelData) return;

        const attachment = message.attachments.first();
        if (!attachment || !attachment.contentType.startsWith('image')) return;

        const ROLE_ID = '1490996828974612530'; // Abone Rolü
        const LOG_ID = '1491104204763304166';  // Log Kanalı
        const GIZLE_KANALLAR = ['1491457136159621301', '1491457214974656552']; // Gizlenecekler

        try {
            const { data: { text } } = await worker.recognize(attachment.url);
            const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (clean.includes('ryphera') && (clean.includes('script') || clean.includes('scr1pt'))) {
                
                // ONAYLANDI İŞLEMLERİ
                await message.member.roles.add(ROLE_ID).catch(() => {});
                
                // Kanalları Gizle
                for (const cid of GIZLE_KANALLAR) {
                    const chan = message.guild.channels.cache.get(cid);
                    if (chan) {
                        await chan.permissionOverwrites.edit(message.author.id, { ViewChannel: false }).catch(()=>{});
                    }
                }

                // DM Gönder
                const dmEmbed = new EmbedBuilder()
                    .setTitle('✅ Ryphera OS | Approved')
                    .setDescription('**Your screenshot has been approved!**\nYou have been given the Subscriber role and access has been updated.\n\n**Ekran görüntünüz onaylandı!**\nAbone rolünüz verildi ve erişim izinleriniz güncellendi.')
                    .setColor('#57F287');
                await message.author.send({ embeds: [dmEmbed] }).catch(() => {});

                // Log Kanalına Bildir
                const logChan = client.channels.cache.get(LOG_ID);
                if (logChan) {
                    const log = new EmbedBuilder()
                        .setTitle('📸 SUCCESSFUL VERIFICATION')
                        .setColor('#57F287')
                        .addFields(
                            { name: 'User / Kullanıcı', value: `<@${message.author.id}> (${message.author.tag})`, inline: true },
                            { name: 'Status / Durum', value: '✅ Approved (Onaylandı)', inline: true }
                        )
                        .setImage(attachment.url)
                        .setTimestamp();
                    logChan.send({ embeds: [log] });
                }

                const okMsg = await message.reply('`✅ APPROVED: Role given & channels hidden. / ONAYLANDI: Rol verildi ve kanallar gizlendi.`');
                setTimeout(() => { message.delete().catch(()=>{}); okMsg.delete().catch(()=>{}); }, 4000);

            } else {
                
                // REDDEDİLDİ İŞLEMLERİ
                const dmFail = new EmbedBuilder()
                    .setTitle('❌ Ryphera OS | Rejected')
                    .setDescription('**Verification Failed!**\nRyphera Script text was not found in your screenshot. Please send a valid one.\n\n**Onay Başarısız!**\nEkran görüntüsünde Ryphera Script ibaresi bulunamadı. Lütfen geçerli bir resim atın.')
                    .setColor('#ED4245');
                await message.author.send({ embeds: [dmFail] }).catch(() => {});

                const failMsg = await message.reply('`❌ REJECTED: Ryphera Script text not found. / RED: Ryphera Script ibaresi bulunamadı.`');
                setTimeout(() => { message.delete().catch(()=>{}); failMsg.delete().catch(()=>{}); }, 5000);
            }
        } catch (e) { console.error(e); }
    }
};