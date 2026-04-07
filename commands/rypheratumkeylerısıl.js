const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const BOT_OWNER_ID = '345821033414262794'; // Kendi ID'ni yapıştır kanka

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rypheratemizle')
        .setDescription('Veritabanındaki TÜM lisansları temizler (Sahip Özel)'),
    async execute(interaction) {
        if (interaction.user.id !== BOT_OWNER_ID) {
            return interaction.reply({ 
                content: '❌ **Yetki Hatası**\n↳ Bu işlem için `DEVELOPER` yetkisi gerekiyor.', 
                ephemeral: true 
            });
        }

        const confirmEmbed = new EmbedBuilder()
            .setTitle('🚨 RYPHERA | KRİTİK İŞLEM')
            .setColor('#FF0000')
            .setDescription(
                `🔴 **Veritabanı Temizliği**\n` +
                `↳ Durum: \`ONAY BEKLİYOR\`\n` +
                `↳ Etki: \`TÜM LİSANSLAR SİLİNECEK\`\n\n` +
                `⚪ **Bilgilendirme**\n` +
                `↳ Bu işlem geri alınamaz. Onaylıyor musun?`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_delete_all').setLabel('Evet, Temizle').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel_delete_all').setLabel('Hayır, İptal Et').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
    },
};