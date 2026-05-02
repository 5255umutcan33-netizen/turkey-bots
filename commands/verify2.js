const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify2')
        .setDescription('Doğrulama panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Sadece adminler açabilir

    async execute(interaction) {
        // --- AYARLAR ---
        const verifyChannelId = "1500266130495897722";
        const trRoleId = "BURAYA_TURKISH_ROL_ID_YAZ"; // Discord'dan Turkish rolünün ID'sini al
        const enRoleId = "BURAYA_ENGLISH_ROL_ID_YAZ"; // Discord'dan English rolünün ID'sini al

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

        await interaction.reply({ content: 'Doğrulama paneli kuruluyor...', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    },
};