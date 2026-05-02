const trRole = "1500268780037607544"; // Doğru TR ID
const enRole = "1500268646545756392"; // Doğru EN ID
const logChannelId = "1500269916304052364"; // Log Kanalı

if (interaction.isButton()) {
    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    try {
        if (interaction.customId === 'verify_tr') {
            await interaction.member.roles.add(trRole);
            if (interaction.member.roles.cache.has(enRole)) await interaction.member.roles.remove(enRole);
            
            if (logChannel) logChannel.send(`✅ **${interaction.user.tag}** Türkçe doğrulandı. 🇹🇷`);
            return interaction.reply({ content: 'Başarıyla doğrulandın!', ephemeral: true });
        }

        if (interaction.customId === 'verify_en') {
            await interaction.member.roles.add(enRole);
            if (interaction.member.roles.cache.has(trRole)) await interaction.member.roles.remove(trRole);
            
            if (logChannel) logChannel.send(`✅ **${interaction.user.tag}** English verified. 🇬🇧`);
            return interaction.reply({ content: 'Successfully verified!', ephemeral: true });
        }
    } catch (error) {
        // Hatanın tam sebebini burası söyleyecek:
        console.error(error);
        return interaction.reply({ 
            content: `❌ **Hata Oluştu:** \`${error.message}\` \n(Not: Bot rolü en üstte olmalı ve 'Yönetici' yetkisi açık olmalıdır.)`, 
            ephemeral: true 
        });
    }
}