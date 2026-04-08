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

        // 💎 PREMİUM FORMAT
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Ryphera | SS Sistemi Aktif')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`Abone SS Sistemi Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Aktif Edildi\`\n` +
                `📍 **Ayarlanan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>\n` +
                `📅 **İşlem Zamanı -->** <t:${Math.floor(Date.now() / 1000)}:f>`
            )
            .setFooter({ text: 'Ryphera OS System' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};