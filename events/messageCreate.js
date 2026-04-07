const { createWorker } = require('tesseract.js');
const AboneChannel = require('../models/aboneChannel');
const { EmbedBuilder } = require('discord.js');

// Sadece en hızlı İngilizce motoru devrede
let worker = null;
(async () => {
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

        // Kullanıcıyı kilitle (Çiftlemeyi önler)
        activeProcessing.add(message.author.id);

        const isEn = channelData.lang === 'en';
        const ROLE_ID = '1490996828974612530';
        const LOG_ID = '1490998881553743932';

        try {
            // "Analiz ediliyor..." MESAJINI KOMPLE SİLDİM. DİREKT OKUYOR.
            const { data: { text } } = await worker.recognize(attachment.url);
            const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            const hasRyphera = cleanText.includes('ryphera');
            const hasScript = cleanText.includes('scr1pt') || cleanText.includes('script') || cleanText.includes('scrpt') || cleanText.includes('scrlpt');

            if (hasRyphera && hasScript) {
                // ROL VER VE ZINK DİYE ONAYLA
                await message.member.roles.add(ROLE_ID).catch(() => {});
                
                const finalMsg = await message.reply(isEn ? '`✅ VERIFIED!`' : '`✅ ONAYLANDI!`');
                try { await message.author.send(isEn ? '🚀 Verified! Welcome.' : '🚀 Onaylandın! Ailemize hoş geldin.'); } catch(e){}
                
                const logChannel = client.channels.cache.get(LOG_ID);
                if (logChannel) {
                    const log = new EmbedBuilder().setTitle('✅ ONAY').setColor('#00FF00').addFields({name:'Kullanıcı', value:`<@${message.author.id}>`}).setImage(attachment.url);
                    logChannel.send({ embeds: [log] });
                }

                // 5 Saniye sonra kanalı temizle
                setTimeout(async () => {
                    try { await message.delete(); await finalMsg.delete(); } catch(e){}
                    activeProcessing.delete(message.author.id);
                }, 5000);

            } else {
                // ZINK DİYE REDDET
                const finalMsg = await message.reply(isEn ? '`❌ FAILED!`' : '`❌ BAŞARISIZ!`');
                try { await message.author.send(isEn ? '❌ Failed. Name not found.' : '❌ Başarısız. Resimde isim bulunamadı.'); } catch(e){}
                
                setTimeout(async () => {
                    try { await message.delete(); await finalMsg.delete(); } catch(e){}
                    activeProcessing.delete(message.author.id);
                }, 5000);
            }
        } catch (e) { 
            console.error(e);
            activeProcessing.delete(message.author.id);
        }
    }
};