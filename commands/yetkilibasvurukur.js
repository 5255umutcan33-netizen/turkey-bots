const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetkilibasvurukur')
        .setDescription('Türkçe yetkili başvuru menüsünü kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📩 RYPHERA OS | YETKİLİ BAŞVURU')
            .setColor('#2B2D31')
            .setDescription('>>> 👋 **Ekibimize Katılmak İster misiniz?**\n\nRyphera OS ailesine dahil olmak ve sunucumuzun gelişimine katkıda bulunmak için aşağıdaki butona basarak formu doldurabilirsiniz.')
            .setFooter({ text: 'Ryphera Staff System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apply_tr')
                .setLabel('Başvuru Yap')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '`Başvuru menüsü başarıyla kuruldu.`', ephemeral: true });
    },
};