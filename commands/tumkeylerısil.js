const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const OWNER_ID = '345821033414262794';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tumkeylerisil')
        .setDescription('Veritabanını temizler.'),
    async execute(interaction) {
        if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '\`YETKİ YOK!\`', ephemeral: true });

        const delEmbed = new EmbedBuilder()
            .setTitle('RYPHERA | SIFIRLAMA')
            .setColor('#FF0000')
            .setDescription(`Tüm veriler \`SİLİNECEK\`. Onaylıyor musun?`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_delete_all').setLabel('Tümünü Sil').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel_delete_all').setLabel('İptal').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [delEmbed], components: [row], ephemeral: true });
    },
};