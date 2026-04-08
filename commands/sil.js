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
            
            // 💎 BAŞARILI SİLME PREMİUM RAPORU
            const embed = new EmbedBuilder()
                .setTitle('🧹 Ryphera OS | Temizlik İşlemi')
                .setColor('#57F287')
                .setDescription(
                    `⚙️ **İşlem -->** \`Toplu Mesaj Silme\`\n` +
                    `✅ **Durum -->** \`Başarıyla Tamamlandı\`\n` +
                    `🗑️ **Silinen Mesaj -->** \`${mesajlar.size} Adet\`\n` +
                    `👮 **İşlemi Yapan -->** <@${interaction.user.id}>`
                );
            
            interaction.reply({ embeds: [embed] }).then(() => {
                setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
            });
            
        }).catch(err => {
            
            // 💎 HATA DURUMUNDA GİDECEK PREMİUM YANIT
            const errEmbed = new EmbedBuilder()
                .setTitle('⚠️ İşlem Başarısız')
                .setColor('#ED4245')
                .setDescription(
                    `⚙️ **İşlem -->** \`Toplu Mesaj Silme\`\n` +
                    `❌ **Hata -->** \`Discord kuralları gereği 14 günden eski mesajları silemiyorum!\``
                );
            interaction.reply({ embeds: [errEmbed], ephemeral: true });
            
        });
    },
};