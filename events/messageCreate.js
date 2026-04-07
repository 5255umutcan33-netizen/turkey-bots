const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createWorker } = require('tesseract.js');
const AboneChannel = require('../models/aboneChannel'); // Eski SS sistemin varsa bozulmasın diye tuttum

let worker = null;
(async () => { worker = await createWorker('eng'); })();

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        
        // --- YENİ: WEBHOOK BAŞVURU YAKALAMA OPERASYONU ---
        if (message.webhookId) {
            const embed = message.embeds[0];
            // Eğer gelen mesajda embed varsa ve altında "User ID:" yazıyorsa bu bizim siteden gelen başvurudur
            if (embed && embed.footer && embed.footer.text && embed.footer.text.includes('User ID:')) {
                const userId = embed.footer.text.replace('User ID: ', '').trim();
                
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`app_onay_${userId}`).setLabel('Onayla ✅').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`app_red_${userId}`).setLabel('Reddet ❌').setStyle(ButtonStyle.Danger)
                );

                // Bot mesajı kopyalayıp kendisi atıyor ki butonlar çalışsın
                await message.channel.send({ embeds: [embed], components: [row] });
                
                // Orijinal webhook mesajını yok et
                return message.delete().catch(() => {}); 
            }
            return; 
        }

        if (message.author.bot) return;

        // --- R!YARDIM KOMUTU ---
        if (message.content.toLowerCase() === 'r!yardım') {
            const help = new EmbedBuilder()
                .setTitle('💬 RYPHERA OS | YARDIM')
                .setColor('#2B2D31')
                .setDescription(`>>> 👋 **Merhaba <@${message.author.id}>!**\n\n• \`/format\` : Script Tanıtımı\n• \`/trticketkur\` : Türkçe Bilet Sistemi\n• \`r!yardım\` : Bu Menü`)
                .setFooter({ text: 'Ryphera Solutions' });
            return message.reply({ embeds: [help] });
        }

        // --- SS OKUMA SİSTEMİ (Eskiden kalan kodun) ---
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
                const okMsg = await message.reply('`✅ ONAYLANDI: Abone rolünüz verildi.`');
                
                const logChan = client.channels.cache.get(LOG_ID);
                if (logChan) {
                    const log = new EmbedBuilder()
                        .setTitle('ABONE ONAYLANDI')
                        .setColor('#00FF00')
                        .addFields({name:'Kullanıcı', value:`<@${message.author.id}>`})
                        .setImage(attachment.url);
                    logChan.send({ embeds: [log] });
                }
                setTimeout(() => { message.delete().catch(()=>{}); okMsg.delete().catch(()=>{}); }, 4000);
            } else {
                const failMsg = await message.reply('`❌ RED: Ryphera Script ibaresi bulunamadı.`');
                setTimeout(() => { message.delete().catch(()=>{}); failMsg.delete().catch(()=>{}); }, 5000);
            }
        } catch (e) { console.error(e); }
    }
};