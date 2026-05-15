const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stat')
        .setDescription('Sunucu ve RYPHERA sistem istatistiklerini gösterir.'),
        
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: '❌ **Bu komut sadece sunucularda kullanılabilir!**', ephemeral: true });
        }

        await interaction.deferReply(); 
        
        const { guild, client } = interaction;
        const totalMembers = guild.memberCount;
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        const OWNER_ID = '345821033414262794'; 

        // 🚨 NÜKLEER ÇÖZÜM: Veritabanı 2 saniyede cevap vermezse bot çökmez, 0 yazar geçer!
        const activeKeys = await Promise.race([
            KeyModel.countDocuments({}).catch(() => 0),
            new Promise(resolve => setTimeout(() => resolve("Bağlantı Bekleniyor..."), 2000))
        ]);

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
                `👑 **Kurucu -->** <@${OWNER_ID}>`
            )
            .setFooter({ text: 'Ryphera OS System', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [statEmbed] });
    },
};