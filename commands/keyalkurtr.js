const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keyalkurtr')
        .setDescription('Türkçe lisans panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const trEmbed = new EmbedBuilder()
            .setTitle('RYPHERA | LİSANS SİSTEMİ')
            .setColor('#FF0000')
            .setDescription(
                `Durum: \`AKTİF\`\n` +
                `Sistem: \`RYPHERA OS\`\n\n` +
                `Aşağıdaki butona basarak anahtarını alabilirsin.\n` +
                `Sunucudan çıkarsan anahtarın \`OTOMATİK\` silinir.`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_key_tr').setLabel('Anahtar Al').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [trEmbed], components: [row] });
    },
};