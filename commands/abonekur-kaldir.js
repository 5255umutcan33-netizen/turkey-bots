const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AboneChannel = require('../models/aboneChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abonekurkaldır')
        .setDescription('🗑️ Sunucudaki abone SS okuma sistemini tamamen kaldırır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const result = await AboneChannel.findOneAndDelete({ guildId: interaction.guild.id });

        const embed = new EmbedBuilder()
            .setColor(result ? '#ED4245' : '#FEE75C')
            .setDescription(result ? '✅ **Sistem Kaldırıldı:** Abone SS okuma sistemi bu sunucudan silindi.' : '⚠️ **Hata:** Bu sunucuda kurulmuş bir sistem bulunamadı.');
        
        await interaction.reply({ embeds: [embed] });
    },
};