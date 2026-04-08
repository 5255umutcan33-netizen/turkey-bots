const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bir kullanıcıyı sunucudan yasaklar.')
        .addUserOption(option => option.setName('kisi').setDescription('Yasaklanacak kişi').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Yasaklama sebebi').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('kisi');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi.';
        const logChannelId = '1491416428291559445';

        try {
            await interaction.guild.members.ban(user, { reason });
            
            const logEmbed = new EmbedBuilder()
                .setTitle('🔨 Kullanıcı Yasaklandı')
                .setColor('#FF0000')
                .addFields(
                    { name: 'Yasaklanan:', value: `${user.tag} (${user.id})` },
                    { name: 'Yetkili:', value: `${interaction.user.tag}` },
                    { name: 'Sebep:', value: reason }
                )
                .setTimestamp();

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) await logChannel.send({ embeds: [logEmbed] });

            return interaction.reply({ content: `✅ **${user.tag}** sunucudan uçuruldu.`, ephemeral: true });
        } catch (e) {
            return interaction.reply({ content: '❌ Kullanıcı banlanırken bir hata oluştu (Yetkim yetmiyor olabilir).', ephemeral: true });
        }
    },
};