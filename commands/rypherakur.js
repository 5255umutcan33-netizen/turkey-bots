const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rypherakur')
        .setDescription('Ryphera lisans panelini kurar (TR/EN)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const setupEmbed = new EmbedBuilder()
            .setTitle('💎 RYPHERA | SYSTEM SETUP')
            .setColor('#FF0000')
            .setDescription(
                `🔴 **Sistem Durumu / System Status**\n` +
                `↳ Durum: \`AKTİF / ACTIVE\`\n` +
                `↳ Versiyon: \`V1.0.0\`\n\n` +
                `⚪ **Lisans Alımı / Get License**\n` +
                `↳ TR: \`Aşağıdaki butona basarak anahtarını al.\`\n` +
                `↳ EN: \`Click the button below to get your key.\``
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_ryp_tr').setLabel('🇹🇷 Key Al').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('get_ryp_en').setLabel('🇺🇸 Get Key').setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [setupEmbed], components: [row] });
    },
};