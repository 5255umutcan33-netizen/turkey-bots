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
        // 1. KORUMA: Bot kendi mesajına veya başka bota cevap vermez (Çiftlemeyi önler)
        if (message.author.bot) return;

        // --- R!YARDIM KOMUTU ---
        const prefix = "R!";
        if (message.content.toUpperCase().startsWith(prefix.toUpperCase() + "YARDIM")) {
            const helpEmbed = new EmbedBuilder()
                .setTitle('💬 RYPHERA OS | YARDIM MENÜSÜ')
                .setColor('#2B2D31')
                .setDescription(`>>> 👋 **Merhaba <@${message.author.id}>!**\nSistemimizdeki tüm aktif komutlar aşağıda listelenmiştir.\n\n**Genel Komutlar**\n• \`/format\` : Modern script tanıtım şablonu (TR)\n• \`/formateng\` : Modern script presentation (EN)\n\n**Destek Sistemleri**\n• \`/trticketkur\` : Türkçe bilet sistemini başlatır.\n• \`/engticketkur\` : English support system setup.\n\n**Doğrulama**\n• \`#abone-ss\` kanalına ekran görüntüsü atarak otomatik rol alabilirsiniz.`)
                .setFooter({ text: 'Ryphera Scripting Solutions' })
                .setTimestamp();

            return message.reply({ embeds: [helpEmbed] });
        }

        // --- SS DOĞRULAMA SİSTEMİ ---
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

            const logChannel = client.channels.cache.get(LOG_ID);

            if (hasRyphera && hasScript) {
                await message.member.roles.add(ROLE_ID).catch(() => {});
                const finalMsg = await message.reply(isEn ? '`VERIFIED`' : '`ONAYLANDI`');
                
                if (logChannel) {
                    const imgFile = new AttachmentBuilder(attachment.url, { name: 'onay.png' });
                    const log = new EmbedBuilder()
                        .setTitle(isEn ? 'VERIFIED' : 'ONAYLANDI')
                        .setColor('#00FF00')
                        .addFields({ name: 'User', value: `<@${message.author.id}>` })
                        .setImage('attachment://onay.png'); 
                    logChannel.send({ embeds: [log], files: [imgFile] }).catch(()=>{});
                }
                
                try { await message.author.send(isEn ? 'Subscription verified.' : 'Aboneliğiniz onaylandı.'); } catch(e){}
                setTimeout(async () => { try { await message.delete(); await finalMsg.delete(); } catch(e){} activeProcessing.delete(message.author.id); }, 3000);

            } else {
                const failMsg = isEn ? '`Üzgünüz, resminiz onaylanmadı. Lütfen tekrar deneyiniz.`' : '`Sorry, your image was not approved.`';
                const finalMsg = await message.reply(failMsg);
                
                if (logChannel) {
                    const imgFile = new AttachmentBuilder(attachment.url, { name: 'red.png' });
                    const log = new EmbedBuilder()
                        .setTitle(isEn ? 'REJECTED' : 'ONAY REDDEDİLDİ')
                        .setColor('#FF0000')
                        .addFields({ name: 'User', value: `<@${message.author.id}>` })
                        .setImage('attachment://red.png'); 
                    logChannel.send({ embeds: [log], files: [imgFile] }).catch(()=>{});
                }

                setTimeout(async () => { try { await message.delete(); await finalMsg.delete(); } catch(e){} activeProcessing.delete(message.author.id); }, 4000);
            }
        } catch (e) { activeProcessing.delete(message.author.id); }
    }
};