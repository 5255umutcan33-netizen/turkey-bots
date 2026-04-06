// interactionCreate.js içindeki butona tıklandığındaki kısım
const moment = require('moment'); // 'npm install moment' yapman gerekebilir

// ... (Key oluşturma mantığının içine)
const generatedKey = `TURKEY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
const expireDate = moment().add(24, 'hours').toDate();

const newKey = new KeyModel({
    key: generatedKey,
    createdBy: interaction.user.id,
    expiresAt: expireDate
});

await newKey.save();

// KULLANICIYA GİDEN DM (PREMIUM TASARIM)
const dmEmbed = new EmbedBuilder()
    .setTitle('🇹🇷 TURKEY HUB | LİSANS TANIMLANDI')
    .setDescription('Sisteme erişim anahtarın başarıyla oluşturuldu kanka.')
    .setColor('#FF0000')
    .addFields(
        { name: '🔑 ANAHTARIN', value: `\`${generatedKey}\``, inline: false },
        { name: '👤 OLUŞTURAN', value: `<@${interaction.user.id}>`, inline: true },
        { name: '🆔 USER ID', value: `\`${interaction.user.id}\``, inline: true },
        { name: '📅 OLUŞTURULMA', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
        { name: '⌛ BİTİŞ SÜRESİ', value: `<t:${Math.floor(expireDate.getTime() / 1000)}:F>`, inline: false },
        { name: '⚠️ HWID DURUMU', value: 'İlk girişte bu cihaza kilitlenecektir!', inline: false }
    )
    .setFooter({ text: 'Turkey Hub - Kimseye anahtarını verme!' })
    .setTimestamp();

await interaction.user.send({ embeds: [dmEmbed] });