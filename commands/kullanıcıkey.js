const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kullanicikeysorgula')
        .setDescription('Belirtilen kişinin veya ID\'nin anahtar bilgilerini gösterir.')
        .addStringOption(option =>
            option.setName('sorgu')
                .setDescription('Kullanıcı Discord ID, Key ID veya Tam Key')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const sorgu = interaction.options.getString('sorgu').trim();
        
        try {
            const keyData = await KeyModel.findOne({ 
                $or: [
                    { owner: sorgu }, 
                    { key: sorgu },
                    { licenseId: sorgu }
                ] 
            });

            if (!keyData) {
                return interaction.editReply({ content: `❌ **Veritabanında \`${sorgu}\` ile eşleşen bir lisans bulunamadı!**` });
            }

            const infoEmbed = new EmbedBuilder()
                .setTitle('🔍 LUAWARE | Lisans Sorgu Sonucu')
                .setColor('#00D4FF')
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