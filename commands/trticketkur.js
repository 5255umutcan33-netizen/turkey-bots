const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trticketkur')
        .setDescription('Profesyonel Türkçe bilet (ticket) sistemini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        
        // 💎 KULLANICILARIN GÖRECEĞİ PREMIUM BİLET EKRANI
        const embed = new EmbedBuilder()
            .setTitle('💬 Ryphera OS | Destek Sistemi')
            .setColor('#2B2D31')
            .setDescription(
                `👋 **Yardıma mı ihtiyacınız var?**\n\n` +
                `📌 **Durum -->** \`Destek Aktif\`\n` +
                `🏢 **Departmanlar -->** \`Destek, İş Birliği, Key İşlemleri\`\n` +
                `📝 **İşlem -->** \`Bilet oluşturmak için aşağıdaki departmanlardan birini seçin.\`\n\n` +
                `⚠️ **Dikkat!! AYNI KONU İÇİN BİRDEN FAZLA BİLET AÇMAYIN**`
            )
            .setFooter({ text: 'Ryphera OS System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_tr_support').setLabel('Destek').setEmoji('📩').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_tr_partner').setLabel('İş Birliği').setEmoji('🤝').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_tr_key').setLabel('Key İşlemleri').setEmoji('🔑').setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // 💎 SADECE SANA GÖRÜNECEK PREMIUM ONAY MESAJI
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Kurulum Başarılı')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`Türkçe Ticket Menüsü Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Oluşturuldu\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};