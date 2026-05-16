const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

function formatText(text, prefix) {
    if (!text) return null;
    // YENİ: Aynı şekilde İngilizce sisteme de noktadan sonra bölme özelliği eklendi
    let lines = text.split(/,|\n|\./);
    lines = lines.map(l => {
        let clean = l.trim();
        if (clean.startsWith('+') || clean.startsWith('-') || clean.startsWith('/')) {
            clean = clean.substring(1).trim(); 
        }
        return clean.length > 0 ? `${prefix} ${clean}` : null;
    }).filter(l => l !== null);
    return lines.join('\n');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changelogs')
        .setDescription('Publish a new update log (English).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('version').setDescription('Update version (e.g., v1.2.0)').setRequired(true))
        .addStringOption(option => option.setName('added').setDescription('Added features (+). Separate with dots or commas.'))
        .addStringOption(option => option.setName('removed').setDescription('Removed features (-). Separate with dots or commas.'))
        .addStringOption(option => option.setName('fixed').setDescription('Fixed bugs (/). Separate with dots or commas.')),

    async execute(interaction) {
        const version = interaction.options.getString('version');
        const added = formatText(interaction.options.getString('added'), '+');
        const removed = formatText(interaction.options.getString('removed'), '-');
        const fixed = formatText(interaction.options.getString('fixed'), '/');

        const embed = new EmbedBuilder()
            .setTitle(`🚀 LUAWARE | Update Logs [${version}]`)
            .setColor('#00D4FF')
            .setFooter({ text: 'LUAWARE Development Team' })
            .setTimestamp();

        let desc = "Here are the latest changes to our system:\n\n";

        if (added) desc += `**➕ Added Features:**\n\`\`\`diff\n${added}\n\`\`\`\n`;
        if (removed) desc += `**➖ Removed Features:**\n\`\`\`diff\n${removed}\n\`\`\`\n`;
        if (fixed) desc += `**🛠️ Fixed Issues:**\n\`\`\`\n${fixed}\n\`\`\`\n`;

        if (!added && !removed && !fixed) {
            desc += "*No detailed changes provided for this version.*";
        }

        embed.setDescription(desc);

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '✅ Changelog successfully posted!', ephemeral: true });
    }
};