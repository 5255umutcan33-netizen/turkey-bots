const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AboneChannel = require('../models/aboneChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abonekur')
        .setDescription('📸 Abone (SS Okuma) sistemini bu kanala kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await AboneChannel.findOneAndUpdate(
            { guildId: interaction.guild.id }, 
            { channelId: interaction.channelId }, 
            { upsert: true }
        );

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Ryphera | SS Sistemi Aktif')
            .setDescription(`✅ Bu kanal artık **Abone Kanıt** kanalı olarak ayarlandı.`)
            .setColor('#57F287');

        await interaction.reply({ embeds: [embed] });
    },
};