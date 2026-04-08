const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trscriptonerikur')
        .setDescription('Türkçe script öneri panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        
        // 💎 KULLANICILARIN GÖRECEĞİ PREMIUM ÖNERİ EKRANI
        const embed = new EmbedBuilder()
            .setTitle('💡 Ryphera OS | Script Önerisi')
            .setColor('#2B2D31')
            .setDescription(
                `👋 **Harika bir fikrin mi var?**\n\n` +
                `📌 **Durum -->** \`Öneriler Açık\`\n` +
                `🎮 **Konu -->** \`Script & Oyun Özellikleri\`\n` +
                `📝 **İşlem -->** \`Fikrini belirtmek için aşağıdaki butona tıkla.\`\n\n` +
                `⚠️ **Dikkat!! ÖNERİLERİNİZ GELECEK GÜNCELLEMELERİMİZİ ŞEKİLLENDİRİR**`
            )
            .setFooter({ text: 'Ryphera OS System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('suggest_script_tr')
                .setLabel('Script Öner')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('💡')
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // 💎 SADECE SANA GÖRÜNECEK PREMIUM ONAY MESAJI
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Kurulum Başarılı')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`Türkçe Script Öneri Menüsü Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Oluşturuldu\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};