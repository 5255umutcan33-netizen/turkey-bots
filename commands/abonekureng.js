const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abonekureng')
        .setDescription('Subscriber role panel (EN)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('RYPHERA | SUB VERIFY')
            .setColor('#FF0000')
            .setDescription(
                `Click the button below to verify your subscription.\n` +
                `System will scan for \`Ryphera Scr1pt\` name.\n\n` +
                `Note: Make sure the screenshot is clear.`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('abone_onay_en').setLabel('Submit Proof').setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};