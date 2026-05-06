const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tryetkilibasvurukur')
        .setDescription('Türkçe yetkili başvuru menüsünü kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        
        // --- KULLANICILARIN GÖRECEĞİ LUAWARE BAŞVURU EKRANI ---
        const embed = new EmbedBuilder()
            .setTitle('📩 LUAWARE | Yetkili Başvuru Formu')
            .setColor('#00D4FF') // LUAWARE Teması
            .setDescription(
                `👋 **LUAWARE Ekibine Katılma Fırsatı!**\n\n` +
                `📌 **Durum -->** \`🟢 Alımlar Aktif\`\n` +
                `💼 **Pozisyon -->** \`Moderatör / Destek Ekibi\`\n` +
                `📝 **İşlem -->** \`Başvuru formunu açmak için aşağıdaki butona tıklayın.\`\n\n` +
                `⚠️ *Not: Başvurular titizlikle incelenmektedir. Formu eksiksiz doldurduğunuzdan emin olun.*`
            )
            .setFooter({ text: 'LUAWARE Staff System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apply_tr')
                .setLabel('Başvuru Yap')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // --- SADECE SANA GÖRÜNECEK ONAY MESAJI ---
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Kurulum Başarılı')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`Türkçe Yetkili Başvuru Menüsü Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Oluşturuldu\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};