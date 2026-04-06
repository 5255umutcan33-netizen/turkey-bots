const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('engkeyalkur')
        .setDescription('Setup key system panel (English)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const enEmbed = new EmbedBuilder()
            .setTitle('🇺🇸 TURKEY HUB | KEY SYSTEM')
            .setDescription('Click the button below to get your **Lifetime** key.\n\n⚠️ If you leave the server, your key will be deleted!')
            .setColor('#FF0000');

        const enRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_key_en').setLabel('🔑 Get Key').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [enEmbed], components: [enRow] });
    },
};