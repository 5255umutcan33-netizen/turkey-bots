const { createWorker } = require('tesseract.js');
const AboneChannel = require('../models/aboneChannel');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

let worker = null;
(async () => { worker = await createWorker('eng'); })();

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // ÇİFT MESAJI KESEN EN ÖNEMLİ SATIR:
        if (message.author.bot) return;

        // --- R!YARDIM KOMUTU ---
        if (message.content.toLowerCase() === 'r!yardım') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('💬 RYPHERA OS | YARDIM MENÜSÜ')
                .setColor('#2B2D31')
                .setDescription(`>>> 👋 **Merhaba <@${message.author.id}>!**\n\n**Aktif Komutlar:**\n• \`/format\` : Script Tanıtımı (TR)\n• \`/formateng\` : Script Presentation (EN)\n• \`/trticketkur\` : Türkçe Bilet Sistemi\n• \`/engticketkur\` : English Support Setup\n\n**Doğrulama:** #abone-ss kanalına resim atarak otomatik rol alabilirsiniz.`)
                .setFooter({ text: 'Ryphera Scripting Solutions' })
                .setTimestamp();
            return message.reply({ embeds: [helpEmbed] });
        }

        // --- SS OKUMA SİSTEMİ ---
        const channelData = await AboneChannel.findOne({ channelId: message.channelId });
        if (!channelData) return;

        const attachment = message.attachments.first();
        if (!attachment || !attachment.contentType.startsWith('image')) return;

        const ROLE_ID = '1490996828974612530';
        const LOG_ID = '1490998881553743932';

        try {
            const { data: { text } } = await worker.recognize(attachment.url);
            const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (clean.includes('ryphera') && (clean.includes('script') || clean.includes('scr1pt'))) {
                await message.member.roles.add(ROLE_ID).catch(() => {});
                const okMsg = await message.reply('`✅ ONAYLANDI: Rolünüz verildi.`');
                
                const logChan = client.channels.cache.get(LOG_ID);
                if (logChan) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('ABONE ONAYLANDI')
                        .setColor('#00FF00')
                        .addFields({ name: 'Kullanıcı', value: `<@${message.author.id}>` })
                        .setImage(attachment.url);
                    logChan.send({ embeds: [logEmbed] });
                }
                setTimeout(() => { message.delete().catch(()=>{}); okMsg.delete().catch(()=>{}); }, 4000);
            } else {
                const failMsg = await message.reply('`❌ RED: Görselde Ryphera Script ibaresi bulunamadı.`');
                setTimeout(() => { message.delete().catch(()=>{}); failMsg.delete().catch(()=>{}); }, 5000);
            }
        } catch (e) { console.error(e); }
    }
};