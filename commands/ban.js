const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('🔨 Bir kullanıcıyı sunucudan yasaklar.')
        .addUserOption(option => option.setName('kisi').setDescription('Yasaklanacak kişi').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Yasaklama sebebi').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
        
    async execute(interaction) {
        const user = interaction.options.getUser('kisi');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi.';
        const logChannelId = '1491416428291559445';

        try {
            await interaction.guild.members.ban(user, { reason });
            
            // 💎 LOG KANALINA GİDECEK PREMİUM İNFAZ TUTANAĞI
            const logEmbed = new EmbedBuilder()
                .setTitle('🔨 Ryphera | Kullanıcı Yasaklandı')
                .setColor('#ED4245')
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setDescription(
                    `👤 **Yasaklanan -->** <@${user.id}> (\`${user.tag}\`)\n` +
                    `🆔 **Kullanıcı ID -->** \`${user.id}\`\n` +
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
                    `⚙️ **İşlem -->** \`Kullanıcı Yasaklama (Ban)\`\n` +
                    `👤 **Hedef -->** <@${user.id}>\n` +
                    `✅ **Durum -->** \`Sunucudan Uçuruldu\``
                );

            return interaction.reply({ embeds: [successEmbed], ephemeral: true });

        } catch (e) {
            // 💎 HATA DURUMUNDA GİDECEK PREMİUM YANIT
            const failEmbed = new EmbedBuilder()
                .setTitle('⚠️ İşlem Başarısız')
                .setColor('#FEE75C')
                .setDescription(
                    `⚙️ **İşlem -->** \`Kullanıcı Yasaklama (Ban)\`\n` +
                    `❌ **Hata -->** \`Kullanıcıyı banlayamıyorum. Benden üst yetkide olabilir veya yetkim yok!\``
                );
            return interaction.reply({ embeds: [failEmbed], ephemeral: true });
        }
    },
};