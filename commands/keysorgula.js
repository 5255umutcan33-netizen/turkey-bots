const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key.js'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keysorgulakey')
        .setDescription('LUAWARE sistemindeki bir lisansı Key (LUA-USER...) veya ID ile sorgular.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('veri')
            .setDescription('Sorgulanacak tam Key (Örn: LUA-USER-ABCD) veya 5 Haneli ID')
            .setRequired(true)
        ),

    async execute(interaction) {
        const arananVeri = interaction.options.getString('veri').toUpperCase().trim();
        await interaction.deferReply({ ephemeral: true }); 

        try {
            const data = await KeyModel.findOne({ 
                $or: [
                    { key: arananVeri },
                    { licenseId: arananVeri }
                ]
            });

            if (!data) {
                return interaction.editReply({ content: `❌ **${arananVeri}** bilgisine ait bir lisans bulunamadı! Key süresi dolmuş veya yanlış yazılmış olabilir.` });
            }

            const creationTime = data._id.getTimestamp().getTime();
            const elapsedHours = (Date.now() - creationTime) / (1000 * 60 * 60);
            const kalanSaat = data.expiry === '24 Saat' ? Math.max(0, (24 - elapsedHours)).toFixed(1) : 'Sınırsız';

            const embed = new EmbedBuilder()
                .setTitle('🔍 LUAWARE | Key İstihbarat Raporu')
                .setColor('#00D4FF')
                .addFields(
                    { name: '🆔 Lisans ID', value: `\`#${data.licenseId || 'Bilinmiyor'}\``, inline: true },
                    { name: '🔑 Tam Anahtar', value: `\`${data.key}\``, inline: true },
                    { name: '🌐 Kayıtlı IP Adresi', value: `||${data.owner}||`, inline: false },
                    { name: '⏳ Kalan Süre', value: `**${kalanSaat} Saat**`, inline: true },
                    { name: '💻 HWID Durumu', value: data.hwid ? `🔒 Kilitli (\`${data.hwid.substring(0, 10)}...\`)` : '🔓 Henüz Kullanılmadı', inline: true }
                )
                .setFooter({ text: 'LUAWARE Security OS' })
                .setTimestamp(data._id.getTimestamp());

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Sorgulama Hatası:", error);
            await interaction.editReply({ content: '❌ Veritabanı sorgusunda bir hata oluştu!' });
        }
    }
};