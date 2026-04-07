const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('engticketkur')
        .setDescription('Sets up the professional English ticket system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('RYPHERA OS | SUPPORT SYSTEM')
            .setColor('#2B2D31')
            .setDescription('>>> Please select the department you wish to contact from the buttons below.\nOur team will assist you shortly.')
            .setFooter({ text: 'Ryphera Scripting Solutions' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_en_support').setLabel('Support').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_en_partner').setLabel('Partnership').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_en_key').setLabel('Key Operations').setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '`Ticket system successfully created in this channel.`', ephemeral: true });
    },
};