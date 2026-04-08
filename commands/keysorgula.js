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
                return interaction.reply({ content: `❌ <@${targetUser.id}> adlı kullanıcının sistemimizde kayıtlı bir lisans anahtarı bulunmuyor.`, ephemeral: true });
            }

            const hwidStatus = userKey.hwid ? `\`${userKey.hwid}\`` : '`Boş (Henüz girilmemiş)`';
            const gosterilenID = userKey.licenseId ? `#${userKey.licenseId}` : 'Eski Sürüm Key';

            const embed = new EmbedBuilder()
                .setTitle('🔍 Ryphera | Lisans Sorgulama')
                .setColor('#FEE75C')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Kullanıcı', value: `<@${targetUser.id}>`, inline: true },
                    { name: '⏳ Lisans Süresi', value: `\`${userKey.expiry}\``, inline: true },
                    { name: '🆔 5 Haneli ID', value: `\`${gosterilenID}\``, inline: false },
                    { name: '🔑 Lisans Anahtarı', value: `\`\`\`\n${userKey.key}\n\`\`\``, inline: false },
                    { name: '💻 Cihaz Kilidi (HWID)', value: hwidStatus, inline: false }
                )
                .setFooter({ text: 'Ryphera OS Database' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await interaction.reply({ content: '❌ Veritabanında sorgulama yapılırken bir hata oluştu.', ephemeral: true });
        }
    },
};