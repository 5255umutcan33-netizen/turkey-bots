const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AboneChannel = require('../models/aboneChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trabonekur')
        .setDescription('📸 Kanalı Türkçe abone kontrol kanalına çevirir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        await AboneChannel.findOneAndUpdate(
            { channelId: interaction.channelId }, 
            { lang: 'tr' }, 
            { upsert: true }
        );

        // 💎 PREMİUM ONAY RAPORU
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Ryphera OS | SS Sistemi Aktif (TR)')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`Türkçe Abone Onay Kanalı Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Ayarlandı\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>\n` +
                `📅 **İşlem Zamanı -->** <t:${Math.floor(Date.now() / 1000)}:f>`
            )
            .setFooter({ text: 'Ryphera OS System' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};