const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildBanAdd,
    async execute(ban) {
        // Senin yeni Ban Log Kanalın
        const logChannelId = '1502621783344414780'; 
        const logChannel = ban.guild.channels.cache.get(logChannelId);
        if (!logChannel) return;

        let executor = 'Bilinmiyor (Sağ tık ban veya Bot)';
        let reason = ban.reason || 'LUAWARE Security: Sebep belirtilmedi.';
        
        // Kimin banladığını bulmak için denetim kaydına (Audit Log) gizlice bakıyoruz
        try {
            const auditLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: 22 }); // 22 = Ban log kodu
            const banLog = auditLogs.entries.first();
            
            if (banLog && banLog.target.id === ban.user.id) {
                executor = `<@${banLog.executor.id}>`;
                if (banLog.reason) reason = banLog.reason;
            }
        } catch (e) {
            console.error('Ban logu çekilirken hata:', e);
        }

        const embed = new EmbedBuilder()
            .setTitle('🔨 LUAWARE OS | İnfaz Raporu (Ban)')
            .setColor('#8B0000') // Koyu Kan Kırmızı
            .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `👤 **Yasaklanan -->** <@${ban.user.id}> (\`${ban.user.tag}\`)\n` +
                `🆔 **Kullanıcı ID -->** \`${ban.user.id}\`\n` +
                `👮 **İnfazcı -->** ${executor}\n` +
                `📝 **Sebep -->** \`${reason}\`\n` +
                `📅 **Zaman -->** <t:${Math.floor(Date.now() / 1000)}:f>`
            )
            .setFooter({ text: 'LUAWARE Security Moderation' })
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    }
};