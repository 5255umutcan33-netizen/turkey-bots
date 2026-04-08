const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Bir kullanıcının yasaklamasını kaldırır.')
        .addStringOption(option => option.setName('uid').setDescription('Yasaklaması kalkacak kişinin ID\'si').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const userId = interaction.options.getString('uid');
        const logChannelId = '1491416572143599768';

        try {
            await interaction.guild.members.unban(userId);
            
            const logEmbed = new EmbedBuilder()
                .setTitle('🔓 Yasaklama Kaldırıldı')
                .setColor('#00FF00')
                .addFields(
                    { name: 'Yasaklaması Kalkan ID:', value: userId },
                    { name: 'Yetkili:', value: `${interaction.user.tag}` }
                )
                .setTimestamp();

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) await logChannel.send({ embeds: [logEmbed] });

            return interaction.reply({ content: `✅ \`${userId}\` ID'li kullanıcının yasağı açıldı.`, ephemeral: true });
        } catch (e) {
            return interaction.reply({ content: '❌ Yasak kaldırılamadı (Böyle bir ban bulunamadı veya ID yanlış).', ephemeral: true });
        }
    },
};