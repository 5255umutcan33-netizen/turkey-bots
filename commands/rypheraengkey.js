const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rypheraenglish')
        .setDescription('Setup Ryphera license panel (English Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const enEmbed = new EmbedBuilder()
            .setTitle('💎 RYPHERA | GLOBAL ACCESS')
            .setColor('#FF0000')
            .setDescription(
                `🟢 **System Online**\n` +
                `↳ Brand: \`RYPHERA\`\n` +
                `↳ Region: \`GLOBAL / ENGLISH\`\n\n` +
                `🔵 **License Acquisition**\n` +
                `↳ Click the button below to generate your key.\n` +
                `↳ Leaving the server will \`AUTO-EXPIRE\` your key.`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('get_ryp_en')
                .setLabel('🔑 Generate Key')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [enEmbed], components: [row] });
    },
};