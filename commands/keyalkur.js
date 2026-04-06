const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keyalkur')
        .setDescription('Key alma panelini kurar (Turkish)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const trEmbed = new EmbedBuilder()
            .setTitle('🇹🇷 TURKEY HUB | KEY SİSTEMİ')
            .setDescription('**Sınırsız** erişim anahtarı almak için butona bas kanka.\n\n⚠️ Sunucudan çıkarsan keyin anında silinir!')
            .setColor('#FF0000');

        const trRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_key_tr').setLabel('🔑 Key Al').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [trEmbed], components: [trRow] });
    },
};