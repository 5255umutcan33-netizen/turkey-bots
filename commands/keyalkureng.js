const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keyalkureng')
        .setDescription('Setup English license panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const enEmbed = new EmbedBuilder()
            .setTitle('RYPHERA | LICENSE SYSTEM')
            .setColor('#FF0000')
            .setDescription(
                `Status: \`ACTIVE\`\n` +
                `System: \`RYPHERA OS\`\n\n` +
                `Click the button below to get your license key.\n` +
                `If you leave the server, your key will be \`EXPIRED\`.`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_key_en').setLabel('Get Key').setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [enEmbed], components: [row] });
    },
};