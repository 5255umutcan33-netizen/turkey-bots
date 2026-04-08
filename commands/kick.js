const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Bir kullanıcıyı sunucudan atar.')
        .addUserOption(option => option.setName('kisi').setDescription('Atılacak kişi').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Atılma sebebi').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const user = interaction.options.getMember('kisi');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi.';
        const logChannelId = '1491416445064712305';

        if (!user) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

        try {
            await user.kick(reason);
            
            const logEmbed = new EmbedBuilder()
                .setTitle('👢 Kullanıcı Atıldı')
                .setColor('#FFA500')
                .addFields(
                    { name: 'Atılan:', value: `${user.user.tag}` },
                    { name: 'Yetkili:', value: `${interaction.user.tag}` },
                    { name: 'Sebep:', value: reason }
                )
                .setTimestamp();

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) await logChannel.send({ embeds: [logEmbed] });

            return interaction.reply({ content: `✅ **${user.user.tag}** sunucudan atıldı.`, ephemeral: true });
        } catch (e) {
            return interaction.reply({ content: '❌ Kullanıcı atılırken bir hata oluştu.', ephemeral: true });
        }
    },
};