const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verifykur')
        .setDescription('Sunucu girişindeki bayraklı doğrulama sistemini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('💬 RYPHERA OS | VERIFICATION')
            .setColor('#2B2D31')
            .setDescription('>>> 👋 **Welcome to Ryphera OS!**\nPlease select your language to verify and see the server channels.\n\n👋 **Ryphera OS\'a Hoş Geldiniz!**\nSunucu kanallarını görmek ve doğrulanmak için lütfen dilinizi seçin.')
            .setFooter({ text: 'Ryphera Scripting Solutions' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('verify_tr').setLabel('Türkçe').setEmoji('🇹🇷').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('verify_en').setLabel('English').setEmoji('🇬🇧').setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '`Doğrulama sistemi mermi gibi kuruldu.`', ephemeral: true });
    },
};