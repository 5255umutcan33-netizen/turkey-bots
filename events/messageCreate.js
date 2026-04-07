const Tesseract = require('tesseract.js');
const AboneChannel = require('../models/aboneChannel');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        const channelData = await AboneChannel.findOne({ channelId: message.channelId });
        if (!channelData) return;

        const attachment = message.attachments.first();
        if (!attachment || !attachment.contentType.startsWith('image')) return;

        const ROLE_ID = '1490996828974612530';
        const LOG_ID = '1490998881553743932';
        const logChannel = message.guild.channels.cache.get(LOG_ID);
        const isEn = channelData.lang === 'en';

        await message.react('🔍');

        try {
            // eng+tur ile oku ama sonucu temizle
            const { data: { text } } = await Tesseract.recognize(attachment.url, 'eng+tur');
            
            // Küçük harfe çevir ve tüm boşlukları/noktalama işaretlerini sil (Fuzzy Matching)
            const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, ''); 
            
            // Kontrol: "ryphera" geçsin VE ("scr1pt" veya "script" veya "scrpt" geçsin)
            const hasRyphera = cleanText.includes('ryphera');
            const hasScript = cleanText.includes('scr1pt') || cleanText.includes('script') || cleanText.includes('scrpt') || cleanText.includes('scrlpt');

            if (hasRyphera && hasScript) {
                await message.member.roles.add(ROLE_ID);
                await message.react('✅');
                message.reply(isEn ? '`SUCCESS: Subscriber role granted!`' : '`BAŞARILI: Ryphera ailesine hoş geldin!`');

                const logEmbed = new EmbedBuilder()
                    .setTitle('✅ ABONE ONAYLANDI')
                    .setColor('#00FF00')
                    .addFields(
                        { name: 'Kullanıcı', value: `<@${message.author.id}>` },
                        { name: 'Sistem Notu', value: 'Esnek tarama ile doğrulandı.' }
                    )
                    .setImage(attachment.url).setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            } else {
                await message.react('❌');
                message.reply(isEn ? 
                    '`FAILED: "Ryphera Scr1pt" not detected. Please make sure the channel name is clear.`' : 
                    '`HATA: "Ryphera Scr1pt" ismi net okunamadı. Lütfen kanal isminin tam göründüğünden emin olun.`');

                const logFailEmbed = new EmbedBuilder()
                    .setTitle('❌ ONAY REDDEDİLDİ')
                    .setColor('#FF0000')
                    .addFields({ name: 'Kullanıcı', value: `<@${message.author.id}>` }, { name: 'Okunan Metin', value: `\`${text.substring(0, 100)}...\`` })
                    .setImage(attachment.url).setTimestamp();
                logChannel.send({ embeds: [logFailEmbed] });
            }
        } catch (err) {
            console.error(err);
            message.reply('`SİSTEM HATASI: Resim işlenirken bir sorun oluştu.`');
        }
    }
};