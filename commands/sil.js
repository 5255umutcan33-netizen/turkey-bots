const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sil')
        .setDescription('🧹 Belirtilen sayıda mesajı temizler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option => 
            option.setName('sayı')
                .setDescription('Silinecek mesaj sayısı (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(interaction) {
        const miktar = interaction.options.getInteger('sayı');

        await interaction.channel.bulkDelete(miktar, true).then(mesajlar => {
            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setDescription(`✅ **Başarılı:** ${mesajlar.size} adet mesaj süpürüldü!`);
            
            interaction.reply({ embeds: [embed] }).then(() => {
                setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
            });
        }).catch(err => {
            interaction.reply({ content: '❌ 14 günden eski mesajları silemem kanka!', ephemeral: true });
        });
    },
};