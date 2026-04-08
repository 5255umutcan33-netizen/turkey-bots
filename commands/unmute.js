const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Bir kullanıcının susturmasını (Timeout) kaldırır.')
        .addUserOption(option => option.setName('kisi').setDescription('Susturması kaldırılacak kişi').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Kaldırma sebebi').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers), // Sadece üyeleri susturma yetkisi olanlar kullanabilir
    async execute(interaction) {
        const member = interaction.options.getMember('kisi');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi.';
        const logChannelId = '1491416750854770748'; // Mute kaldırma log ID'si

        if (!member) return interaction.reply({ content: '❌ Kullanıcı sunucuda bulunamadı.', ephemeral: true });

        // Adamın cidden mutesi var mı diye kontrol ediyoruz
        if (!member.isCommunicationDisabled()) {
            return interaction.reply({ content: '⚠️ Bu kullanıcının zaten aktif bir susturması (timeout) bulunmuyor.', ephemeral: true });
        }

        try {
            // Süreyi "null" yaparak mutesini kaldırıyoruz
            await member.timeout(null, reason);
            
            const logEmbed = new EmbedBuilder()
                .setTitle('🔊 Susturma Kaldırıldı')
                .setColor('#00FF00') // Yeşil renk (İşlem başarılı)
                .addFields(
                    { name: 'Mutesi Kalkan:', value: `${member.user.tag} (\`${member.id}\`)` },
                    { name: 'Yetkili:', value: `${interaction.user.tag}` },
                    { name: 'Sebep:', value: reason }
                )
                .setTimestamp();

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) await logChannel.send({ embeds: [logEmbed] });

            return interaction.reply({ content: `✅ **${member.user.tag}** adlı kullanıcının susturması başarıyla kaldırıldı.`, ephemeral: true });
        } catch (e) {
            console.error(e);
            return interaction.reply({ content: '❌ Susturma kaldırılamadı. Botun yetkisi kullanıcının rolünden düşük olabilir.', ephemeral: true });
        }
    },
};