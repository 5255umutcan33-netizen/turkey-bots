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

        // 💎 HATA: KANAL ZATEN KORUNUYORSA PREMİUM YANIT
        if (protectedChannels.includes(channelId)) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('⚠️ İşlem Başarısız')
                .setColor('#FEE75C')
                .setDescription(
                    `⚙️ **İşlem -->** \`Anti-Spam Kalkanı Kurulumu\`\n` +
                    `❌ **Hata -->** \`Bu kanal zaten Ryphera Guard koruması altında!\``
                );
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        protectedChannels.push(channelId);
        fs.writeFileSync(dbPath, JSON.stringify(protectedChannels, null, 2));

        // 💎 BAŞARILI KURULUM PREMİUM RAPORU
        const successEmbed = new EmbedBuilder()
            .setTitle('🛡️ Ryphera OS | Kalkan Aktif Edildi')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`Anti-Spam Kalkanı Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Aktif Edildi\`\n` +
                `📍 **Korunan Kanal -->** <#${channelId}>\n` +
                `👮 **Kurulumu Yapan -->** <@${interaction.user.id}>\n` +
                `📅 **İşlem Zamanı -->** <t:${Math.floor(Date.now() / 1000)}:f>\n\n` +
                `⚠️ **Kural Tablosu -->** \`5 Saniyede 5 Mesaj atan otomatik olarak 2 dakika susturulur.\``
            )
            .setFooter({ text: 'Ryphera Security Systems', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [successEmbed] });
    },
};