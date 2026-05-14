const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subscriber')
        .setDescription('Belirtilen kullanıcıya Subscriber rolü verir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Rol verilecek kullanıcı')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {

        const user = interaction.options.getUser('kullanici');
        const member = await interaction.guild.members.fetch(user.id);

        const roleId = '1500587633649127445';
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
            return interaction.reply({ content: 'Rol bulunamadı!', ephemeral: true });
        }

        try {
            await member.roles.add(role);
            await interaction.reply({ content: `${user.tag} kullanıcısına rol verildi ✅`, ephemeral: false });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: 'Rol verilirken hata oluştu!', ephemeral: true });
        }
    }
};