const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const AboneChannel = require('../models/aboneChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trabonekur')
        .setDescription('Kanalı Türkçe abone kontrol kanalına çevirir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await AboneChannel.findOneAndUpdate({ channelId: interaction.channelId }, { lang: 'tr' }, { upsert: true });
        await interaction.reply('✅ `SİSTEM: Bu kanal Türkçe abone onay kanalı olarak ayarlandı.`');
    },
};