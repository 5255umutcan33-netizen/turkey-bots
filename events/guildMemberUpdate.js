const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember, client) {
        if (newMember.user.bot) return; // Botların rol değişimiyle ilgilenmiyoruz

        const LOG_CHANNEL_ID = '1491472941974556872'; 
        const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
        if (!logChannel) return;

        // Eski ve Yeni rolleri alıyoruz
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        // Eğer rol sayısı aynıysa (isim/foto değişmişse) işlemi bitir
        if (oldRoles.size === newRoles.size) return;

        // Eklenen ve Çıkarılan rolleri tespit et
        const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
        const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

        if (addedRoles.size === 0 && removedRoles.size === 0) return;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${newMember.user.tag} - Rol Güncellemesi`, iconURL: newMember.user.displayAvatarURL() })
            .setTimestamp();

        let aciklama = `👤 **Kullanıcı:** <@${newMember.id}>\n\n`;

        if (addedRoles.size > 0) {
            aciklama += `✅ **Verilen Roller:** ${addedRoles.map(r => `<@&${r.id}>`).join(', ')}\n`;
            embed.setColor('#57F287'); // Yeşil
        }
        
        if (removedRoles.size > 0) {
            aciklama += `❌ **Alınan Roller:** ${removedRoles.map(r => `<@&${r.id}>`).join(', ')}\n`;
            if (addedRoles.size === 0) embed.setColor('#ED4245'); // Sadece rol alındıysa Kırmızı yap
        }

        embed.setDescription(aciklama);
        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};