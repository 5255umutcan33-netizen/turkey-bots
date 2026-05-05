const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trscriptonerikur')
        .setDescription('Türkçe script öneri panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        
        // --- KULLANICILARIN GÖRECEĞİ LUAWARE ÖNERİ EKRANI ---
        const embed = new EmbedBuilder()
            .setTitle('💡 LUAWARE | Script & Oyun Önerisi')
            .setColor('#00D4FF') 
            .setDescription(
                `👋 **Harika bir fikrin mi var?**\n\n` +
                `📌 **Durum -->** \`Öneriler Açık\`\n` +
                `🎮 **Konu -->** \`Yeni Script & Özellik Fikirleri\`\n` +
                `📝 **İşlem -->** \`Fikrini belirtmek için aşağıdaki butona tıkla.\`\n\n` +
                `⚠️ *Önerileriniz, gelecekteki LUAWARE güncellemelerini şekillendirecektir!*`
            )
            .setFooter({ text: 'LuaWare Support System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_suggest_tr')
                .setLabel('Script Öner')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝')
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // --- SADECE SANA GÖRÜNECEK ONAY MESAJI ---
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