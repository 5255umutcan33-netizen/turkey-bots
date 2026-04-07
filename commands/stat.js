const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stat')
        .setDescription('Sunucu ve RYPHERA sistem istatistiklerini gösterir.'),
    async execute(interaction) {
        await interaction.deferReply(); // Bot biraz düşünme payı alsın (DB sorgusu için)

        const { guild, client } = interaction;

        // Üye ve Bot Sayıları
        const totalMembers = guild.memberCount;
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        const humanCount = totalMembers - botCount;

        // Aktif Key Sayısı
        let activeKeys = 0;
        try { activeKeys = await KeyModel.countDocuments({}); } catch (e) {}

        const OWNER_ID = '345821033414262794'; // Senin ID'n

        // --- PREMİUM EMBED TASARIMI ---
        const statEmbed = new EmbedBuilder()
            .setTitle('🚀 RYPHERA OS | SYSTEM STATUS')
            .setColor('#2B2D31') // Discord'un orijinal dark temasına uygun çok şık bir renk (veya #FF0000 yapabilirsin)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
            .addFields(
                { 
                    name: '💻 Sunucu Bilgisi', 
                    value: `**Adı:** \`${guild.name}\`\n**ID:** \`${guild.id}\`\n**Kurucu:** <@${guild.ownerId}>`, 
                    inline: false 
                },
                { 
                    name: '👥 Kullanıcılar', 
                    value: `**👤 Üyeler:** \`${humanCount}\`\n**🤖 Botlar:** \`${botCount}\`\n**📊 Toplam:** \`${totalMembers}\``, 
                    inline: true 
                },
                { 
                    name: '🔑 Lisans Durumu', 
                    value: `**🟢 Aktif Key:** \`${activeKeys}\`\n**🛠️ Altyapı:** \`MongoDB\``, 
                    inline: true 
                },
                { 
                    name: '⚙️ Teknik Detaylar', 
                    value: `**Geliştirici:** <@${OWNER_ID}>\n**Ping:** \`${client.ws.ping}ms\`\n**Uptime:** <t:${Math.floor(client.readyTimestamp / 1000)}:R>`, 
                    inline: false 
                }
            )
            .setFooter({ text: 'Ryphera Scripting Solutions', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [statEmbed] });
    },
};