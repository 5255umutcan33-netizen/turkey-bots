const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('🤐 Bir kullanıcıyı susturur (Timeout).')
        .addUserOption(option => option.setName('kisi').setDescription('Susturulacak kişi').setRequired(true))
        .addIntegerOption(option => option.setName('sure').setDescription('Dakika cinsinden süre').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Susturma sebebi').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
        
    async execute(interaction) {
        const member = interaction.options.getMember('kisi');
        const duration = interaction.options.getInteger('sure');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi.';
        const logChannelId = '1491416464240935052';

        // 💎 HATA: KULLANICI BULUNAMADI PREMİUM YANIT
        if (!member) {
            const notFoundEmbed = new EmbedBuilder()
                .setTitle('⚠️ İşlem Başarısız')
                .setColor('#FEE75C')
                .setDescription(
                    `⚙️ **İşlem -->** \`Kullanıcı Susturma (Mute)\`\n` +
                    `❌ **Hata -->** \`Kullanıcı sunucuda bulunamadı!\``
                );
            return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
        }

        try {
            await member.timeout(duration * 60 * 1000, reason);
            
            // 💎 LOG KANALINA GİDECEK PREMİUM İNFAZ TUTANAĞI
            const logEmbed = new EmbedBuilder()
                .setTitle('🤐 Ryphera | Kullanıcı Susturuldu')
                .setColor('#FEE75C') // Mute için sarı/uyarı rengi
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setDescription(
                    `👤 **Susturulan -->** <@${member.id}> (\`${member.user.tag}\`)\n` +
                    `🆔 **Kullanıcı ID -->** \`${member.id}\`\n` +
                    `⏳ **Süre -->** \`${duration} Dakika\`\n` +
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
                    `⚙️ **İşlem -->** \`Kullanıcı Susturma (Mute)\`\n` +
                    `👤 **Hedef -->** <@${member.id}>\n` +
                    `⏳ **Süre -->** \`${duration} Dakika\`\n` +
                    `✅ **Durum -->** \`Sohbetten Uzaklaştırıldı (Timeout)\``
                );

            return interaction.reply({ embeds: [successEmbed], ephemeral: true });

        } catch (e) {
            // 💎 HATA DURUMUNDA GİDECEK PREMİUM YANIT
            const failEmbed = new EmbedBuilder()
                .setTitle('⚠️ İşlem Başarısız')
                .setColor('#ED4245')
                .setDescription(
                    `⚙️ **İşlem -->** \`Kullanıcı Susturma (Mute)\`\n` +
                    `❌ **Hata -->** \`Kullanıcı susturulamıyor. Benden üst yetkide olabilir veya yetkim yok!\``
                );
            return interaction.reply({ embeds: [failEmbed], ephemeral: true });
        }
    },
};