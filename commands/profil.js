const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key'); // Veritabanı dosyanın yolunun doğru olduğundan emin ol

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profil')
        .setDescription('🪪 LUAWARE | Dijital kimliğinizi (Profilinizi) görüntüler.')
        .addUserOption(option => 
            option.setName('kullanici')
            .setDescription('Profiline bakmak istediğiniz kişi (Opsiyonel)')
        ),
        
    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Kullanıcının Key'i var mı kontrol et
        const userKey = await KeyModel.findOne({ owner: targetUser.id });
        const keyStatus = userKey ? `🟢 Mevcut (ID: #${userKey.licenseId})` : '🔴 Bulunmuyor';

        // Kullanıcı Abone mi kontrol et (1500587633649127445 Abone rolü)
        const isSubscriber = member && member.roles.cache.has('1500587633649127445') ? '✅ LUAWARE Abonesi' : '❌ Onaysız Kullanıcı';

        const embed = new EmbedBuilder()
            .setTitle('🪪 LUAWARE OS | Dijital Kimlik Kartı')
            .setColor('#2B2D31')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: '👤 Kullanıcı', value: `<@${targetUser.id}> (\`${targetUser.tag}\`)`, inline: true },
                { name: '🆔 ID Numarası', value: `\`${targetUser.id}\``, inline: true },
                { name: '🌟 Statü', value: `\`${isSubscriber}\``, inline: false },
                { name: '🔑 Lisans (Key)', value: `\`${keyStatus}\``, inline: true },
                { name: '📅 Sunucuya Katılım', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Bilinmiyor', inline: true },
                { name: '📅 Hesap Açılışı', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'LUAWARE Security & Identity Systems' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};