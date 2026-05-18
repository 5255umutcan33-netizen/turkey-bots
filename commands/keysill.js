const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key.js'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keysil')
        .setDescription('Sistemden anahtarı siler (ID, Key veya Discord ID ile).')
        .addStringOption(option =>
            option.setName('hedef')
                .setDescription('Silinecek Kullanıcının Discord IDsi, Key IDsi veya Tam Anahtarı')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const hedef = interaction.options.getString('hedef').trim();
        
        try {
            // Hem Discord ID, hem Anahtar, hem de Key ID'sine göre aratıp anında siliyoruz
            const deletedKey = await KeyModel.findOneAndDelete({ 
                $or: [
                    { owner: hedef }, 
                    { key: hedef },
                    { licenseId: hedef }
                ] 
            });

            if (!deletedKey) {
                return interaction.editReply({ content: `❌ **Veritabanında \`${hedef}\` ile eşleşen bir lisans bulunamadı!**` });
            }

            const successEmbed = new EmbedBuilder()
                .setTitle('🗑️ LUAWARE | Anahtar Silindi')
                .setColor('#ED4245')
                .addFields(
                    { name: '👤 Sahibi', value: `<@${deletedKey.owner}>`, inline: true },
                    { name: '🔑 Key', value: `\`${deletedKey.key}\``, inline: true },
                    { name: '🆔 Key ID', value: `\`#${deletedKey.licenseId || 'Yok'}\``, inline: true }
                )
                .setFooter({ text: `LUAWARE V1 | Yetkili: ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error("Key Silme Hatası:", error);
            await interaction.editReply({ content: '❌ **Sistem hatası! Lütfen konsolu kontrol edin.**' });
        }
    },
};