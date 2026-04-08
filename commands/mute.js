const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Bir kullanıcıyı susturur (Timeout).')
        .addUserOption(option => option.setName('kisi').setDescription('Susturulacak kişi').setRequired(true))
        .addIntegerOption(option => option.setName('sure').setDescription('Dakika cinsinden süre').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Susturma sebebi').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const member = interaction.options.getMember('kisi');
        const duration = interaction.options.getInteger('sure');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi.';
        const logChannelId = '1491416464240935052';

        if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

        try {
            await member.timeout(duration * 60 * 1000, reason);
            
            const logEmbed = new EmbedBuilder()
                .setTitle('🤐 Kullanıcı Susturuldu')
                .setColor('#FFFF00')
                .addFields(
                    { name: 'Susturulan:', value: `${member.user.tag}` },
                    { name: 'Süre:', value: `${duration} Dakika` },
                    { name: 'Yetkili:', value: `${interaction.user.tag}` },
                    { name: 'Sebep:', value: reason }
                )
                .setTimestamp();

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) await logChannel.send({ embeds: [logEmbed] });

            return interaction.reply({ content: `✅ **${member.user.tag}**, ${duration} dakika boyunca susturuldu.`, ephemeral: true });
        } catch (e) {
            return interaction.reply({ content: '❌ Susturma işlemi başarısız.', ephemeral: true });
        }
    },
};