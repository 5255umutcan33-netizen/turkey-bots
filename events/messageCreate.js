const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const AboneChannel = require('../models/aboneChannel');
const Tesseract = require('tesseract.js'); 

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Botların kendi mesajlarını yoksayıyoruz
        if (message.author.bot) return;

        // Atılan kanal veritabanında abone onay kanalı olarak ekli mi?
        const channelData = await AboneChannel.findOne({ channelId: message.channel.id });
        if (!channelData) return;

        const isTR = channelData.lang === 'tr';
        const LOG_KANALI_ID = '1500587963338326228';

        // SADECE RESİM KONTROLÜ (Yazı yazılırsa direkt silinir)
        if (message.attachments.size === 0) {
            await message.delete().catch(() => {});
            const msgStr = isTR ? `❌ <@${message.author.id}>, bu kanala sadece resim atabilirsiniz! Yazı yazmak yasaktır.` : `❌ <@${message.author.id}>, you can only post images in this channel! Text is forbidden.`;
            const warn = await message.channel.send(msgStr);
            setTimeout(() => warn.delete().catch(() => {}), 5000);
            return;
        }

        const attachment = message.attachments.first();
        if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
            await message.delete().catch(() => {});
            const msgStr = isTR ? `❌ <@${message.author.id}>, lütfen geçerli bir resim formatı yükleyin.` : `❌ <@${message.author.id}>, please upload a valid image format.`;
            const warn = await message.channel.send(msgStr);
            setTimeout(() => warn.delete().catch(() => {}), 5000);
            return;
        }

        // YAPAY ZEKA TARAMASI BAŞLIYOR
        const loadingStr = isTR ? `⏳ <@${message.author.id}>, görseliniz Yapay Zeka ile inceleniyor...` : `⏳ <@${message.author.id}>, your image is being processed by AI...`;
        const loadingMsg = await message.channel.send(loadingStr);
        
        try {
            const { data: { text } } = await Tesseract.recognize(attachment.url, 'eng');
            
            // OCR hatalarını en aza indirmek için boşluk, tire ve alt çizgileri siliyoruz
            const cleanText = text.replace(/[\s\-_]+/g, '').toLowerCase();

            // YAZI YOKSA (Yapay Zeka Otomatik Reddeder ve Haber Verir)
            if (!cleanText.includes('luawarescrpt')) {
                await message.delete().catch(() => {});
                await loadingMsg.delete().catch(() => {});
                
                // --- LOG KANALINA HABER VER ---
                const logChannel = message.client.channels.cache.get(LOG_KANALI_ID);
                if (logChannel) {
                    logChannel.send(`🤖 ❌ **YZ Reddi:** <@${message.author.id}> adlı kullanıcının resmi Yapay Zeka tarafından reddedildi. (\`LuaWareScrpt\` yazısı bulunamadı)`).catch(() => {});
                }

                // Kullanıcıya DM Gönder
                const dmStr = isTR 
                    ? `❌ **SS Onaylanmadı!** Attığınız görselde \`LuaWareScrpt\` yazısı tespit edilemedi.` 
                    : `❌ **SS Rejected!** The text \`LuaWareScrpt\` was not detected in your image.`;
                await message.author.send(dmStr).catch(() => {});
                return;
            }

            // YAZI VARSA (Yapay Zeka Onaylar, Yetkiliye Butonlu Şekilde Gönderir)
            const successStr = isTR ? `✅ YZ Doğrulaması başarılı! Görseliniz yetkililere iletildi.` : `✅ AI Verification successful! Your image has been sent to staff.`;
            await loadingMsg.edit(successStr);
            setTimeout(() => loadingMsg.delete().catch(() => {}), 4000);

            const logChannel = message.client.channels.cache.get(LOG_KANALI_ID);
            
            if (logChannel) {
                const adminEmbed = new EmbedBuilder()
                    .setTitle(isTR ? '📸 LUAWARE | YZ Onaylı Yeni SS (TR)' : '📸 LUAWARE | AI Approved New SS (EN)')
                    .setColor('#FEE75C')
                    .setDescription(`👤 **Kullanıcı/User:** <@${message.author.id}>\n🤖 **YZ/AI:** \`LuaWareScrpt\` ✅\n🌍 **Dil/Lang:** ${isTR ? 'Türkçe' : 'English'}`)
                    .setImage(attachment.url);

                const langCode = isTR ? 'tr' : 'en';
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`abone_yes_${message.author.id}_${message.id}_${message.channel.id}_${langCode}`)
                        .setLabel('Onayla / Approve')
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`abone_no_${message.author.id}_${message.id}_${message.channel.id}_${langCode}`)
                        .setLabel('Reddet / Reject')
                        .setEmoji('❌')
                        .setStyle(ButtonStyle.Danger)
                );

                await logChannel.send({ embeds: [adminEmbed], components: [row] });
            }

        } catch (error) {
            console.error(error);
            const errStr = isTR ? "❌ Görüntü işlenirken bir hata oluştu. Lütfen yazının net okunduğu bir resim atın." : "❌ An error occurred while processing the image. Please upload a clearer picture.";
            await loadingMsg.edit(errStr);
            setTimeout(() => loadingMsg.delete().catch(() => {}), 5000);
        }
    }
};