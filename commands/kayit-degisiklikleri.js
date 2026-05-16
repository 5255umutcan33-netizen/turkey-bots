const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

function formatText(text, prefix) {
    if (!text) return null;
    let lines = text.split(/,|\n/);
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
        .setName('kayit-degisiklikleri')
        .setDescription('Yeni bir güncelleme notu yayınlar (Türkçe).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('surum').setDescription('Güncelleme sürümü (Örn: v1.2.0)').setRequired(true))
        .addStringOption(option => option.setName('eklenenler').setDescription('Eklenenler (+). Virgülle ayırın.'))
        .addStringOption(option => option.setName('kaldirilanlar').setDescription('Kaldırılanlar (-). Virgülle ayırın.'))
        .addStringOption(option => option.setName('duzeltilenler').setDescription('Düzeltilen Buglar (/). Virgülle ayırın.')),

    async execute(interaction) {
        const version = interaction.options.getString('surum');
        const added = formatText(interaction.options.getString('eklenenler'), '+');
        const removed = formatText(interaction.options.getString('kaldirilanlar'), '-');
        const fixed = formatText(interaction.options.getString('duzeltilenler'), '/');

        const embed = new EmbedBuilder()
            .setTitle(`🚀 LUAWARE | Güncelleme Notları [${version}]`)
            .setColor('#57F287')
            .setFooter({ text: 'LUAWARE Geliştirici Ekibi' })
            .setTimestamp(); // Anlık Tarih/Saat çakar

        let desc = "Sistemimizdeki en son değişiklikler aşağıdadır:\n\n";

        if (added) desc += `**➕ Eklenenler:**\n\`\`\`diff\n${added}\n\`\`\`\n`;
        if (removed) desc += `**➖ Kaldırılanlar:**\n\`\`\`diff\n${removed}\n\`\`\`\n`;
        if (fixed) desc += `**🛠️ Düzeltilenler:**\n\`\`\`\n${fixed}\n\`\`\`\n`;

        if (!added && !removed && !fixed) {
            desc += "*Bu sürüm için detaylı değişiklik girilmemiştir.*";
        }

        embed.setDescription(desc);

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '✅ Güncelleme notu başarıyla yayınlandı!', ephemeral: true });
    }
};