const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hwidsifirla')
        .setDescription('🛠️ Bir kullanıcının HWID kilidini sıfırlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('veri')
                .setDescription('Lisans ID\'si veya Direkt Lisans Anahtarı (RYP-...)')
                .setRequired(true)),

    async execute(interaction) {
        const sorgu = interaction.options.getString('veri').trim();
        await interaction.deferReply({ ephemeral: true });

        try {
            // Önce girilen veri bir ID mi diye bakar, değilse Key metni mi diye bakar
            let keyData = await KeyModel.findById(sorgu).catch(() => null);
            if (!keyData) {
                keyData = await KeyModel.findOne({ key: sorgu });
            }

            if (!keyData) {
                return interaction.editReply({ content: '❌ **Bulunamadı:** Girdiğiniz ID veya Lisans Anahtarına ait bir kayıt yok!' });
            }

            if (!keyData.hwid) {
                return interaction.editReply({ content: `⚠️ \`${keyData.key}\` anahtarının HWID kilidi zaten **BOŞ** durumda.` });
            }

            // HWID'yi sıfırla
            keyData.hwid = null;
            await keyData.save();

            const embed = new EmbedBuilder()
                .setTitle('✅ HWID Sıfırlandı')
                .setColor('#57F287')
                .setDescription(`\`${keyData.key}\` lisansına ait donanım kilidi başarıyla kaldırıldı! Kullanıcı oyuna başka bir cihazdan giriş yapabilir.`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: '❌ Veritabanında bir hata oluştu.' });
        }
    },
};