const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feedbackkur')
        .setDescription('💬 LUAWARE | Geri bildirim (Feedback) panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🌟 LUAWARE OS | Geri Bildirim & Feedback')
            .setColor('#2B2D31')
            .setDescription(
                "🇹🇷 **Hizmetlerimiz hakkında ne düşünüyorsunuz?**\nGörüşlerinizi, önerilerinizi veya şikayetlerinizi bizimle paylaşmak için aşağıdaki butona tıklayın.\n\n" +
                "🇬🇧 **What do you think about our services?**\nClick the button below to share your thoughts, suggestions, or complaints with us."
            )
            .setFooter({ text: 'LUAWARE Customer Satisfaction' })
            .setThumbnail(interaction.client.user.displayAvatarURL());

        const button = new ButtonBuilder()
            .setCustomId('feedback_start')
            .setLabel('Gönder / Submit')
            .setEmoji('💬')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ LUAWARE Feedback paneli başarıyla bu kanala kuruldu!', ephemeral: true });
    }
};