const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rypheraliste')
        .setDescription('Tüm Ryphera lisanslarını listeler (Admin Özel)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const warnEmbed = new EmbedBuilder()
            .setTitle('📁 RYPHERA | DATABASE ACCESS')
            .setColor('#FFA500')
            .setDescription(
                `🟠 **Güvenlik Sorgusu**\n` +
                `↳ İşlem: \`VERİTABANI LİSTELEME\`\n` +
                `↳ Uyarı: \`BU VERİLERİ PAYLAŞMAK YASAKTIR\`\n\n` +
                `⚪ **Onay**\n` +
                `↳ Listeyi görüntülemek için onay verin.`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_list_keys').setLabel('Onaylıyorum').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel_list_keys').setLabel('İptal Et').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [warnEmbed], components: [row], ephemeral: true });
    },
};