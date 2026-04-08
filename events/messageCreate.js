const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const AboneChannel = require('../models/aboneChannel');

// OCR İşçisini Başlat
let worker = null;
(async () => { 
    worker = await createWorker('eng'); 
    console.log("🤖 [SİSTEM] OCR Motoru ateşlendi.");
})();

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
                    await message.member.timeout(120000, "Ryphera Guard: Spam Protection");
                    const reply = await message.reply(`🚨 <@${userId}>, stop spamming! 2 min mute. / Çok hızlısın, 2 dakika susturuldun.`);
                    setTimeout(() => reply.delete().catch(()=>null), 5000); 
                    await message.channel.bulkDelete(5).catch(()=>null); 
                } catch (err) {
                    console.error("Mute hatası:", err);
                }
                spamTracker.delete(userId); 
                return; 
            } else {
                if (userData.timer) clearTimeout(userData.timer);
                userData.timer = setTimeout(() => spamTracker.delete(userId), 5000);
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
        // 4. SS OKUMA SİSTEMİ (GELİŞMİŞ EŞLEŞTİRME VE LOGLAMA)
        // ---------------------------------------------------------
        const channelData = await AboneChannel.findOne({ channelId: message.channelId }).catch(() => null);
        if (!channelData) return;

        const attachment = message.attachments.first();
        if (!attachment || !attachment.contentType.startsWith('image')) return;

        // --- SABİT ID AYARLARI ---
        const ROLE_ID = '1490996828974612530'; // Abone Rolü
        const LOG_ID = '1491104204763304166';  // Log Kanalı 
        const GIZLE_KANALLAR = [
            '1491457136159621301', 
            '1491457214974656552', 
            '1491460319002755152' // Son eklediğimiz kaçak kanal
        ]; 

        try {
            console.log(`📸 [OCR] Yeni tarama başladı: ${message.author.tag}`);
            const { data: { text } } = await worker.recognize(attachment.url);
            
            // Regex'i daha akıllı yaptık (Boşlukları korur, daha iyi okur)
            const cleanText = text.toLowerCase().trim();
            console.log(`📝 [HAM METİN]: "${cleanText}"`); 

            // DAHA ESNEK KONTROL: Bu kelimelerden BİRİ bile geçse onaylar!
            const keywords = ['ryphera', 'script', 'scr1pt'];
            const isMatch = keywords.some(word => cleanText.includes(word));

            if (isMatch) {
                console.log(`🎯 [ONAY] Anahtar kelime yakalandı. Rol verme deneniyor: ${ROLE_ID}`);
                
                // 1. Abone Rolünü Ver (HATAYI LOGA YAZDIRIR)
                await message.member.roles.add(ROLE_ID)
                    .then(() => console.log("✅ [BAŞARI] Rol verildi!"))
                    .catch(err => console.log(`❌ [DİSCORD YETKİ HATASI] Rol verilemedi: ${err.message}`));
                
                // 2. Kanalları Kullanıcıdan Gizle
                for (const channelId of GIZLE_KANALLAR) {
                    const hideChannel = message.guild.channels.cache.get(channelId);
                    if (hideChannel) {
                        await hideChannel.permissionOverwrites.edit(message.author.id, {
                            ViewChannel: false 
                        }).catch(() => {});
                    }
                }

                // 3. Kullanıcıya DM Gönder (Çift Dilli)
                const dmSuccess = new EmbedBuilder()
                    .setTitle('✅ Ryphera OS | Approved')
                    .setDescription('**Your screenshot has been approved!**\nSubscriber role granted and access to verification channels has been hidden.\n\n**Ekran görüntünüz onaylandı!**\nAbone rolünüz verildi ve doğrulama kanalları erişiminize kapatıldı.')
                    .setColor('#57F287')
                    .setTimestamp();
                await message.author.send({ embeds: [dmSuccess] }).catch(() => {});

                // 4. Log Kanalına Kanıt Bildir
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

                const okMsg = await message.reply('`✅ APPROVED: Role given & verification channels hidden.`');
                setTimeout(() => { message.delete().catch(()=>{}); okMsg.delete().catch(()=>{}); }, 4000);

            } else {
                console.log("❌ [RED] Resimde hiçbir anahtar kelime okunamadı.");
                
                // 5. REDDEDİLDİ DURUMU (DM ve Mesaj)
                const dmFail = new EmbedBuilder()
                    .setTitle('❌ Ryphera OS | Rejected')
                    .setDescription('**Verification Failed!**\nRyphera Script text was not found in your screenshot. Please send a valid screenshot.\n\n**Onay Başarısız!**\nEkran görüntüsünde Ryphera Script ibaresi bulunamadı. Lütfen daha net bir resim atın.')
                    .setColor('#ED4245');
                await message.author.send({ embeds: [dmFail] }).catch(() => {});

                const failMsg = await message.reply('`❌ REJECTED: Ryphera Script text not found. / RED: Ryphera Script ibaresi bulunamadı.`');
                setTimeout(() => { message.delete().catch(()=>{}); failMsg.delete().catch(()=>{}); }, 5000);
            }
        } catch (e) { 
            console.error("🚨 [KRİTİK HATA] SS Okunurken çöktü:", e); 
        }
    }
};