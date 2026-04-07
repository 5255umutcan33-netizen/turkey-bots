const { createWorker } = require('tesseract.js');
const AboneChannel = require('../models/aboneChannel');
const { EmbedBuilder } = require('discord.js');

let worker = null;
(async () => {
    worker = await createWorker('eng+tur'); // Her iki dili de destekler
})();

const processingMessages = new Set(); // Çift işlem koruması

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || processingMessages.has(message.id)) return;

        // Kanal kontrolü (Veritabanından sorgula)
        const channelData = await AboneChannel.findOne({ channelId: message.channelId });
        if (!channelData) return;

        // Resim kontrolü
        const attachment = message.attachments.first();
        if (!attachment || !attachment.contentType.startsWith('image')) return;

        processingMessages.add(message.id);
        const isEn = channelData.lang === 'en';
        const ROLE_ID = '1490996828974612530';
        const LOG_ID = '1490998881553743932';

        const pMsg = await message.reply(isEn ? '`⚡ Analyzing...`' : '`⚡ Analiz ediliyor...`');

        try {
            const { data: { text } } = await worker.recognize(attachment.url);
            const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Kanal isminde Ryphera ve Script (her türlü yazımıyla) geçiyor mu?
            const hasRyphera = cleanText.includes('ryphera');
            const hasScript = cleanText.includes('scr1pt') || cleanText.includes('script') || cleanText.includes('scrpt') || cleanText.includes('scrlpt');

            if (hasRyphera && hasScript) {
                // ROL VERME
                await message.member.roles.add(ROLE_ID).catch(() => console.log("Rol verme yetkim yok!"));
                
                await pMsg.edit(isEn ? '`✅ VERIFIED! Check DMs.`' : '`✅ ONAYLANDI! DM kutuna bak.`');
                
                // DM BİLDİRİMİ
                try {
                    await message.author.send(isEn ? 
                        '🚀 **RYPHERA:** Your subscription has been verified! Welcome.' : 
                        '🚀 **RYPHERA:** Aboneliğin onaylandı! Ailemize hoş geldin.'
                    );
                } catch (e) { console.log("DM Kapalı."); }

                // LOG SİSTEMİ
                const logChannel = message.guild.channels.cache.get(LOG_ID);
                if (logChannel) {
                    const log = new EmbedBuilder()
                        .setTitle('✅ ABONE ONAYLANDI')
                        .setColor('#00FF00')
                        .addFields({ name: 'Kullanıcı', value: `<@${message.author.id}>` }, { name: 'Dil', value: isEn ? 'EN' : 'TR' })
                        .setImage(attachment.url).setTimestamp();
                    logChannel.send({ embeds: [log] });
                }
            } else {
                await pMsg.edit(isEn ? '`❌ FAILED! Check DMs.`' : '`❌ BAŞARISIZ! DM kutuna bak.`');
                
                try {
                    await message.author.send(isEn ? 
                        '❌ **RYPHERA:** Sub name not found. Be sure "Ryphera Scr1pt" is visible.' : 
                        '❌ **RYPHERA:** Onay başarısız. Resimde "Ryphera Scr1pt" ismi görünmüyor.'
                    );
                } catch (e) { console.log("DM Kapalı."); }
            }
        } catch (e) { 
            await pMsg.edit('`SYSTEM ERROR`'); 
        }

        // 5 saniye sonra kanalı temizle
        setTimeout(async () => {
            try { 
                await message.delete(); 
                await pMsg.delete(); 
            } catch (e) {}
            processingMessages.delete(message.id);
        }, 5000);
    }
};