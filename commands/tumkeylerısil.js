const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keylerisil')
        .setDescription('Sistemi tamamen sıfırlar (Sadece Kurucu).'),
    async execute(interaction) {
        const OWNER_ID = '345821033414262794'; 
        if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '`YETKİ YOK`', ephemeral: true });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_delete_all').setLabel('Sıfırla').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel_delete_all').setLabel('İptal').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: '⚠️ **TÜM VERİTABANI SİLİNECEK!** Emin misin?', components: [row], ephemeral: true });
    },
};