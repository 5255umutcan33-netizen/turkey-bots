const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const BOT_OWNER_ID = '345821033414262794'; // Kendi ID'ni yapıştır

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tumkeylerisil')
        .setDescription('Veritabanındaki TÜM keyleri temizler (SADECE BOT SAHİBİ)'),
    async execute(interaction) {
        if (interaction.user.id !== BOT_OWNER_ID) {
            return interaction.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir kanka!', ephemeral: true });
        }

        const confirmEmbed = new EmbedBuilder()
            .setTitle('🚨 KRİTİK İŞLEM ONAYI')
            .setDescription('Veritabanındaki **TÜM** lisans anahtarlarını silmek üzeresin. Bu işlem geri alınamaz!\n\nOnaylıyor musunuz?')
            .setColor('#FF0000');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_delete_all')
                .setLabel('Evet, Tümünü Sil')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel_delete_all')
                .setLabel('Hayır, İptal Et')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
    },
};