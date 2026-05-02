const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify2')
        .setDescription('LUAWARE Dil Seçimli Doğrulama Paneli Kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("LUAWARE | VERIFICATION")
            .setDescription("Lütfen dilinizi seçerek sunucuya giriş yapın.\nPlease select your language to enter the server.")
            .setColor(0x00D4FF)
            .setThumbnail(interaction.guild.iconURL());

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_tr')
                    .setLabel('Türkçe')
                    .setEmoji('🇹🇷')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('verify_en')
                    .setLabel('English')
                    .setEmoji('🇬🇧')
                    .setStyle(ButtonStyle.Secondary),
            );

        await interaction.reply({ content: 'Doğrulama paneli başarıyla oluşturuldu.', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    },
};