const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keyim')
        .setDescription('Sistemde kayıtlı olan mevcut LUAWARE anahtarınızı gösterir.'),

    async execute(interaction) {
        // Güvenlik: Sadece komutu yazan kişi görebilir
        await interaction.deferReply({ ephemeral: true }); 

        try {
            // Veritabanından adamın Discord ID'sine bağlı olan keyi arıyoruz
            const userKey = await KeyModel.findOne({ owner: interaction.user.id });

            // Adamın keyi yoksa uyar
            if (!userKey) {
                return interaction.editReply({ 
                    content: '❌ **Sistemde sana ait aktif bir anahtar bulunamadı!**\nKey almak için lisans kanalındaki "Anahtar Al" butonunu kullanabilirsin.' 
                });
            }

            // Adamın keyi varsa şık bir kart (Embed) ile teslim et
            const keyEmbed = new EmbedBuilder()
                .setTitle('🔑 LUAWARE | Senin Anahtarın')
                .setColor('#00D4FF')
                .setDescription(`Sistemde kayıtlı olan aktif lisans bilgileriniz aşağıdadır:\n\n**\`${userKey.key}\`**`)
                .addFields(
                    { name: '⏳ Kalan Süre', value: `\`${userKey.expiry}\``, inline: true },
                    { name: '💻 HWID Durumu', value: `\`${userKey.hwid ? 'Kilitli 🔒' : 'Serbest 🔓'}\``, inline: true },
                    { name: '🆔 Lisans ID', value: `\`#${userKey.licenseId || 'Bilinmiyor'}\``, inline: true }
                )
                .setFooter({ text: 'LUAWARE Security System', iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            return interaction.editReply({ embeds: [keyEmbed] });

        } catch (err) {
            console.error('Key sorgulama hatası:', err);
            return interaction.editReply({ content: '❌ **Sistem hatası!** Veritabanına bağlanırken bir sorun oluştu.' });
        }
    }
};