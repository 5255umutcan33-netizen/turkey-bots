const { createWorker } = require('tesseract.js');
const AboneChannel = require('../models/aboneChannel');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

let worker = null;
(async () => {
    // Sadece İngilizce motoru devrede, maksimum hız.
    worker = await createWorker('eng'); 
})();

const activeProcessing = new Set();

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || activeProcessing.has(message.author.id)) return;

        const channelData = await AboneChannel.findOne({ channelId: message.channelId });
        if (!channelData) return;

        const attachment = message.attachments.first();
        if (!attachment || !attachment.contentType.startsWith('image')) return;

        // Kullanıcıyı hemen kilitle, çiftlemeyi engelle
        activeProcessing.add(message.author.id);

        const isEn = channelData.lang === 'en';
        const ROLE_ID = '1490996828974612530';
        const LOG_ID = '1490998881553743932';

        try {
            // Analiz ediliyor adımı yok, direkt taramaya giriyor.
            const { data: { text } } = await worker.recognize(attachment.url);
            const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            const hasRyphera = cleanText.includes('ryphera');
            const hasScript = cleanText.includes('scr1pt') || cleanText.includes('script') || cleanText.includes('scrpt') || cleanText.includes('scrlpt');

            const logChannel = client.channels.cache.get(LOG_ID);

            if (hasRyphera && hasScript) {
                // ✅ BAŞARILI DURUM
                await message.member.roles.add(ROLE_ID).catch(() => {});
                
                const finalMsg = await message.reply(isEn ? '`VERIFIED`' : '`ONAYLANDI`');
                
                // Loga Gönder (KOPYALAYARAK - Resim silinme sorunu çözüldü)
                if (logChannel) {
                    const imgFile = new AttachmentBuilder(attachment.url, { name: 'onay.png' });
                    const log = new EmbedBuilder()
                        .setTitle(isEn ? 'VERIFIED' : 'ONAYLANDI')
                        .setColor('#00FF00')
                        .addFields({ name: 'User', value: `<@${message.author.id}>` })
                        .setImage('attachment://onay.png'); // Yeni yüklenen resmi kullan
                    logChannel.send({ embeds: [log], files: [imgFile] }).catch(()=>{});
                }

                // DM Gönder
                try { await message.author.send(isEn ? 'Subscription verified. Welcome.' : 'Aboneliğiniz onaylandı. Ailemize hoş geldiniz.'); } catch(e){}

                // 3 Saniye sonra kanalı temizle
                setTimeout(async () => {
                    try { await message.delete(); await finalMsg.delete(); } catch(e){}
                    activeProcessing.delete(message.author.id);
                }, 3000);

            } else {
                // ❌ REDDEDİLEN DURUM
                const failTextTR = '`Üzgünüz, resminiz onaylanmadı. Lütfen tekrar deneyiniz.`';
                const failTextEN = '`Sorry, your image was not approved. Please try again.`';
                
                const finalMsg = await message.reply(isEn ? failTextEN : failTextTR);
                
                // RED LOGU BURADA! (Resim kopyalanarak)
                if (logChannel) {
                    const imgFile = new AttachmentBuilder(attachment.url, { name: 'red.png' });
                    const log = new EmbedBuilder()
                        .setTitle(isEn ? 'REJECTED' : 'ONAY REDDEDİLDİ')
                        .setColor('#FF0000')
                        .addFields(
                            { name: 'User', value: `<@${message.author.id}>` },
                            { name: 'Reason', value: 'Ryphera Scr1pt name not found in image.' }
                        )
                        .setImage('attachment://red.png'); 
                    logChannel.send({ embeds: [log], files: [imgFile] }).catch(()=>{});
                }

                // DM Gönder
                try { await message.author.send(isEn ? failTextEN.replace(/`/g, '') : failTextTR.replace(/`/g, '')); } catch(e){}
                
                // 4 Saniye sonra kanalı temizle
                setTimeout(async () => {
                    try { await message.delete(); await finalMsg.delete(); } catch(e){}
                    activeProcessing.delete(message.author.id);
                }, 4000);
            }
        } catch (e) { 
            console.error(e);
            activeProcessing.delete(message.author.id);
        }
    }
};