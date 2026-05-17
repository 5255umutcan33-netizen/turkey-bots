const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key'); // Veritabanı modelin

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keysil')
        .setDescription('Sistemden belirtilen anahtarı veya kullanıcının anahtarını siler.')
        .addStringOption(option =>
            option.setName('hedef')
                .setDescription('Silinecek Kullanıcının ID\'si veya Tam Anahtar (LUA-USER-...)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Sadece yetkililer kullanabilir
        
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); // Gizli yanıt
        
        const hedef = interaction.options.getString('hedef').trim();
        
        try {
            // Veritabanında adamın ID'sine veya direkt Key'in kendisine göre arama yapıp siliyoruz
            const deletedKey = await KeyModel.findOneAndDelete({ 
                $or: [
                    { owner: hedef }, 
                    { key: hedef }
                ] 
            });

            // Eğer veritabanında böyle bir şey yoksa
            if (!deletedKey) {
                return interaction.editReply({ 
                    content: `❌ **Veritabanında \`${hedef}\` ile eşleşen aktif bir anahtar bulunamadı!**` 
                });
            }

            // Başarıyla silindiyse havalı bir log/bilgi mesajı atıyoruz
            const successEmbed = new EmbedBuilder()
                .setTitle('🗑️ LUAWARE | Anahtar İmha Edildi')
                .setColor('#ED4245')
                .setDescription(`Sistemden bir lisans başarıyla kalıcı olarak silindi.`)
                .addFields(
                    { name: '👤 Sahibinin ID', value: `<@${deletedKey.owner}> (\`${deletedKey.owner}\`)`, inline: true },
                    { name: '🔑 Silinen Key', value: `\`${deletedKey.key}\``, inline: true }
                )
                .setFooter({ text: `LUAWARE Security | İşlemi Yapan: ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error("Key Silme Hatası:", error);
            await interaction.editReply({ content: '❌ **Veritabanında işlem yapılırken bir hata oluştu!**' });
        }
    },
};