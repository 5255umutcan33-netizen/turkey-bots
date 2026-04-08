const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('🔊 Bir kullanıcının susturmasını (Timeout) kaldırır.')
        .addUserOption(option => option.setName('kisi').setDescription('Susturması kaldırılacak kişi').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Kaldırma sebebi').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const member = interaction.options.getMember('kisi');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi.';
        const logChannelId = '1491416750854770748';

        // 💎 HATA: KULLANICI SUNUCUDA YOKSA
        if (!member) {
            const notFoundEmbed = new EmbedBuilder()
                .setTitle('⚠️ İşlem Başarısız')
                .setColor('#FEE75C')
                .setDescription(
                    `⚙️ **İşlem -->** \`Susturma Kaldırma (Unmute)\`\n` +
                    `❌ **Hata -->** \`Kullanıcı sunucuda bulunamadı!\``
                );
            return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
        }

        // 💎 HATA: SUSTURMASI YOKSA
        if (!member.isCommunicationDisabled()) {
            const activeEmbed = new EmbedBuilder()
                .setTitle('⚠️ İşlem Başarısız')
                .setColor('#FEE75C')
                .setDescription(
                    `⚙️ **İşlem -->** \`Susturma Kaldırma (Unmute)\`\n` +
                    `⚠️ **Durum -->** \`Bu kullanıcının zaten aktif bir susturması bulunmuyor.\``
                );
            return interaction.reply({ embeds: [activeEmbed], ephemeral: true });
        }

        try {
            await member.timeout(null, reason);
            
            // 💎 LOG KANALINA GİDECEK PREMİUM RAPOR
            const logEmbed = new EmbedBuilder()
                .setTitle('🔊 Ryphera | Susturma Kaldırıldı')
                .setColor('#57F287')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setDescription(
                    `👤 **Mutesi Kalkan -->** <@${member.id}> (\`${member.user.tag}\`)\n` +
                    `🆔 **Kullanıcı ID -->** \`${member.id}\`\n` +
                    `👮 **İşlemi Yapan -->** <@${interaction.user.id}>\n` +
                    `📝 **Sebep -->** \`${reason}\`\n` +
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
                    `⚙️ **İşlem -->** \`Susturma Kaldırma (Unmute)\`\n` +
                    `👤 **Hedef -->** <@${member.id}>\n` +
                    `✅ **Durum -->** \`Kullanıcının Ses ve Yazma Engeli Kaldırıldı\``
                );

            return interaction.reply({ embeds: [successEmbed], ephemeral: true });

        } catch (e) {
            // 💎 HATA DURUMUNDA GİDECEK PREMİUM YANIT
            const failEmbed = new EmbedBuilder()
                .setTitle('⚠️ İşlem Başarısız')
                .setColor('#ED4245')
                .setDescription(
                    `⚙️ **İşlem -->** \`Susturma Kaldırma (Unmute)\`\n` +
                    `❌ **Hata -->** \`Susturma kaldırılamadı. Botun yetkisi yetersiz olabilir!\``
                );
            return interaction.reply({ embeds: [failEmbed], ephemeral: true });
        }
    },
};