const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trticketkur')
        .setDescription('Profesyonel Türkçe bilet (ticket) sistemini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('💬 RYPHERA OS | DESTEK SİSTEMİ')
            .setColor('#2B2D31')
            .setDescription('>>> 👋 **Merhaba!**\n\nLütfen iletişime geçmek istediğiniz departmanı aşağıdaki butonlardan seçin.\nEkibimiz en kısa sürede size dönüş yapacaktır.')
            .setFooter({ text: 'Ryphera Scripting Solutions' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_tr_support').setLabel('Destek').setEmoji('📩').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_tr_partner').setLabel('İş Birliği').setEmoji('🤝').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_tr_key').setLabel('Key İşlemleri').setEmoji('🔑').setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '`Ticket sistemi başarıyla bu kanala kuruldu.`', ephemeral: true });
    },
};