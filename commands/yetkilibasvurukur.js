const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetkilibasvurukur')
        .setDescription('Türkçe yetkili başvuru menüsünü kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        
        // 💎 KULLANICILARIN GÖRECEĞİ PREMIUM BAŞVURU EKRANI
        const embed = new EmbedBuilder()
            .setTitle('📩 Ryphera OS | Yetkili Başvuru Formu')
            .setColor('#2B2D31')
            .setDescription(
                `👋 **Ryphera Ekibine Katılma Fırsatı!**\n\n` +
                `📌 **Durum -->** \`🟢 Alımlar Aktif\`\n` +
                `💼 **Pozisyon -->** \`Moderatör / Destek Ekibi\`\n` +
                `📝 **İşlem -->** \`Başvuru formunu açmak için aşağıdaki butona tıklayın.\`\n\n` +
                `⚠️ **Not!! Başvurular titizlikle incelenmektedir. Formu eksiksiz doldurduğunuzdan emin olun.**`
            )
            .setFooter({ text: 'Ryphera OS Staff System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apply_tr')
                .setLabel('Başvuru Yap')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // 💎 SADECE SANA GÖRÜNECEK PREMIUM ONAY MESAJI
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Kurulum Başarılı')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`Yetkili Başvuru Menüsü Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Oluşturuldu\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};