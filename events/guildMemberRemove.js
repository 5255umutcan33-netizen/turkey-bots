const { Events, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key'); // Key modelini buraya bağladık

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
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

                channel.send({ embeds: [leaveEmbed] });
            }
        } catch (err) {
            console.error('Çıkış işleminde hata:', err);
        }
    },
};