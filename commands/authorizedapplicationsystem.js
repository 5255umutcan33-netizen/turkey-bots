const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('authorizedapplicationsystem')
        .setDescription('Sets up the English staff application menu.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📩 RYPHERA OS | STAFF APPLICATION')
            .setColor('#2B2D31')
            .setDescription('>>> 👋 **Want to join our team?**\n\nIf you want to be part of Ryphera OS and contribute to our server, click the button below to fill out the application form.')
            .setFooter({ text: 'Ryphera Staff System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apply_en')
                .setLabel('Apply Now')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '`Application menu successfully created.`', ephemeral: true });
    },
};