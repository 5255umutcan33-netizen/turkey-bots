const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keylerisil')
        .setDescription('Sistemi tamamen sıfırlar (Sadece Kurucu).'),
        
    async execute(interaction) {
        const OWNER_ID = '345821033414262794'; 
        
        // 💎 HATA: YETKİ YOK PREMİUM YANIT
        if (interaction.user.id !== OWNER_ID) {
            const noPermEmbed = new EmbedBuilder()
                .setTitle('⛔ Ryphera | Erişim Reddedildi')
                .setColor('#ED4245')
                .setDescription(
                    `⚙️ **İşlem -->** \`Veritabanı Sıfırlama\`\n` +
                    `❌ **Durum -->** \`Yetki Yetersiz\`\n` +
                    `⚠️ **Not -->** \`Yalnızca sistem kurucusu bu işlemi gerçekleştirebilir.\``
                );
            return interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
        }

        // 💎 KRİTİK ONAY EKRANI (DİĞERLERİYLE TAM UYUMLU FORMAT)
        const dangerEmbed = new EmbedBuilder()
            .setTitle('⚠️ Ryphera OS | KRİTİK UYARI')
            .setColor('#ED4245')
            .setDescription(
                `⚙️ **İşlem -->** \`Tüm Veritabanını Sıfırlama\`\n` +
                `🛑 **Risk -->** \`Maksimum (Geri Dönüşü Yokdur!)\`\n` +
                `📊 **Kapsam -->** \`Tüm aktif lisanslar ve veriler silinir.\`\n` +
                `📝 **Onay -->** \`Sıfırlama işlemini başlatmak istiyor musunuz?\``
            )
            .setFooter({ text: 'Ryphera OS Core System' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_delete_all')
                .setLabel('Sistemi Sıfırla')
                .setEmoji('💥')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel_delete_all')
                .setLabel('İşlemi İptal Et')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [dangerEmbed], components: [row], ephemeral: true });
    },
};