const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const AboneChannel = require('../models/aboneChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trabonekur')
        .setDescription('Bu kanalı Türkçe abone onay kanalına dönüştürür.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await AboneChannel.findOneAndUpdate(
            { channelId: interaction.channelId },
            { lang: 'tr' },
            { upsert: true }
        );
        await interaction.reply('✅ `SİSTEM: Bu kanal artık otomatik Türkçe abone onay kanalıdır.`');
    },
};