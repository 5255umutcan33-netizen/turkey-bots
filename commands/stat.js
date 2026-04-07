const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stat')
        .setDescription('Sunucu ve RYPHERA sistem istatistiklerini gösterir.'),
    async execute(interaction) {
        await interaction.deferReply(); 
        const { guild, client } = interaction;
        const totalMembers = guild.memberCount;
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        const OWNER_ID = '345821033414262794'; 

        let activeKeys = 0;
        try { activeKeys = await KeyModel.countDocuments({}); } catch (e) {}

        const statEmbed = new EmbedBuilder()
            .setTitle('🚀 RYPHERA OS | SYSTEM STATUS')
            .setColor('#2B2D31') 
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: '💻 Sunucu Bilgisi', value: `**Adı:** \`${guild.name}\`\n**ID:** \`${guild.id}\``, inline: false },
                { name: '👥 Kullanıcılar', value: `**Üyeler:** \`${totalMembers - botCount}\`\n**Botlar:** \`${botCount}\``, inline: true },
                { name: '🔑 Lisans Durumu', value: `**Aktif Key:** \`${activeKeys}\``, inline: true },
                { name: '⚙️ Teknik', value: `**Geliştirici:** <@${OWNER_ID}>\n**Ping:** \`${client.ws.ping}ms\``, inline: false }
            )
            .setFooter({ text: 'Ryphera Scripting', iconURL: client.user.displayAvatarURL() }).setTimestamp();

        await interaction.editReply({ embeds: [statEmbed] });
    },
};