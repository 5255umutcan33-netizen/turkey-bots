const { createWorker } = require('tesseract.js');
const AboneChannel = require('../models/aboneChannel');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

let worker = null;
(async () => { worker = await createWorker('eng'); })();

const activeProcessing = new Set();

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return; // Çift mesajı önler!

        // --- R!YARDIM ---
        if (message.content.toLowerCase() === 'r!yardım') {
            const help = new EmbedBuilder()
                .setTitle('💬 RYPHERA OS | YARDIM MENÜSÜ')
                .setColor('#2B2D31')
                .setDescription(`>>> 👋 **Komut Listesi**\n\n• \`/format\` : Script tanıtımı (TR)\n• \`/formateng\` : Script tanıtımı (EN)\n• \`/trticketkur\` : Bilet sistemi kur\n• \`/engticketkur\` : Ticket system setup\n\n**Doğrulama:** #abone-ss kanalına resim atın.`)
                .setFooter({ text: 'Ryphera Solutions' });
            return message.reply({ embeds: [help] });
        }

        // --- SS OKUMA ---
        const channelData = await AboneChannel.findOne({ channelId: message.channelId });
        if (!channelData) return;

        const attachment = message.attachments.first();
        if (!attachment || !attachment.contentType.startsWith('image')) return;

        if (activeProcessing.has(message.author.id)) return;
        activeProcessing.add(message.author.id);

        const isEn = channelData.lang === 'en';
        const ROLE_ID = '1490996828974612530';
        const LOG_ID = '1490998881553743932';

        try {
            const { data: { text } } = await worker.recognize(attachment.url);
            const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            const hasRyphera = cleanText.includes('ryphera');
            const hasScript = cleanText.includes('scr1pt') || cleanText.includes('script') || cleanText.includes('scrpt') || cleanText.includes('scrlpt');

            if (hasRyphera && hasScript) {
                await message.member.roles.add(ROLE_ID).catch(() => {});
                const finalMsg = await message.reply(isEn ? '`VERIFIED`' : '`ONAYLANDI`');
                
                const logChannel = client.channels.cache.get(LOG_ID);
                if (logChannel) {
                    const imgFile = new AttachmentBuilder(attachment.url, { name: 'onay.png' });
                    const log = new EmbedBuilder().setTitle('ONAYLANDI').setColor('#00FF00').setImage('attachment://onay.png').addFields({name:'User', value:`<@${message.author.id}>`});
                    logChannel.send({ embeds: [log], files: [imgFile] });
                }
                setTimeout(async () => { try { await message.delete(); await finalMsg.delete(); } catch(e){} activeProcessing.delete(message.author.id); }, 3000);
            } else {
                const finalMsg = await message.reply(isEn ? '`REJECTED`' : '`REDDEDİLDİ`');
                setTimeout(async () => { try { await message.delete(); await finalMsg.delete(); } catch(e){} activeProcessing.delete(message.author.id); }, 4000);
            }
        } catch (e) { activeProcessing.delete(message.author.id); }
    }
};