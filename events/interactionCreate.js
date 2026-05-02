const trRole = "1500268780037807544"; // Senin verdiğin TR Rol ID
const enRole = "1500268646545756392"; // Senin verdiğin EN Rol ID
const logChannelId = "1500269916304052364"; // Log Kanalı ID

if (interaction.isButton()) {
    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    if (interaction.customId === 'verify_tr') {
        try {
            await interaction.member.roles.add(trRole);
            if (interaction.member.roles.cache.has(enRole)) await interaction.member.roles.remove(enRole);
            
            if (logChannel) logChannel.send({ content: `✅ **${interaction.user.tag}** Türkçe dilini seçerek doğrulandı. 🇹🇷` });
            return interaction.reply({ content: 'Doğrulandınız! Türkçe kanallar açıldı.', ephemeral: true });
        } catch (e) {
            return interaction.reply({ content: '❌ Yetki Hatası: Bot rolünü hiyerarşide en üste çekin!', ephemeral: true });
        }
    }

    if (interaction.customId === 'verify_en') {
        try {
            await interaction.member.roles.add(enRole);
            if (interaction.member.roles.cache.has(trRole)) await interaction.member.roles.remove(trRole);
            
            if (logChannel) logChannel.send({ content: `✅ **${interaction.user.tag}** verified with English. 🇬🇧` });
            return interaction.reply({ content: 'Verified! English channels are now visible.', ephemeral: true });
        } catch (e) {
            return interaction.reply({ content: '❌ Permission Error: Move the Bot Role to the top!', ephemeral: true });
        }
    }
}