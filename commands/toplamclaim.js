const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const StaffStat = require('../models/staffStat');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toplamclaim')
        .setDescription('Yetkililerin sahiplendiği bilet (ticket) sayılarını sıralar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const stats = await StaffStat.find().sort({ claims: -1 });

        if (!stats || stats.length === 0) {
            return interaction.reply({ content: '⚠️ Henüz kimse bilet sahiplenmemiş.', ephemeral: true });
        }

        let desc = "";
        stats.forEach((stat, index) => {
            desc += `**${index + 1}.** <@${stat.userId}> --> \`${stat.claims} Ticket\`\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle('🏆 LUAWARE | Yetkili Ticket Sıralaması')
            .setColor('#00D4FF')
            .setDescription(desc)
            .setFooter({ text: 'LUAWARE Staff System' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};