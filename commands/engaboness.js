const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const AboneChannel = require('../models/aboneChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('engaboness')
        .setDescription('Sets channel for English sub-verify.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await AboneChannel.findOneAndUpdate({ channelId: interaction.channelId }, { lang: 'en' }, { upsert: true });
        await interaction.reply('✅ `SYSTEM: This channel is now set for English sub verification.`');
    },
};