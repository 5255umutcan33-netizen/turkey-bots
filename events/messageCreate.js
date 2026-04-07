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

        // Kanal kontrolü
        const channelData = await AboneChannel.findOne({ channelId: message.channelId });
        if (!channelData) return;

        // Resim kontrolü
        const attachment = message.attachments.first();
        if (!attachment || !attachment.contentType.startsWith('image')) return;

        processing.add(message.id);
        const isEn = channelData.lang === 'en';
        const ROLE_ID = '1490996828974612530';
        const LOG_ID = '1490998881553743932';

        const pMsg = await message.reply(isEn ? '`⚡ Analyzing screenshot...`' : '`⚡ Ekran görüntüsü analiz ediliyor...`');

        try {
            const { data: { text } } = await worker.recognize(attachment.url);
            const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            const hasRyphera = cleanText.includes('ryphera');
            const hasScript = cleanText.includes('scr1pt') || cleanText.includes('script') || cleanText.includes('scrpt');

            if (hasRyphera && hasScript) {
                // Rol Ver
                await message.member.roles.add(ROLE_ID);
                await pMsg.edit(isEn ? '`✅ VERIFIED! Check your DMs.`' : '`✅ ONAYLANDI! DM kutunu kontrol et.`');
                
                // DM GÖNDER (ONAY)
                try {
                    await message.author.send(isEn ? 
                        '🚀 **RYPHERA OS:** Your subscription has been verified! Welcome to the family.' : 
                        '🚀 **RYPHERA OS:** Aboneliğiniz başarıyla onaylandı! Ailemize hoş geldiniz.'
                    );
                } catch (e) { console.log("Kullanıcının DM'i kapalı."); }

                // Loga Gönder
                const logChannel = message.guild.channels.cache.get(LOG_ID);
                if (logChannel) {
                    const log = new EmbedBuilder()
                        .setTitle('✅ ABONE ONAYLANDI')
                        .setColor('#00FF00')
                        .addFields({ name: 'Kullanıcı', value: `<@${message.author.id}>` })
                        .setImage(attachment.url).setTimestamp();
                    logChannel.send({ embeds: [log] });
                }
            } else {
                await pMsg.edit(isEn ? '`❌ REJECTED! Check your DMs.`' : '`❌ REDDEDİLDİ! DM kutunu kontrol et.`');
                
                // DM GÖNDER (RED)
                try {
                    await message.author.send(isEn ? 
                        '❌ **RYPHERA OS:** Verification failed. "Ryphera Scr1pt" name not detected. Please send a clearer screenshot.' : 
                        '❌ **RYPHERA OS:** Onay başarısız. Resimde "Ryphera Scr1pt" ismi bulunamadı. Lütfen daha net bir SS gönderin.'
                    );
                } catch (e) { console.log("Kullanıcının DM'i kapalı."); }

                // Red Logu
                const logChannel = message.guild.channels.cache.get(LOG_ID);
                if (logChannel) {
                    const failLog = new EmbedBuilder()
                        .setTitle('❌ ONAY REDDEDİLDİ')
                        .setColor('#FF0000')
                        .addFields({ name: 'Kullanıcı', value: `<@${message.author.id}>` })
                        .setImage(attachment.url).setTimestamp();
                    logChannel.send({ embeds: [failLog] });
                }
            }
        } catch (e) { 
            await pMsg.edit('`SYSTEM ERROR: Processing failed.`'); 
        }

        // Temizlik: 5 saniye sonra mesajları sil
        setTimeout(async () => {
            try { 
                await message.delete(); 
                await pMsg.delete(); 
            } catch (e) {}
            processing.delete(message.id);
        }, 5000);
    }
};