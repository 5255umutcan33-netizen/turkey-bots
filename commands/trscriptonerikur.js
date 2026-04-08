const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trscriptonerikur')
        .setDescription('Türkçe script öneri panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('💡 RYPHERA OS | SCRİPT ÖNERİSİ')
            .setColor('#5865F2')
            .setDescription('Sistemde görmek istediğiniz oyunları veya script özelliklerini bizimle paylaşın. Ekibimiz isteklerinizi dikkate alarak yeni güncellemeler yapacaktır.\n\n👇 Fikrini belirtmek için aşağıdaki butona tıkla.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('suggest_script_tr').setLabel('Script Öner').setStyle(ButtonStyle.Primary).setEmoji('💡')
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Türkçe Öneri Paneli bu kanala başarıyla kuruldu!', ephemeral: true });
    },
};