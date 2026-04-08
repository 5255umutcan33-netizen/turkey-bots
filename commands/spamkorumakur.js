const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../spam-db.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guard-spam')
        .setDescription('🛡️ Bulunulan kanala Ryphera Anti-Spam & Flood kalkanı kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
        let protectedChannels = JSON.parse(fs.readFileSync(dbPath));

        const channelId = interaction.channel.id;

        if (protectedChannels.includes(channelId)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ED4245')
                .setDescription('❌ **Hata:** Bu kanal zaten Ryphera Guard koruması altında!');
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        protectedChannels.push(channelId);
        fs.writeFileSync(dbPath, JSON.stringify(protectedChannels, null, 2));

        const successEmbed = new EmbedBuilder()
            .setTitle('🛡️ Ryphera Kalkanı Aktif Edildi')
            .setColor('#57F287')
            .setDescription(`**${interaction.channel.name}** kanalı başarıyla koruma altına alındı.\n\n\`\`\`Kural: 5 Saniyede 5 Mesaj atan 2 dakika susturulur.\`\`\``)
            .setFooter({ text: 'Ryphera Security Systems', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [successEmbed] });
    },
};