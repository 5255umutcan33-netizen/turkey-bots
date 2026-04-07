const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stat')
        .setDescription('Sunucu ve sistem istatistiklerini mermi gibi gösterir.'),
    async execute(interaction) {
        const { guild, client } = interaction;

        // 1. Üye ve Bot Sayılarını Hesapla
        const totalMembers = guild.memberCount;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;
        const humanCount = totalMembers - botCount;

        // 2. Veritabanından Aktif Key Sayısını Çek
        let activeKeys = 0;
        try {
            activeKeys = await KeyModel.countDocuments({});
        } catch (error) {
            console.error("DB Stat Hatası:", error);
        }

        // 3. Bot Kurucusu (Senin ID'ni buraya yazabilirsin)
        const botOwnerId = "345821033414262794"; // Buraya kendi Discord ID'ni yapıştır kanka

        // 4. Şık Embed Hazırla
        const statEmbed = new EmbedBuilder()
            .setTitle('📊 RYPHERA OS | SİSTEM İSTATİSTİKLERİ')
            .setColor('#FF0000') // Ryphera kırmızısı
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👑 Kurucular', value: `Sunucu: <@${guild.ownerId}>\nBot: <@${botOwnerId}>`, inline: false },
                { name: '👥 Üyeler', value: `Toplam: \`${totalMembers}\`\nKullanıcı: \`${humanCount}\`\nBot: \`${botCount}\``, inline: true },
                { name: '🔑 Lisans Sistemi', value: `Aktif Keyler: \`${activeKeys}\``, inline: true },
                { name: '🌐 Sunucu Bilgisi', value: `ID: \`${guild.id}\`\nKuruluş: <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: false }
            )
            .setFooter({ text: 'Ryphera Scripting Solutions', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [statEmbed] });
    },
};