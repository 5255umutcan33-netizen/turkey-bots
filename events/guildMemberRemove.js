const { Events, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key'); // Ryphera OS Key modeli
const PartnerModel = require('../models/Partner'); // Yeni eklediğimiz Partner modeli

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        // ==========================================
        // 1. BÖLÜM: RYPHERA OS LİSANS İPTALİ VE LOG
        // ==========================================
        const leaveChannelId = '1491555820758892805';
        const channel = member.guild.channels.cache.get(leaveChannelId);

        try {
            // 💥 KRİTİK İŞLEM: Çıkan kullanıcının veritabanındaki keyini siliyoruz
            const deletedKey = await KeyModel.findOneAndDelete({ owner: member.id });

            if (channel) {
                const leaveEmbed = new EmbedBuilder()
                    .setTitle('🚪 Ryphera OS | Bağlantı Kesildi')
                    .setColor('#ED4245')
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(
                        `👤 **Ayrılan Üye -->** \`${member.user.tag}\`\n` +
                        `🆔 **Kullanıcı ID -->** \`${member.id}\`\n` +
                        `🔑 **Lisans Durumu -->** \`${deletedKey ? '🗑️ İptal Edildi (Silindi)' : '❌ Kayıtlı Key Yoktu'}\`\n` +
                        `✅ **Durum -->** \`Veritabanı Temizlendi\`\n\n` +
                        `📊 **Kalan Üye -->** \`${member.guild.memberCount}\` **Kişi**`
                    )
                    .setFooter({ text: 'Ryphera OS Database Cleanup' })
                    .setTimestamp();

                await channel.send({ embeds: [leaveEmbed] });
            }
        } catch (err) {
            console.error('[RYPHERA OS] Çıkış logu / Key silme hatası:', err);
        }

        // ==========================================
        // 2. BÖLÜM: PARTNER MESAJI VE VERİ TEMİZLİĞİ
        // ==========================================
        try {
            // Çıkan adam bizim veritabanımızda partner temsilcisi olarak kayıtlı mı?
            const partnerKayitlari = await PartnerModel.find({ temsilciId: member.id, guildId: member.guild.id });

            if (partnerKayitlari.length > 0) {
                for (const kayit of partnerKayitlari) {
                    const partnerKanal = member.guild.channels.cache.get(kayit.kanalId);
                    
                    if (partnerKanal) {
                        // Kanaldaki o mesajı bul ve YOK ET
                        const mesaj = await partnerKanal.messages.fetch(kayit.mesajId).catch(() => null);
                        if (mesaj) {
                            await mesaj.delete();
                            console.log(`[LUAWARE PARTNER] ${member.user.tag} çıktı, partner mesajı başarıyla silindi!`);
                        }
                    }
                    
                    // İşimiz bittiği için çöp veriyi veritabanından siliyoruz
                    await PartnerModel.deleteOne({ _id: kayit._id });
                }
            }
        } catch (err) {
            console.error('[LUAWARE PARTNER] Partner mesajı silinirken bir hata oluştu:', err);
        }
    },
};