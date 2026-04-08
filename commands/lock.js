const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('🔒 Bulunduğunuz kanalı mesaj gönderimine kapatır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        // @everyone rolünün mesaj atma yetkisini kapatıyoruz
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false
        });

        const embed = new EmbedBuilder()
            .setTitle('🔒 Kanal Kilitlendi / Channel Locked')
            .setDescription('Bu kanal geçici olarak mesaj gönderimine kapatılmıştır.\n*This channel has been temporarily locked.*')
            .setColor('#ED4245');

        await interaction.reply({ embeds: [embed] });
    },
};