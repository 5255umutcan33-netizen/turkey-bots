const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kullanicikeysorgula')
        .setDescription('Seçtiğiniz kullanıcının anahtar bilgilerini gösterir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Lisansını sorgulamak istediğiniz kişiyi seçin')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        // Komuttan seçilen kullanıcıyı alıyoruz
        const hedefKullanici = interaction.options.getUser('kullanici');
        
        try {
            // Seçilen kişinin Discord ID'sine göre veritabanında arama yapıyoruz
            const keyData = await KeyModel.findOne({ owner: hedefKullanici.id });

            if (!keyData) {
                return interaction.editReply({ content: `❌ **<@${hedefKullanici.id}> adlı kullanıcının sistemde aktif bir lisansı bulunmuyor!**` });
            }

            const infoEmbed = new EmbedBuilder()
                .setTitle('🔍 LUAWARE | Lisans Sorgu Sonucu')
                .setColor('#00D4FF')
                .setThumbnail(hedefKullanici.displayAvatarURL({ dynamic: true })) // Adamın profil resmini de ekledik şov olsun
                .addFields(
                    { name: '👤 Sahibi (Discord)', value: `<@${keyData.owner}> (\`${keyData.owner}\`)`, inline: false },
                    { name: '🔑 Anahtar (Key)', value: `\`${keyData.key}\``, inline: false },
                    { name: '🆔 Anahtar ID (Key ID)', value: `\`#${keyData.licenseId || 'Tanımsız'}\``, inline: true },
                    { name: '⏳ Bitiş Süresi', value: `\`${keyData.expiry}\``, inline: true },
                    { name: '💻 HWID Kilitli Mi?', value: keyData.hwid ? `\`Evet (${keyData.hwid})\`` : '\`Hayır (Boş)\`', inline: false }
                )
                .setFooter({ text: `LUAWARE V1 | Sorgulayan: ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [infoEmbed] });
        } catch (error) {
            console.error("Sorgu Hatası:", error);
            await interaction.editReply({ content: '❌ **Sorgulama sırasında bir veritabanı hatası oluştu!**' });
        }
    },
};