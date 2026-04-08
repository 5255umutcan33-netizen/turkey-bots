const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        // --- AYARLAR ---
        const entryRoleId = '1491450686637080737'; // Verilecek Kayıtsız Rolü
        const welcomeChannelId = '1491555857127706685'; // Modern Karşılama Kanalı
        const verifyChannelId = '1491093003714953420'; // Yönlendirilecek Doğrulama Kanalı

        try {
            // 1. ADIM: Kullanıcıya otomatik olarak kayıtsız rolünü ver
            await member.roles.add(entryRoleId).catch(e => console.error('Rol verilirken hata:', e));

            // 2. ADIM: Karşılama kanalını bul ve modern embed'i gönder
            const channel = member.guild.channels.cache.get(welcomeChannelId);
            if (channel) {
                const welcomeEmbed = new EmbedBuilder()
                    .setTitle('🚀 Ryphera OS | Yeni Bağlantı Tespit Edildi')
                    .setColor('#57F287')
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                    .setDescription(
                        `👋 **Aramıza Hoş Geldin** <@${member.id}>!\n\n` +
                        `📌 **Durum -->** \`🟢 Kayıtsız Üye\`\n` +
                        `⚙️ **İşlem -->** \`Doğrulanması Bekleniyor\`\n` +
                        `📍 **Yönlendirme -->** <#${verifyChannelId}>\n\n` +
                        `📝 **Not -->** \`Sunucuya tam erişim sağlamak için lütfen yukarıdaki kanaldan dilini seçerek kendini doğrula.\``
                    )
                    .setFooter({ text: `Ryphera OS | Üye Sayısı: ${member.guild.memberCount}` })
                    .setTimestamp();

                await channel.send({ content: `🛡️ **Sisteme bir kullanıcı giriş yaptı:** <@${member.id}>`, embeds: [welcomeEmbed] });
            }

            console.log(`🛡️ [GİRİŞ] ${member.user.tag} katıldı, rolü verildi ve karşılandı.`);

        } catch (err) {
            console.error('Hoş geldin sisteminde bir hata oluştu:', err);
        }
    },
};