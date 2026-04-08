const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hwidsifirla')
        .setDescription('🛠️ 5 Haneli ID veya Key ile HWID sıfırlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('veri')
                .setDescription('Lisansın 5 Haneli ID\'si (Örn: 48152) veya Anahtarın Kendisi')
                .setRequired(true)),

    async execute(interaction) {
        let sorgu = interaction.options.getString('veri').trim();
        // Eğer adam ID'nin başına # koyduysa onu temizleyelim ki veritabanı hata vermesin
        if (sorgu.startsWith('#')) sorgu = sorgu.substring(1); 
        
        await interaction.deferReply({ ephemeral: true });

        try {
            // Önce 5 haneli ID'ye göre ara, bulamazsa direkt Key metnine göre ara
            let keyData = await KeyModel.findOne({ licenseId: sorgu });
            if (!keyData) {
                keyData = await KeyModel.findOne({ key: sorgu });
            }

            if (!keyData) {
                return interaction.editReply({ content: '❌ **Bulunamadı:** Girdiğiniz 5 haneli ID veya Anahtara ait bir kayıt yok!' });
            }

            if (!keyData.hwid) {
                return interaction.editReply({ content: `⚠️ \`#${keyData.licenseId || 'ID Yok'}\` numaralı anahtarın HWID kilidi zaten **BOŞ** durumda.` });
            }

            // HWID'yi sıfırla
            keyData.hwid = null;
            await keyData.save();

            const embed = new EmbedBuilder()
                .setTitle('✅ HWID Sıfırlandı')
                .setColor('#57F287')
                .setDescription(`🆔 **#${keyData.licenseId || 'ID Yok'}** numaralı (\`${keyData.key}\`) lisansın donanım kilidi başarıyla kaldırıldı!`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // --- 📌 HWID SIFIRLAMA LOGU BURADA ---
            const LOG_CHANNEL_ID = '1491489608041762926'; // İstediğin log kanalı
            const logChannel = interaction.client.channels.cache.get(LOG_CHANNEL_ID);
            
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🛠️ HWID SIFIRLANDI')
                    .setColor('#ED4245') // Kırmızı renk dikkat çekici olur
                    .addFields(
                        { name: '👮 İşlemi Yapan Yetkili', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '👤 Lisans Sahibi', value: `<@${keyData.owner}>`, inline: true },
                        { name: '🆔 5 Haneli ID', value: `\`#${keyData.licenseId || 'Eski Sürüm'}\``, inline: true },
                        { name: '🔑 Lisans Anahtarı', value: `\`${keyData.key}\``, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Ryphera OS HWID Reset System' });

                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }

        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: '❌ Veritabanında bir hata oluştu.' });
        }
    },
};