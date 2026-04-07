const Tesseract = require('tesseract.js');
const AboneChannel = require('../models/aboneChannel');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // 1. Bu kanal bir onay kanalı mı?
        const channelData = await AboneChannel.findOne({ channelId: message.channelId });
        if (!channelData) return;

        // 2. Mesajda resim var mı?
        const attachment = message.attachments.first();
        if (!attachment || !attachment.contentType.startsWith('image')) return;

        const isEn = channelData.lang === 'en';
        const ROLE_ID = '1490996828974612530';
        const LOG_ID = '1490998881553743932';
        const logChannel = message.guild.channels.cache.get(LOG_ID);

        // Kullanıcıya işlemin başladığını ufak bir emojiyle belli et
        await message.react('🔍');

        try {
            const { data: { text } } = await Tesseract.recognize(attachment.url, 'eng+tur');
            const lowerText = text.toLowerCase();
            const isSubbed = lowerText.includes('ryphera scr1pt') || lowerText.includes('@rypherascr1pt');

            if (isSubbed) {
                await message.member.roles.add(ROLE_ID);
                await message.react('✅');
                message.reply(isEn ? '`SUCCESS: Subscriber role granted!`' : '`BAŞARILI: Abone rolün verildi!`');

                // LOG
                const logEmbed = new EmbedBuilder()
                    .setTitle('✅ ABONE ONAYLANDI')
                    .setColor('#00FF00')
                    .addFields({ name: 'Kullanıcı', value: `<@${message.author.id}>` }, { name: 'Kanal', value: isEn ? 'English' : 'Türkçe' })
                    .setImage(attachment.url).setTimestamp();
                logChannel.send({ embeds: [logEmbed] });

            } else {
                await message.react('❌');
                message.reply(isEn ? '`FAILED: Could not find "Ryphera Scr1pt" name in image.`' : '`HATA: Resimde "Ryphera Scr1pt" ismi saptanamadı.`');

                // LOG
                const logFailEmbed = new EmbedBuilder()
                    .setTitle('❌ ONAY REDDEDİLDİ')
                    .setColor('#FF0000')
                    .addFields({ name: 'Kullanıcı', value: `<@${message.author.id}>` }, { name: 'Sebep', value: 'Geçersiz SS' })
                    .setImage(attachment.url).setTimestamp();
                logChannel.send({ embeds: [logFailEmbed] });
            }
        } catch (err) {
            console.error(err);
            message.reply('`SİSTEM HATASI: Resim okunamadı.`');
        }
    }
};