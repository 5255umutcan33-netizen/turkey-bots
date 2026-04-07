const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keyalkurtr')
        .setDescription('Türkçe lisans panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const trEmbed = new EmbedBuilder()
            .setTitle('RYPHERA | LİSANS')
            .setColor('#FF0000')
            .setDescription('Durum: `AKTİF`\nSistem: `RYPHERA OS`\n\nAnahtar almak için aşağıdaki butona basın.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_key_tr').setLabel('Anahtar Al').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [trEmbed], components: [row] });
    },
};