const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mevcutkeyler')
        .setDescription('Tüm lisansları listeler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const listEmbed = new EmbedBuilder()
            .setTitle('RYPHERA | VERİTABANI')
            .setColor('#FF0000')
            .setDescription(`Sorgu: \`VERİTABANI LİSTELEME\`\nOnay veriyor musun?`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_list_keys').setLabel('Onaylıyorum').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel_list_keys').setLabel('İptal').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [listEmbed], components: [row], ephemeral: true });
    },
};