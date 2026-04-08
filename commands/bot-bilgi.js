const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-bilgi')
        .setDescription('📊 Botun sistem ve istatistik bilgilerini gösterir.'),

    async execute(interaction) {
        // RAM Hesaplama
        const toplamRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const kullanilanRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const ramYuzde = ((process.memoryUsage().heapUsed / os.totalmem()) * 100).toFixed(1);

        // RAM Bar Oluşturma [■■■□□□□□□□]
        const barSayisi = 10;
        const doluBar = Math.round((ramYuzde / 100) * barSayisi);
        const ramBar = "■".repeat(doluBar) + "□".repeat(barSayisi - doluBar);

        const embed = new EmbedBuilder()
            .setTitle('🤖 RYPHERA OS | SİSTEM DURUMU')
            .setColor('#5865F2')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: '👑 Kurucu', value: `<@345821033414262794>`, inline: true },
                { name: '🌐 Sunucu Sayısı', value: `${interaction.client.guilds.cache.size}`, inline: true },
                { name: '👥 Kullanıcı Sayısı', value: `${interaction.client.users.cache.size}`, inline: true },
                { name: '💾 RAM Kullanımı', value: `\`\`\`[${ramBar}] %${ramYuzde}\n${kullanilanRam}MB / ${toplamRam}GB\`\`\``, inline: false },
                { name: '⚙️ Versiyonlar', value: `Node.js: \`${process.version}\` | Discord.js: \`v${version}\``, inline: false },
                { name: '⏳ Çalışma Süresi', value: `<t:${Math.floor(interaction.client.readyTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'Ryphera OS Dashboard' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};