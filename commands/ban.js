const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('🔨 LUAWARE | Bir kullanıcıyı sunucudan uçurur.')
        .addUserOption(option => 
            option.setName('kisi')
                .setDescription('Yasaklanacak kişi')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tur')
                .setDescription('Yasaklama türünü seçin')
                .setRequired(true)
                .addChoices(
                    { name: '👤 Hesap Banı (Standart)', value: 'account' },
                    { name: '🌐 IP Ban (Tam Kısıtlama)', value: 'ip' }
                ))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Yasaklama sebebi')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
        
    async execute(interaction) {
        const user = interaction.options.getUser('kisi');
        const banType = interaction.options.getString('tur');
        const reason = interaction.options.getString('reason') || 'LUAWARE Security: Sebep belirtilmedi.';
        const logChannelId = '1491416428291559445';

        // Ban türüne göre açıklama belirle
        const typeText = banType === 'ip' ? '🌐 IP Ban (IP + Hesap)' : '👤 Hesap Banı';

        try {
            // IP Ban seçilirse son 7 gündeki mesajlarını da temizleyelim (Daha ağır bir ceza gibi hissettirir)
            const deleteMessages = banType === 'ip' ? 604800 : 0; // 7 gün saniye cinsinden

            await interaction.guild.members.ban(user, { 
                deleteMessageSeconds: deleteMessages,
                reason: `[${typeText}] | ${reason}` 
            });
            
            // 💎 LOG KANALINA GİDECEK LUAWARE İNFAZ TUTANAĞI
            const logEmbed = new EmbedBuilder()
                .setTitle('🔨 LUAWARE OS | İnfaz Gerçekleşti')
                .setColor('#ED4245')
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setDescription(
                    `👤 **Yasaklanan -->** <@${user.id}> (\`${user.tag}\`)\n` +
                    `🛡️ **Ban Türü -->** \`${typeText}\`\n` +
                    `🆔 **Kullanıcı ID -->** \`${user.id}\`\n` +
                    `👮 **İnfazcı Admin -->** <@${interaction.user.id}>\n` +
                    `📝 **Sebep -->** \`${reason}\`\n` +
                    `📅 **Zaman -->** <t:${Math.floor(Date.now() / 1000)}:f>`
                )
                .setFooter({ text: 'LUAWARE Security Moderation' })
                .setTimestamp();

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) await logChannel.send({ embeds: [logEmbed] });

            // 💎 KOMUTU KULLANANA GİDECEK YANIT
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ LUAWARE OS | Sistem Onayı')
                .setColor('#57F287')
                .setDescription(
                    `⚙️ **İşlem -->** \`Kullanıcı Yasaklama\`\n` +
                    `👤 **Hedef -->** <@${user.id}>\n` +
                    `🛡️ **Tür -->** \`${typeText}\`\n` +
                    `✅ **Durum -->** \`Sunucudan ve IP ağından engellendi.\``
                );

            return interaction.reply({ embeds: [successEmbed], ephemeral: true });

        } catch (e) {
            const failEmbed = new EmbedBuilder()
                .setTitle('⚠️ LUAWARE OS | Erişim Hatası')
                .setColor('#FEE75C')
                .setDescription(
                    `⚙️ **İşlem -->** \`Kullanıcı Yasaklama\`\n` +
                    `❌ **Hata -->** \`Hedef kullanıcının yetkisi benden üstün veya ban yetkim kapalı!\``
                );
            return interaction.reply({ embeds: [failEmbed], ephemeral: true });
        }
    },
};