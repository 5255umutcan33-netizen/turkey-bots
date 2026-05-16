const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key'); // Veritabanı modelin

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keyolustur')
        .setDescription('İstediğin isimde özel bir key oluşturur (Sadece Yönetici).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Sadece adminler görebilir ve kullanabilir
        .addStringOption(option =>
            option.setName('isim')
                .setDescription('Keyin adı ne olsun? (Halka açık olacaksa adında FREE geçsin, Örn: LUA-FREE-EVENT)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('sure')
                .setDescription('Süresi (Örn: 24 Saat, 3 Gün, Sınırsız)')
                .setRequired(true)
        ),

    async execute(interaction) {
        const OWNER_ID = '345821033414262794'; 
        
        // Ekstra Güvenlik: Kurucu veya Admin değilse kullanamaz
        if (interaction.user.id !== OWNER_ID && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ Bu komutu kullanmaya yetkiniz yok!', ephemeral: true });
        }

        const keyAdi = interaction.options.getString('isim').toUpperCase(); // Girdiği ismi büyük harfe çevir
        const sure = interaction.options.getString('sure');

        await interaction.deferReply({ ephemeral: true }); // Sadece komutu yazan kişi görecek

        try {
            // 1. Veritabanında bu isimde bir key zaten var mı?
            const existingKey = await KeyModel.findOne({ key: keyAdi });
            if (existingKey) {
                return interaction.editReply({ content: `❌ **${keyAdi}** adında bir key veritabanında zaten mevcut! Başka bir isim dene.` });
            }

            // 2. Yeni Özel Keyi Oluştur ve Veritabanına Yaz
            const licenseId = Math.floor(10000 + Math.random() * 90000).toString();
            
            await new KeyModel({ 
                key: keyAdi, 
                expiry: sure, 
                owner: 'PUBLIC-EVENT', // Halka açık olduğu için sahibine bunu yazıyoruz
                licenseId: licenseId,
                hwid: null // Henüz kimseye kilitli değil
            }).save();

            // 3. Başarı Mesajı
            const basariEmbed = new EmbedBuilder()
                .setTitle('🎉 Özel Anahtar Başarıyla Üretildi!')
                .setColor('#57F287')
                .setDescription(`İstediğin zaman bu anahtarı duyuru kanalında paylaşabilirsin. İçinde **FREE** kelimesi geçiyorsa herkes kullanabilir!`)
                .addFields(
                    { name: '🔑 Key Adı', value: `\`${keyAdi}\``, inline: true },
                    { name: '⏳ Süre', value: `\`${sure}\``, inline: true },
                    { name: '🛠️ Oluşturan', value: `<@${interaction.user.id}>`, inline: true }
                )
                .setFooter({ text: 'LUAWARE Özel Key Sistemi' });

            return interaction.editReply({ embeds: [basariEmbed] });

        } catch (err) {
            console.error(err);
            return interaction.editReply({ content: '❌ Anahtar oluşturulurken veritabanı hatası meydana geldi.' });
        }
    }
};