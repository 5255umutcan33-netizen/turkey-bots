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
        if (sorgu.startsWith('#')) sorgu = sorgu.substring(1); 
        
        await interaction.deferReply({ ephemeral: true });

        try {
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

            keyData.hwid = null;
            await keyData.save();

            const embed = new EmbedBuilder()
                .setTitle('✅ HWID Sıfırlandı')
                .setColor('#57F287')
                .setDescription(`🆔 **#${keyData.licenseId || 'ID Yok'}** numaralı (\`${keyData.key}\`) lisansın donanım kilidi başarıyla kaldırıldı!`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: '❌ Veritabanında bir hata oluştu.' });
        }
    },
};