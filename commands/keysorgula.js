const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keysorgula')
        .setDescription('🔍 Belirtilen kullanıcının lisans anahtarı bilgilerini gösterir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Anahtarını sorgulamak istediğiniz kişi')
                .setRequired(true)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');

        try {
            const userKey = await KeyModel.findOne({ owner: targetUser.id });

            if (!userKey) {
                return interaction.reply({ content: `❌ <@${targetUser.id}> adlı kullanıcının sistemimizde kayıtlı bir lisansı yok.`, ephemeral: true });
            }

            const hwidStatus = userKey.hwid ? `\`${userKey.hwid}\`` : '`Boş (Henüz girilmemiş)`';
            const gosterilenID = userKey.licenseId ? `#${userKey.licenseId}` : 'Eski Sürüm Key';

            // 💎 PREMİUM FORMAT
            const embed = new EmbedBuilder()
                .setTitle('Ryphera | Lisans Sorgulama')
                .setColor('#FEE75C')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setDescription(
                    `👤 **Kullanıcı -->** <@${targetUser.id}>\n` +
                    `🆔 **5 Haneli ID -->** \`${gosterilenID}\`\n` +
                    `🔑 **Lisans Anahtarı -->** \`${userKey.key}\`\n` +
                    `💻 **Cihaz Kilidi (HWID) -->** ${hwidStatus}\n` +
                    `⌛ **Lisans Süresi -->** \`${userKey.expiry}\``
                )
                .setFooter({ text: 'Ryphera OS Database' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await interaction.reply({ content: '❌ Veritabanı sorgu hatası.', ephemeral: true });
        }
    },
};