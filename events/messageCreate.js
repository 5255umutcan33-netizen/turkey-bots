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
        
        const LOG_KANALI_ID = '1500587963338326228';
        const ABONE_ROLU = '1500587633649127445';
        const ESKI_ROL = '1500249403443908711';

        // 1. SADECE RESİM KONTROLÜ
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

        // 2. YAPAY ZEKA TARAMASI (Gizli kelime falan yazmıyoruz, "Sistem" diyoruz)
        const loadingMsg = await message.channel.send(isTR ? `⏳ <@${message.author.id}>, görseliniz sistem tarafından inceleniyor...` : `⏳ <@${message.author.id}>, your image is being processed by the system...`);
        
        try {
            const { data: { text } } = await Tesseract.recognize(attachment.url, 'eng');
            
            const cleanText = text.replace(/[\s\-_]+/g, '').toLowerCase();

            // ==========================================
            // ❌ OTOMATİK RED SİSTEMİ (GİZLİLİK KORUMALI)
            // ==========================================
            if (!cleanText.includes('luawarescrpt')) {
                
                // ÖNEMLİ: MESAJI SİLMEDEN ÖNCE LOG KANALINA RESMİ ATIYORUZ (Resim silinmesin diye)
                const logChannel = message.client.channels.cache.get(LOG_KANALI_ID);
                if (logChannel) {
                    const redEmbed = new EmbedBuilder()
                        .setTitle('🔴 LUAWARE | Sistem Otomatik Red')
                        .setColor('#ED4245')
                        .setDescription(`👤 **Kullanıcı:** <@${message.author.id}>\n🤖 **Sebep:** Görsel doğrulama kriterlerini karşılamıyor.\n🌍 **Kanal:** <#${message.channel.id}>`)
                        .setImage(attachment.url)
                        .setTimestamp();
                    await logChannel.send({ embeds: [redEmbed] }).catch(() => {});
                }

                // Log gönderildikten sonra ortalığı temizle
                await message.delete().catch(() => {});
                await loadingMsg.delete().catch(() => {});

                // Kullanıcıya DM (Kelime vermeden, genel bir red atıyoruz)
                const dmStr = isTR 
                    ? `❌ **SS Onaylanmadı!** Attığınız görsel doğrulama standartlarımızı karşılamıyor. Lütfen kurallara uygun, doğru bir ekran görüntüsü atın.` 
                    : `❌ **SS Rejected!** Your image does not meet our verification standards. Please submit a valid screenshot.`;
                await message.author.send(dmStr).catch(() => {});
                return;
            }

            // ==========================================
            // ✅ OTOMATİK ONAY SİSTEMİ
            // ==========================================
            
            // ÖNEMLİ: YİNE SİLMEDEN ÖNCE LOG KANALINA BİLGİ VE RESİM ATIYORUZ
            const logChannel = message.client.channels.cache.get(LOG_KANALI_ID);
            if (logChannel) {
                const onayEmbed = new EmbedBuilder()
                    .setTitle('🟢 LUAWARE | Sistem Otomatik Onay')
                    .setColor('#1aff00') // Neon Yeşil
                    .setDescription(`👤 **Kullanıcı:** <@${message.author.id}>\n🤖 **Kontrol:** Doğrulama Başarılı ✅\n🛠️ **İşlem:** Otomatik Rol Verildi & Kanal Gizlendi.`)
                    .setImage(attachment.url)
                    .setTimestamp();
                await logChannel.send({ embeds: [onayEmbed] }).catch(() => {});
            }

            // Ortalığı temizle
            await message.delete().catch(() => {});
            await loadingMsg.delete().catch(() => {});

            const targetMember = await message.guild.members.fetch(message.author.id).catch(() => null);
            
            if (targetMember) {
                await targetMember.roles.add(ABONE_ROLU).catch(() => {});
                await targetMember.roles.remove(ESKI_ROL).catch(() => {});
                
                await message.channel.permissionOverwrites.edit(targetMember.id, { ViewChannel: false }).catch(() => {});

                const dmStr = isTR 
                    ? `🎉 **Tebrikler!** Abone kanıtınız sistem tarafından ONAYLANDI ve rolünüz verildi.\n🔒 *Doğrulama kanalına erişiminiz kapatıldı.*`
                    : `🎉 **Congratulations!** Your sub proof is APPROVED by the system and your role has been given.\n🔒 *Access to the verification channel is now hidden.*`;
                await targetMember.send(dmStr).catch(() => {});
            }

        } catch (error) {
            console.error(error);
            const errStr = isTR ? "❌ Görüntü işlenirken bir hata oluştu. Lütfen resmin çok net olduğundan emin olup tekrar deneyin." : "❌ An error occurred. Please ensure the image is very clear and try again.";
            await loadingMsg.edit(errStr).catch(() => {});
            setTimeout(() => loadingMsg.delete().catch(() => {}), 5000);
        }
    }
};