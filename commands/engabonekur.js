const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AboneChannel = require('../models/aboneChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enabonekur')
        .setDescription('📸 Sets the channel as the AI-supported ENGLISH Subscriber Verification channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        // Veritabanına bu kanalı "en" olarak kaydediyoruz
        await AboneChannel.findOneAndUpdate(
            { channelId: interaction.channelId }, 
            { lang: 'en' }, 
            { upsert: true }
        );

        const ABONE_ROLU = '1500587633649127445';
        await interaction.channel.permissionOverwrites.edit(ABONE_ROLU, { ViewChannel: false }).catch(() => {});

        const embed = new EmbedBuilder()
            .setTitle('🛡️ LUAWARE OS | English SS System Active')
            .setColor('#1aff00')
            .setDescription(`⚙️ **Action -->** \`EN Subscriber Channel Setup\`\n✅ **Status -->** \`Successfully Set\`\n📍 **Channel -->** <#${interaction.channelId}>`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};