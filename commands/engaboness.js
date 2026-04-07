const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const AboneChannel = require('../models/aboneChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('engaboness')
        .setDescription('Sets this channel as the English sub-verification channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await AboneChannel.findOneAndUpdate(
            { channelId: interaction.channelId },
            { lang: 'en' },
            { upsert: true }
        );
        await interaction.reply('✅ `SYSTEM: This channel is now the official English Sub-Verify channel.`');
    },
};