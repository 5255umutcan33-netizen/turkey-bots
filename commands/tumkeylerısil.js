const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const OWNER_ID = '345821033414262794'; // Burayı kendi ID'nle değiştir kanka

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tumkeylerisil')
        .setDescription('Sistemi tamamen sıfırlar.'),
    async execute(interaction) {
        if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '`YETKİ: Erişim reddedildi.`', ephemeral: true });

        const delEmbed = new EmbedBuilder()
            .setTitle('RYPHERA | RESET')
            .setColor('#FF0000')
            .setDescription('Tüm veritabanı `SİLİNECEK`. Bu işlem geri alınamaz.\nOnaylıyor musun?');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_delete_all').setLabel('Sıfırla').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel_delete_all').setLabel('İptal').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [delEmbed], components: [row], ephemeral: true });
    },
};