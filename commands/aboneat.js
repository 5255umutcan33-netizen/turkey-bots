const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aboneat')
        .setDescription('Abone kanıtı yükler.')
        .addAttachmentOption(opt => opt.setName('ss').setDescription('Ekran Görüntüsü').setRequired(true)),
    async execute(interaction) {
        // Mantık interactionCreate içinde işleniyor kanka
    },
};