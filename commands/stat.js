const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key'); // Veritabanı yolunun doğru olduğundan emin ol

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stat')
        .setDescription('Sunucu ve Ryphera sistem istatistiklerini gösterir.'),
        
    async execute(interaction) {
        // 1. Olası DM Çökmelerini Engelle (Komut sadece sunucuda çalışsın)
        if (!interaction.guild) {
            return interaction.reply({ content: '❌ **Bu komut sadece sunucularda kullanılabilir!**', ephemeral: true });
        }

        // 2. Discord 3 Saniye Kuralını Aş (Düşünüyor... yazısını anında garantile)
        await interaction.deferReply(); 
        
        const { guild, client } = interaction;
        
        // Üye ve Bot hesaplamaları
        const totalMembers = guild.memberCount;
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        const userCount = totalMembers - botCount;
        
        const OWNER_ID = '345821033414262794'; // Noxy'nin ID'si

        // 3. NÜKLEER VERİTABANI KALKANI
        // Veritabanı sorgusu en fazla 1.5 saniye bekler. Eğer bağlanamazsa bot çökmez.
        let activeKeys = 0;
        try {
            activeKeys = await Promise.race([
                KeyModel.countDocuments({}),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
            ]);
        } catch (error) {
            activeKeys = 'Bağlantı Bekleniyor... /'; 
        }

        // 4. GÖRSELDEKİ BİREBİR TASARIM (Ryphera OS)
        const statEmbed = new EmbedBuilder()
            .setTitle('📊 Ryphera OS | Sistem İstatistikleri')
            .setColor('#2B2D31') // Discord'un koyu temasına oturan premium renk
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }) || client.user.displayAvatarURL())
            .setDescription(
                `🌐 **Sunucu Adı -->** \`${guild.name}\`\n` +
                `🆔 **Sunucu ID -->** \`${guild.id}\`\n` +
                `👥 **Üye Sayısı -->** \`${userCount} Kullanıcı | ${botCount} Bot\`\n` +
                `🔑 **Aktif Lisans -->** \`${activeKeys} Üretilmiş Key\`\n` +
                `⚙️ **Gecikme (Ping) -->** \`${client.ws.ping}ms\`\n` +
                `👑 **Geliştirici -->** <@${OWNER_ID}>`
            )
            .setFooter({ 
                text: 'Ryphera OS System', 
                iconURL: client.user.displayAvatarURL() 
            })
            .setTimestamp();

        // 5. Embed'i Ekrana Bas
        await interaction.editReply({ embeds: [statEmbed] });
    },
};