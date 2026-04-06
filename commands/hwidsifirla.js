const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hwidsifirla')
        .setDescription('Teknik ID ile bir keyin HWID kilidini sıfırlar (Admin Özel)')
        .addStringOption(option => 
            option.setName('keyid')
                .setDescription('6 haneli Teknik Key ID')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const targetKeyId = interaction.options.getString('keyid');
        const keyData = await KeyModel.findOne({ keyId: targetKeyId });

        if (!keyData) {
            return interaction.reply({ content: '❌ Bu ID\'ye sahip bir lisans bulunamadı kanka!', ephemeral: true });
        }

        // HWID Sıfırla
        keyData.hwid = null;
        await keyData.save();

        // Sahibine DM Gönder (Yeni Stil)
        try {
            const owner = await interaction.client.users.fetch(keyData.createdBy);
            const dmEmbed = new EmbedBuilder()
                .setTitle('🇹🇷 TURKEY HUB | BİLDİRİM')
                .setColor('#FF0000')
                .setDescription(
                    `🔴 **Hwid Sıfırlama İşlemi**\n` +
                    `↳ Toplam **1** Adet **Hwid Sıfırlama İşlemi** Tamamlandı\n` +
                    `↳ Kullanmak İçin **Hileye Yeni Cihazdan Giriş Yapın**`
                );
            await owner.send({ embeds: [dmEmbed] });
        } catch (e) {
            console.log("Kullanıcıya DM gönderilemedi.");
        }

        // Onay Mesajı (Senin istediğin stil)
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ İŞLEM BAŞARILI')
            .setColor('#00FF00')
            .setDescription(
                `🔴 **Hwid Sıfırlama Bileti**\n` +
                `↳ Toplam **0** Tane **Hwid Sıfırlama Bileti** Sahipsin\n` +
                `↳ Kullanmak İçin **#🔑 | keylerim** Kanalını Ziyaret Edin`
            );

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};