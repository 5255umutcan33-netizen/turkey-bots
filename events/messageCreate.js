const { createWorker } = require('tesseract.js');
const AboneChannel = require('../models/aboneChannel');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

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

        activeProcessing.add(message.author.id);

        const isEn = channelData.lang === 'en';
        const ROLE_ID = '1490996828974612530';
        const LOG_ID = '1490998881553743932';

        try {
            const { data: { text } } = await worker.recognize(attachment.url);
            const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            const hasRyphera = cleanText.includes('ryphera');
            const hasScript = cleanText.includes('scr1pt') || cleanText.includes('script') || cleanText.includes('scrpt') || cleanText.includes('scrlpt');

            const logChannel = client.channels.cache.get(LOG_ID);

            if (hasRyphera && hasScript) {
                // ✅ BAŞARILI DURUM
                await message.member.roles.add(ROLE_ID).catch(() => {});
                const finalMsg = await message.reply(isEn ? '`✅ VERIFIED!`' : '`✅ ONAYLANDI!`');
                
                if (logChannel) {
                    const imgFile = new AttachmentBuilder(attachment.url, { name: 'onay.png' });
                    const log = new EmbedBuilder()
                        .setTitle(isEn ? '✅ VERIFIED' : '✅ ONAYLANDI')
                        .setColor('#00FF00')
                        .addFields({ name: 'Kullanıcı', value: `<@${message.author.id}>` })
                        .setImage('attachment://onay.png'); 
                    logChannel.send({ embeds: [log], files: [imgFile] }).catch(()=>{});
                }

                try { await message.author.send(isEn ? '🚀 Subscription verified! Welcome.' : '🚀 Aboneliğiniz onaylandı! Ailemize hoş geldiniz.'); } catch(e){}

                setTimeout(async () => {
                    try { await message.delete(); await finalMsg.delete(); } catch(e){}
                    activeProcessing.delete(message.author.id);
                }, 3000);

            } else {
                // ❌ REDDEDİLEN DURUM VE LOGA ATMA
                const failTextTR = '`❌ Üzgünüz, resminiz onaylanmadı. Lütfen tekrar deneyiniz.`';
                const failTextEN = '`❌ Sorry, your image was not approved. Please try again.`';
                const finalMsg = await message.reply(isEn ? failTextEN : failTextTR);
                
                // RED LOGU BURADA!
                if (logChannel) {
                    const imgFile = new AttachmentBuilder(attachment.url, { name: 'red.png' });
                    const log = new EmbedBuilder()
                        .setTitle(isEn ? '❌ REJECTED' : '❌ ONAY REDDEDİLDİ')
                        .setColor('#FF0000')
                        .addFields(
                            { name: 'Kullanıcı', value: `<@${message.author.id}>` },
                            { name: 'Sebep', value: 'Resimde Ryphera Scr1pt okunamadı.' }
                        )
                        .setImage('attachment://red.png'); 
                    logChannel.send({ embeds: [log], files: [imgFile] }).catch(()=>{});
                }

                try { await message.author.send(isEn ? failTextEN.replace(/`/g, '') : failTextTR.replace(/`/g, '')); } catch(e){}
                
                setTimeout(async () => {
                    try { await message.delete(); await finalMsg.delete(); } catch(e){}
                    activeProcessing.delete(message.author.id);
                }, 4000);
            }
        } catch (e) { 
            activeProcessing.delete(message.author.id);
        }
    }
};