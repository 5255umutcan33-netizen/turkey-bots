const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key'); // Veritabanı modelin

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keysorgula')
        .setDescription('🔍 Belirtilen kullanıcının lisans anahtarı bilgilerini gösterir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Sadece yetkililer görebilir
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Anahtarını sorgulamak istediğiniz kişi')
                .setRequired(true)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');

        try {
            // Veritabanında adamı ara
            const userKey = await KeyModel.findOne({ owner: targetUser.id });

            if (!userKey) {
                return interaction.reply({ 
                    content: `❌ <@${targetUser.id}> adlı kullanıcının sistemimizde kayıtlı bir lisans anahtarı bulunmuyor.`, 
                    ephemeral: true 
                });
            }

            // HWID dolu mu boş mu kontrolü
            const hwidStatus = userKey.hwid ? `\`${userKey.hwid}\`` : '`Boş (Henüz girilmemiş)`';

            // Afilli embed mesajı
            const embed = new EmbedBuilder()
                .setTitle('🔍 Ryphera | Lisans Sorgulama')
                .setColor('#FEE75C')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Kullanıcı', value: `<@${targetUser.id}>`, inline: true },
                    { name: '⏳ Lisans Süresi', value: `\`${userKey.expiry}\``, inline: true },
                    { name: '🆔 Veritabanı ID', value: `\`${userKey._id}\``, inline: true },
                    { name: '🔑 Lisans Anahtarı', value: `\`\`\`\n${userKey.key}\n\`\`\``, inline: false },
                    { name: '💻 Cihaz Kilidi (HWID)', value: hwidStatus, inline: false }
                )
                .setFooter({ text: 'Ryphera OS Database Search' })
                .setTimestamp();

            // Sadece komutu kullanan yetkiliye gösterir (ephemeral)
            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Sorgu hatası:', error);
            await interaction.reply({ 
                content: '❌ Veritabanında sorgulama yapılırken bir hata oluştu.', 
                ephemeral: true 
            });
        }
    },
};