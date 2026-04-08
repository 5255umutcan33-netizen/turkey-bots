const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('🔓 Bir kullanıcının yasaklamasını kaldırır.')
        .addStringOption(option => option.setName('uid').setDescription('Yasaklaması kalkacak kişinin ID\'si').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
        
    async execute(interaction) {
        const userId = interaction.options.getString('uid');
        const logChannelId = '1491416572143599768';

        try {
            await interaction.guild.members.unban(userId);
            
            // 💎 LOG KANALINA GİDECEK PREMİUM RAPOR
            const logEmbed = new EmbedBuilder()
                .setTitle('🔓 Ryphera | Yasaklama Kaldırıldı')
                .setColor('#57F287')
                .setDescription(
                    `👤 **Yasağı Kalkan ID -->** \`${userId}\`\n` +
                    `👮 **İşlemi Yapan -->** <@${interaction.user.id}>\n` +
                    `✅ **Durum -->** \`Yasaklama Başarıyla Kaldırıldı\`\n` +
                    `📅 **İşlem Zamanı -->** <t:${Math.floor(Date.now() / 1000)}:f>`
                )
                .setFooter({ text: 'Ryphera OS Moderation' })
                .setTimestamp();

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) await logChannel.send({ embeds: [logEmbed] });

            // 💎 KOMUTU KULLANANA GİDECEK PREMİUM YANIT
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ İşlem Başarılı')
                .setColor('#57F287')
                .setDescription(
                    `⚙️ **İşlem -->** \`Yasak Kaldırma (Unban)\`\n` +
                    `🆔 **Hedef ID -->** \`${userId}\`\n` +
                    `✅ **Durum -->** \`Kullanıcının Sunucuya Giriş Engeli Kaldırıldı\``
                );

            return interaction.reply({ embeds: [successEmbed], ephemeral: true });

        } catch (e) {
            // 💎 HATA DURUMUNDA GİDECEK PREMİUM YANIT
            const failEmbed = new EmbedBuilder()
                .setTitle('⚠️ İşlem Başarısız')
                .setColor('#FEE75C')
                .setDescription(
                    `⚙️ **İşlem -->** \`Yasak Kaldırma (Unban)\`\n` +
                    `❌ **Hata -->** \`Yasak kaldırılamadı. Böyle bir ban bulunamadı veya ID hatalı!\``
                );
            return interaction.reply({ embeds: [failEmbed], ephemeral: true });
        }
    },
};