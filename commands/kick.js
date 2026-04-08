const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('👢 Bir kullanıcıyı sunucudan atar (Kick).')
        .addUserOption(option => option.setName('kisi').setDescription('Atılacak kişi').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Atılma sebebi').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
        
    async execute(interaction) {
        const targetMember = interaction.options.getMember('kisi');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi.';
        const logChannelId = '1491416445064712305';

        // 💎 HATA: KULLANICI BULUNAMADI PREMİUM YANIT
        if (!targetMember) {
            const notFoundEmbed = new EmbedBuilder()
                .setTitle('⚠️ İşlem Başarısız')
                .setColor('#FEE75C')
                .setDescription(
                    `⚙️ **İşlem -->** \`Kullanıcı Atma (Kick)\`\n` +
                    `❌ **Hata -->** \`Kullanıcı sunucuda bulunamadı!\``
                );
            return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
        }

        try {
            await targetMember.kick(reason);
            
            // 💎 LOG KANALINA GİDECEK PREMİUM İNFAZ TUTANAĞI
            const logEmbed = new EmbedBuilder()
                .setTitle('👢 Ryphera | Kullanıcı Atıldı')
                .setColor('#E67E22') // Ban ile karışmaması için turuncu yapıldı
                .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
                .setDescription(
                    `👤 **Atılan -->** <@${targetMember.id}> (\`${targetMember.user.tag}\`)\n` +
                    `🆔 **Kullanıcı ID -->** \`${targetMember.id}\`\n` +
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
                    `⚙️ **İşlem -->** \`Kullanıcı Atma (Kick)\`\n` +
                    `👤 **Hedef -->** <@${targetMember.id}>\n` +
                    `✅ **Durum -->** \`Sunucudan Atıldı (Kicklendi)\``
                );

            return interaction.reply({ embeds: [successEmbed], ephemeral: true });

        } catch (e) {
            // 💎 HATA DURUMUNDA GİDECEK PREMİUM YANIT
            const failEmbed = new EmbedBuilder()
                .setTitle('⚠️ İşlem Başarısız')
                .setColor('#ED4245')
                .setDescription(
                    `⚙️ **İşlem -->** \`Kullanıcı Atma (Kick)\`\n` +
                    `❌ **Hata -->** \`Kullanıcı atılamıyor. Benden üst yetkide olabilir veya yetkim yok!\``
                );
            return interaction.reply({ embeds: [failEmbed], ephemeral: true });
        }
    },
};