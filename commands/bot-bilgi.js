const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-bilgi')
        .setDescription('📊 Botun sistem ve istatistik bilgilerini gösterir.'),

    async execute(interaction) {
        const toplamRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const kullanilanRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const ramYuzde = ((process.memoryUsage().heapUsed / os.totalmem()) * 100).toFixed(1);

        const barSayisi = 10;
        const doluBar = Math.round((ramYuzde / 100) * barSayisi);
        const ramBar = "■".repeat(doluBar) + "□".repeat(barSayisi - doluBar);

        // 💎 PREMİUM FORMAT
        const embed = new EmbedBuilder()
            .setTitle('🤖 RYPHERA OS | SİSTEM DURUMU')
            .setColor('#5865F2')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setDescription(
                `👑 **Kurucu -->** <@345821033414262794>\n` +
                `🌐 **Sunucu Sayısı -->** \`${interaction.client.guilds.cache.size}\`\n` +
                `👥 **Kullanıcı Sayısı -->** \`${interaction.client.users.cache.size}\`\n` +
                `⏳ **Çalışma Süresi -->** <t:${Math.floor(interaction.client.readyTimestamp / 1000)}:R>\n` +
                `⚙️ **Versiyonlar -->** Node.js: \`${process.version}\` | Discord.js: \`v${version}\`\n\n` +
                `💾 **RAM Kullanımı -->** \n\`\`\`[${ramBar}] %${ramYuzde}\n${kullanilanRam}MB / ${toplamRam}GB\`\`\``
            )
            .setFooter({ text: 'Ryphera OS System' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};