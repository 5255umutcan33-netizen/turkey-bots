const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mevcutkeyler')
        .setDescription('Tüm lisansları listeler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        
        // 💎 PREMİUM FORMAT EKRANI
        const listEmbed = new EmbedBuilder()
            .setTitle('🔍 Ryphera OS | Veritabanı Sorgusu')
            .setColor('#2B2D31')
            .setDescription(
                `⚙️ **İşlem -->** \`Aktif Lisansları Listeleme\`\n` +
                `⚠️ **Uyarı -->** \`Veritabanındaki tüm lisans anahtarları sayfalar halinde çekilecektir.\`\n` +
                `📝 **Durum -->** \`Devam etmek için aşağıdaki butondan onay verin.\``
            )
            .setFooter({ text: 'Ryphera OS Database Security' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_list_keys')
                .setLabel('Onaylıyorum')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cancel_list_keys')
                .setLabel('İptal')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [listEmbed], components: [row], ephemeral: true });
    },
};