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

        // 💎 PREMİUM FORMAT EKRANI
        const statEmbed = new EmbedBuilder()
            .setTitle('📊 Ryphera OS | Sistem İstatistikleri')
            .setColor('#2B2D31') 
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
            .setDescription(
                `🌐 **Sunucu Adı -->** \`${guild.name}\`\n` +
                `🆔 **Sunucu ID -->** \`${guild.id}\`\n` +
                `👥 **Üye Sayısı -->** \`${totalMembers - botCount}\` Kullanıcı | \`${botCount}\` Bot\n` +
                `🔑 **Aktif Lisans -->** \`${activeKeys}\` Üretilmiş Key\n` +
                `⚙️ **Gecikme (Ping) -->** \`${client.ws.ping}ms\`\n` +
                `👑 **Geliştirici -->** <@${OWNER_ID}>`
            )
            .setFooter({ text: 'Ryphera OS System', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [statEmbed] });
    },
};