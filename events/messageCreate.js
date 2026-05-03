const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const AboneChannel = require('../models/aboneChannel'); // Kendi veritabanı modelinin yolunu kontrol et
const Tesseract = require('tesseract.js'); // Yapay zeka modülü

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // 1. Botların mesajlarını yoksay
        if (message.author.bot) return;

        // 2. Bu kanal bizim abone onay kanalımız mı? Veritabanından bakıyoruz
        const channelData = await AboneChannel.findOne({ channelId: message.channel.id });
        if (!channelData) return; // Abone kanalı değilse bot normal çalışmaya devam eder

        // 3. KURAL: Resim Yoksa Acımadan Sil (Sadece resim atılabilir)
        if (message.attachments.size === 0) {
            await message.delete().catch(() => {});
            const warn = await message.channel.send(`❌ <@${message.author.id}>, bu kanala sadece resim atabilirsiniz! Yazı yazmak yasaktır.`);
            setTimeout(() => warn.delete().catch(() => {}), 5000); // Uyarıyı 5 saniye sonra sil
            return;
        }

        const attachment = message.attachments.first();
        
        // Atılan şeyin harbi resim olup olmadığını kontrol et
        if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
            await message.delete().catch(() => {});
            const warn = await message.channel.send(`❌ <@${message.author.id}>, lütfen sadece geçerli bir resim formatı (PNG, JPG vb.) yükleyin.`);
            setTimeout(() => warn.delete().catch(() => {}), 5000);
            return;
        }

        // 4. KURAL: YAPAY ZEKA (OCR) İLE GÖRSEL TARAMASI
        const loadingMsg = await message.channel.send(`⏳ <@${message.author.id}>, görseliniz Yapay Zeka ile inceleniyor... Lütfen bekleyin.`);
        
        try {
            // Tesseract ile resimdeki metni okuyoruz
            const { data: { text } } = await Tesseract.recognize(attachment.url, 'eng');
            
            // Hatalı okumaları engellemek için tüm boşlukları silip yazıyı küçük harfe çeviriyoruz
            const cleanText = text.replace(/\s+/g, '').toLowerCase();

            // Eğer "luawaresctp" yazısı görselde YOKSA (Reddet):
            if (!cleanText.includes('luawaresctp')) {
                // Orijinal mesajı ve "inceleniyor" mesajını sil
                await message.delete().catch(() => {});
                await loadingMsg.delete().catch(() => {});
                
                // Kullanıcıya DM'den ret sebebini bildir (Çift Dilli)
                await message.author.send(`❌ **TR:** SS Onaylanmadı! Attığınız görselde \`LuaWareSctp\` yazısı YZ tarafından tespit edilemedi. Lütfen yazının net bir şekilde göründüğünden emin olup tekrar deneyin.\n\n❌ **EN:** SS Rejected! The text \`LuaWareSctp\` was not detected by AI in your image. Please ensure it is clearly visible and try again.`).catch(() => {});
                return;
            }

            // Eğer "luawaresctp" yazısı VARSA (Başarılı):
            await loadingMsg.edit(`✅ YZ Doğrulaması başarılı! Görseliniz yetkililere iletildi.`);
            setTimeout(() => loadingMsg.delete().catch(() => {}), 4000);

            // LOG KANALI (Yetkililerin onaylayıp/reddedeceği kanal)
            const LOG_KANALI_ID = '1500587963338326228';
            const logChannel = message.client.channels.cache.get(LOG_KANALI_ID);
            
            if (logChannel) {
                const adminEmbed = new EmbedBuilder()
                    .setTitle('📸 LUAWARE | YZ Onaylı Yeni SS')
                    .setColor('#FEE75C')
                    .setDescription(`👤 **Kullanıcı:** <@${message.author.id}>\n🤖 **YZ Kontrolü:** \`LuaWareSctp\` **bulundu** ✅\n📝 Lütfen aşağıdan manuel onay veya red verin.`)
                    .setImage(attachment.url)
                    .setFooter({ text: 'LUAWARE AI System' })
                    .setTimestamp();

                // Butonların customId'si içine silme işlemi için her şeyi kaydediyoruz:
                // Format: abone_yes/no_kullanıcıID_orijinalMesajID_kanalID
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`abone_yes_${message.author.id}_${message.id}_${message.channel.id}`)
                        .setLabel('Onayla')
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`abone_no_${message.author.id}_${message.id}_${message.channel.id}`)
                        .setLabel('Reddet')
                        .setEmoji('❌')
                        .setStyle(ButtonStyle.Danger)
                );

                await logChannel.send({ embeds: [adminEmbed], components: [row] });
            }

        } catch (error) {
            console.error('Yapay Zeka Okuma Hatası:', error);
            await loadingMsg.edit("❌ Görüntü işlenirken bir hata oluştu. Resim çok bulanık olabilir. Lütfen daha net bir resim atın.");
            setTimeout(() => loadingMsg.delete().catch(() => {}), 5000);
        }
    }
};