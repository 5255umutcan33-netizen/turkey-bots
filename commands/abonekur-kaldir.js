const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AboneChannel = require('../models/aboneChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abonekurkaldir') // Türkçe karakter hatasını önlemek için 'i' yapıldı
        .setDescription('🗑️ Sunucudaki abone SS okuma sistemini tamamen kaldırır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const result = await AboneChannel.findOneAndDelete({ guildId: interaction.guild.id });

        // 💎 PREMİUM FORMAT
        const embed = new EmbedBuilder()
            .setTitle(result ? '🗑️ Ryphera | Sistem Kaldırıldı' : '⚠️ Ryphera | İşlem Başarısız')
            .setColor(result ? '#ED4245' : '#FEE75C')
            .setDescription(
                result 
                ? `⚙️ **İşlem -->** \`Abone SS Sistemi Kapatıldı\`\n` +
                  `✅ **Durum -->** \`Başarıyla Silindi\`\n` +
                  `👮 **İşlemi Yapan -->** <@${interaction.user.id}>\n` +
                  `📅 **İşlem Zamanı -->** <t:${Math.floor(Date.now() / 1000)}:f>`
                : `⚙️ **İşlem -->** \`Abone SS Sistemi Kapatma\`\n` +
                  `❌ **Durum -->** \`Başarısız (Sunucuda kurulu bir sistem bulunamadı)\`\n` +
                  `👮 **İşlemi Deneyen -->** <@${interaction.user.id}>`
            )
            .setFooter({ text: 'Ryphera OS System' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
};