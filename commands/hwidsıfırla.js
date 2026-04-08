const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hwidsifirla')
        .setDescription('🛠️ 5 Haneli ID veya Key ile HWID sıfırlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('veri')
                .setDescription('Lisansın 5 Haneli ID\'si (Örn: 48152) veya Anahtarı')
                .setRequired(true)),

    async execute(interaction) {
        let sorgu = interaction.options.getString('veri').trim();
        if (sorgu.startsWith('#')) sorgu = sorgu.substring(1); 
        await interaction.deferReply({ ephemeral: true });

        try {
            let keyData = await KeyModel.findOne({ licenseId: sorgu }) || await KeyModel.findOne({ key: sorgu });

            if (!keyData) return interaction.editReply({ content: '❌ **Bulunamadı:** 5 haneli ID veya Anahtar geçersiz!' });
            if (!keyData.hwid) return interaction.editReply({ content: `⚠️ \`#${keyData.licenseId || 'ID Yok'}\` numaralı keyin HWID kilidi zaten **BOŞ**.` });

            keyData.hwid = null;
            await keyData.save();

            // 💎 BAŞARI MESAJI (PREMİUM FORMAT)
            const embed = new EmbedBuilder()
                .setTitle('✅ HWID Başarıyla Sıfırlandı')
                .setColor('#57F287')
                .setDescription(
                    `🆔 **Lisans ID -->** \`#${keyData.licenseId || 'ID Yok'}\`\n` +
                    `🔑 **Lisans Anahtarı -->** \`${keyData.key}\`\n` +
                    `🛠️ **Durum -->** Donanım kilidi (HWID) tamamen temizlendi.`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // 💎 LOG KANALI MESAJI (PREMİUM FORMAT)
            const LOG_CHANNEL_ID = '1491489608041762926'; 
            const logChannel = interaction.client.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🛠️ HWID Sıfırlama Logu')
                    .setColor('#ED4245')
                    .setDescription(
                        `👮 **İşlemi Yapan Yetkili -->** <@${interaction.user.id}>\n` +
                        `👤 **Lisans Sahibi -->** <@${keyData.owner}>\n` +
                        `🆔 **5 Haneli ID -->** \`#${keyData.licenseId || 'Eski Sürüm'}\`\n` +
                        `🔑 **Lisans Anahtarı -->** \`${keyData.key}\``
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        } catch (err) { await interaction.editReply({ content: '❌ Veritabanı hatası.' }); }
    },
};