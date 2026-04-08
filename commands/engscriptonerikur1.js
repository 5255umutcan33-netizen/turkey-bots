const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('engscriptonerikur')
        .setDescription('Setup English script suggestion panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('💡 RYPHERA OS | SCRIPT SUGGESTION')
            .setColor('#5865F2')
            .setDescription('Share the games or script features you want to see in the system. Our team will consider your requests for upcoming updates.\n\n👇 Click the button below to submit your idea.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('suggest_script_en').setLabel('Suggest Script').setStyle(ButtonStyle.Primary).setEmoji('💡')
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ English Suggestion Panel successfully setup in this channel!', ephemeral: true });
    },
};