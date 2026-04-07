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
            const { data: { text } } = await Tesseract.recognize(attachment.url, 'eng+tur');
            const lowerText = text.toLowerCase();
            const isSubbed = lowerText.includes('ryphera scr1pt') || lowerText.includes('@rypherascr1pt');

            if (isSubbed) {
                await message.member.roles.add(ROLE_ID);
                await message.react('✅');
                message.reply(isEn ? '`SUCCESS: Subscriber role granted!`' : '`BAŞARILI: Abone rolün verildi!`');

                const logEmbed = new EmbedBuilder()
                    .setTitle('✅ ABONE ONAYLANDI')
                    .setColor('#00FF00')
                    .addFields({ name: 'Kullanıcı', value: `<@${message.author.id}>` })
                    .setImage(attachment.url).setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            } else {
                await message.react('❌');
                message.reply(isEn ? '`FAILED: "Ryphera Scr1pt" name not detected.`' : '`HATA: "Ryphera Scr1pt" ismi bulunamadı.`');

                const logFailEmbed = new EmbedBuilder()
                    .setTitle('❌ ONAY REDDEDİLDİ')
                    .setColor('#FF0000')
                    .addFields({ name: 'Kullanıcı', value: `<@${message.author.id}>` })
                    .setImage(attachment.url).setTimestamp();
                logChannel.send({ embeds: [logFailEmbed] });
            }
        } catch (err) {
            message.reply('`HATA: Resim okunamadı.`');
        }
    }
};