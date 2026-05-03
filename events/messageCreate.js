const { EmbedBuilder, Events } = require('discord.js');
const AboneChannel = require('../models/aboneChannel');
const Tesseract = require('tesseract.js'); 

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        const channelData = await AboneChannel.findOne({ channelId: message.channel.id });
        if (!channelData) return;

        const isTR = channelData.lang === 'tr';
        
        // --- SENİN VERDİĞİN ID'LER ---
        const LOG_KANALI_ID = '1500587963338326228';
        const ABONE_ROLU = '1500587633649127445';
        const ESKI_ROL = '1500249403443908711';

        // 1. SADECE RESİM ATILABİLİR (Yazı yazanı siler)
        if (message.attachments.size === 0) {
            await message.delete().catch(() => {});
            const warn = await message.channel.send(isTR ? `❌ <@${message.author.id}>, bu kanala sadece resim atabilirsiniz! Yazı yazmak yasaktır.` : `❌ <@${message.author.id}>, you can only post images in this channel!`);
            setTimeout(() => warn.delete().catch(() => {}), 5000);
            return;
        }

        const attachment = message.attachments.first();
        if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
            await message.delete().catch(() => {});
            const warn = await message.channel.send(isTR ? `❌ <@${message.author.id}>, lütfen geçerli bir resim formatı yükleyin.` : `❌ <@${message.author.id}>, please upload a valid image format.`);
            setTimeout(() => warn.delete().catch(() => {}), 5000);
            return;
        }

        // 2. YAPAY ZEKA TARAMASI
        const loadingMsg = await message.channel.send(isTR ? `⏳ <@${message.author.id}>, görseliniz Yapay Zeka ile inceleniyor...` : `⏳ <@${message.author.id}>, your image is being processed by AI...`);
        
        try {
            const { data: { text } } = await Tesseract.recognize(attachment.url, 'eng');
            
            // OCR "@" işaretini bazen yanlış okuyabilir. Sorun çıkmaması için yazıyı temizleyip "luawarescrpt" kelimesini arıyoruz.
            const cleanText = text.replace(/[\s\-_]+/g, '').toLowerCase();

            // ==========================================
            // ❌ YAPAY ZEKA REDDEDERSE (Yazı Bulunamazsa)
            // ==========================================
            if (!cleanText.includes('luawarescrpt')) {
                await message.delete().catch(() => {});
                await loadingMsg.delete().catch(() => {});
                
                // Log Kanalına OTO-RED Raporu
                const logChannel = message.client.channels.cache.get(LOG_KANALI_ID);
                if (logChannel) {
                    const redEmbed = new EmbedBuilder()
                        .setTitle('🔴 LUAWARE | YZ Otomatik Red')
                        .setColor('#ED4245')
                        .setDescription(`👤 **Kullanıcı:** <@${message.author.id}>\n🤖 **Sebep:** \`@Luawarescrpt\` yazısı bulunamadı.\n🌍 **Kanal:** <#${message.channel.id}>`)
                        .setImage(attachment.url)
                        .setTimestamp();
                    logChannel.send({ embeds: [redEmbed] }).catch(() => {});
                }

                // Kullanıcıya DM
                const dmStr = isTR 
                    ? `❌ **SS Onaylanmadı!** Attığınız görselde \`@Luawarescrpt\` yazısı tespit edilemedi.` 
                    : `❌ **SS Rejected!** The text \`@Luawarescrpt\` was not detected in your image.`;
                await message.author.send(dmStr).catch(() => {});
                return;
            }

            // ==========================================
            // ✅ YAPAY ZEKA ONAYLARSA (Yazı Bulunursa)
            // ==========================================
            await message.delete().catch(() => {});
            await loadingMsg.delete().catch(() => {});

            const targetMember = await message.guild.members.fetch(message.author.id).catch(() => null);
            
            if (targetMember) {
                // 1. Rolleri ver ve al
                await targetMember.roles.add(ABONE_ROLU).catch(() => {});
                await targetMember.roles.remove(ESKI_ROL).catch(() => {});
                
                // 2. KANALI KİŞİYE ÖZEL GİZLE
                await message.channel.permissionOverwrites.edit(targetMember.id, { ViewChannel: false }).catch(() => {});

                // 3. Kullanıcıya Başarı DM'i
                const dmStr = isTR 
                    ? `🎉 **Tebrikler!** Abone kanıtınız Yapay Zeka tarafından ONAYLANDI ve rolünüz verildi.\n🔒 *Doğrulama kanalına erişiminiz kapatıldı.*`
                    : `🎉 **Congratulations!** Your sub proof is APPROVED by AI and your role has been given.\n🔒 *Access to the verification channel is now hidden.*`;
                await targetMember.send(dmStr).catch(() => {});
            }

            // 4. Log Kanalına OTO-ONAY Raporu (Butonsuz)
            const logChannel = message.client.channels.cache.get(LOG_KANALI_ID);
            if (logChannel) {
                const onayEmbed = new EmbedBuilder()
                    .setTitle('🟢 LUAWARE | YZ Otomatik Onay')
                    .setColor('#1aff00') // Neon Yeşil
                    .setDescription(`👤 **Kullanıcı:** <@${message.author.id}>\n🤖 **YZ Kontrolü:** \`@Luawarescrpt\` ✅\n🛠️ **İşlem:** Otomatik Rol Verildi & Kanal Gizlendi.`)
                    .setImage(attachment.url)
                    .setTimestamp();
                logChannel.send({ embeds: [onayEmbed] }).catch(() => {});
            }

        } catch (error) {
            console.error(error);
            const errStr = isTR ? "❌ Görüntü işlenirken bir hata oluştu. Lütfen yazının net okunduğu bir resim atın." : "❌ An error occurred while processing the image. Please upload a clearer picture.";
            await loadingMsg.edit(errStr);
            setTimeout(() => loadingMsg.delete().catch(() => {}), 5000);
        }
    }
};