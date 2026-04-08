const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const entryRoleId = '1491450686637080737'; // İlk verilecek rol
        const verifyChannelId = '1491093003714953420'; // Doğrulama kanalı

        try {
            // Yeni gelene giriş rolünü ver
            await member.roles.add(entryRoleId);
            console.log(`🛡️ [GİRİŞ] ${member.user.tag} sunucuya katıldı ve giriş rolü verildi.`);

            // DM veya giriş kanalına (eğer varsa) hoş geldin mesajı atılabilir.
            // Ama biz zaten kullanıcıyı yönlendireceğiz.
        } catch (err) {
            console.error('Oto-rol verilirken hata oluştu:', err);
        }
    },
};