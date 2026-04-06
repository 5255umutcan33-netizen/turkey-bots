const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mevcutkeyler')
        .setDescription('Veritabanındaki tüm keyleri listeler (Admin Özel)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const warnEmbed = new EmbedBuilder()
            .setTitle('⚠️ GÜVENLİK UYARISI')
            .setDescription('Bu komut tüm lisans anahtarlarını ve kullanıcı bilgilerini listeler.\n\n**Bu komutu herkese açık bir alanda kullanmamanızı öneririm!**\n\nDevam etmek istiyor musunuz?')
            .setColor('#FFA500');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_list_keys')
                .setLabel('Onaylıyorum')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cancel_list_keys')
                .setLabel('Onaylamıyorum')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [warnEmbed], components: [row], ephemeral: true });
    },
};