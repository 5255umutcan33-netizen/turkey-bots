const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subscriberver')
        .setDescription('Kullanıcıya Subscriber rolü verir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Rol verilecek kullanıcı')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {

        const ROLE_ID = '1500587633649127445';
        const LOG_CHANNEL_ID = '1504593851309101086';

        const user = interaction.options.getUser('kullanici');
        const member = await interaction.guild.members.fetch(user.id);
        const role = interaction.guild.roles.cache.get(ROLE_ID);

        if (!role) {
            return interaction.reply({
                content: '❌ Rol bulunamadı.',
                ephemeral: true
            });
        }

        if (member.roles.cache.has(ROLE_ID)) {
            return interaction.reply({
                content: '❌ Kullanıcıda zaten rol var.',
                ephemeral: true
            });
        }

        await member.roles.add(role);

        await interaction.reply({
            content: `✅ ${user.tag} kullanıcısına Subscriber rolü verildi.`
        });

        /* ==============================
           LOG
        ============================== */

        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

        if (logChannel) {

            const embed = new EmbedBuilder()
                .setTitle('📢 Subscriber Rol Verildi')
                .setColor('#57F287')
                .addFields(
                    { name: '👤 Kullanıcı', value: `<@${user.id}>`, inline: true },
                    { name: '🛠️ Yetkili', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '🆔 Kullanıcı ID', value: `\`${user.id}\`` }
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }

    }
};