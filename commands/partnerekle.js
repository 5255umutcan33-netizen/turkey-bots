const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const PartnerModel = require('../models/Partner'); // Şemanın yolunu kendine göre ayarla

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partner-ekle')
        .setDescription('Yeni bir partner sunucu eklersin.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles) // Sadece yetkililer kullanabilsin
        .addUserOption(option => 
            option.setName('temsilci')
            .setDescription('Partner sunucunun yetkilisini etiketle')
            .setRequired(true))
        .addStringOption(option => 
            option.setName('link')
            .setDescription('Partner sunucunun davet linki')
            .setRequired(true))
        .addStringOption(option => 
            option.setName('aciklama')
            .setDescription('Sunucunun özellikleri / Tanıtım metni')
            .setRequired(true)),

    async execute(interaction) {
        const temsilci = interaction.options.getUser('temsilci');
        const link = interaction.options.getString('link');
        const aciklama = interaction.options.getString('aciklama');
        
        // SENİN İSTEDİĞİN ÖZEL ROL ID'Sİ
        const partnerRolId = "1503495002502856856"; 

        // 1. Temsilciye Rolü Ver
        const member = interaction.guild.members.cache.get(temsilci.id);
        if (member) {
            try {
                await member.roles.add(partnerRolId);
            } catch (err) {
                return interaction.reply({ content: 'Rol verilemedi! Botun yetki sırasını kontrol et.', ephemeral: true });
            }
        } else {
            return interaction.reply({ content: 'Bu kullanıcı sunucuda bulunamadı!', ephemeral: true });
        }

        // 2. Partner Mesajını (Embed) Oluştur ve Kanala At
        const embed = new EmbedBuilder()
            .setTitle('🤝 Yeni Partnerimiz!')
            .setDescription(`**Temsilci:** <@${temsilci.id}>\n**Davet Linki:** ${link}\n\n**Hakkında:**\n${aciklama}`)
            .setColor('#2b2d31') // Discord'un şık koyu temasına uygun
            .setTimestamp();

        const partnerMesaji = await interaction.channel.send({ embeds: [embed] });

        // 3. Olayı Veritabanına Kaydet (Çıkarsa silebilmek için)
        await PartnerModel.create({
            temsilciId: temsilci.id,
            mesajId: partnerMesaji.id,
            kanalId: interaction.channel.id,
            guildId: interaction.guild.id
        });

        await interaction.reply({ content: `✅ Şov tamam! ${temsilci} partner olarak eklendi, rolü verildi ve veritabanına işlendi.`, ephemeral: true });
    }
};