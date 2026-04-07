const { createWorker } = require('tesseract.js');
const AboneChannel = require('../models/aboneChannel');
const { EmbedBuilder } = require('discord.js');

// Hız için OCR motorunu en başta hazırlıyoruz
let worker = null;
(async () => {
    worker = await createWorker('eng+tur');
})();

const processing = new Set(); // Çift işlemi engellemek için geçici hafıza

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || processing.has(message.id)) return;

        const channelData = await AboneChannel.findOne({ channelId: message.channelId });
        if (!channelData) return;

        const attachment = message.attachments.first();
        if (!attachment || !attachment.contentType.startsWith('image')) return;

        processing.add(message.id);
        const isEn = channelData.lang === 'en';
        const ROLE_ID = '1490996828974612530';
        const LOG_ID = '1490998881553743932';

        const pMsg = await message.reply(isEn ? '`⚡ Scanning screenshot...`' : '`⚡ Ekran görüntüsü taranıyor...`');

        try {
            const { data: { text } } = await worker.recognize(attachment.url);
            const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            const hasRyphera = cleanText.includes('ryphera');
            const hasScript = cleanText.includes('scr1pt') || cleanText.includes('script') || cleanText.includes('scrpt');

            if (hasRyphera && hasScript) {
                await message.member.roles.add(ROLE_ID);
                await pMsg.edit(isEn ? '`✅ VERIFIED! Channel cleaning in 3s...`' : '`✅ ONAYLANDI! Kanal 3 saniye içinde temizleniyor...`');
                
                const logChannel = message.guild.channels.cache.get(LOG_ID);
                if (logChannel) {
                    const log = new EmbedBuilder()
                        .setTitle('✅ ABONE ONAYLANDI')
                        .setColor('#00FF00')
                        .addFields(
                            { name: 'Kullanıcı', value: `<@${message.author.id}>` },
                            { name: 'Kanal', value: isEn ? 'English' : 'Türkçe' }
                        )
                        .setImage(attachment.url).setTimestamp();
                    logChannel.send({ embeds: [log] });
                }
            } else {
                await pMsg.edit(isEn ? '`❌ NOT FOUND! Channel cleaning in 4s...`' : '`❌ İSİM BULUNAMADI! Kanal 4 saniye içinde temizleniyor...`');
                
                const logChannel = message.guild.channels.cache.get(LOG_ID);
                if (logChannel) {
                    const failLog = new EmbedBuilder()
                        .setTitle('❌ ONAY REDDEDİLDİ')
                        .setColor('#FF0000')
                        .addFields(
                            { name: 'Kullanıcı', value: `<@${message.author.id}>` },
                            { name: 'Durum', value: 'Geçersiz SS veya isim okunamadı.' }
                        )
                        .setImage(attachment.url).setTimestamp();
                    logChannel.send({ embeds: [failLog] });
                }
            }
        } catch (e) { 
            await pMsg.edit('`SYSTEM ERROR: OCR Failed.`'); 
        }

        // Temizlik: 4 saniye sonra mesajları sil
        setTimeout(async () => {
            try { 
                await message.delete(); 
                await pMsg.delete(); 
            } catch (e) {}
            processing.delete(message.id);
        }, 4000);
    }
};