const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Tesseract = require('tesseract.js'); // Yazı okuma kütüphanesi

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aboneal')
        .setDescription('Abone ekran görüntüsünü kontrol eder ve rol verir.')
        .addAttachmentOption(option => 
            option.setName('ss')
                .setDescription('Abone olduğunuza dair ekran görüntüsü')
                .setRequired(true)),
    async execute(interaction) {
        const ss = interaction.options.getAttachment('ss');
        const roleId = '1490996828974612530'; // Senin verdiğin rol ID

        // Resim formatı kontrolü
        if (!ss.contentType.startsWith('image')) {
            return interaction.reply({ content: '`HATA: Sadece resim dosyası atabilirsin.`', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true }); // İşlem uzun sürebilir, botu bekletiyoruz

        try {
            // OCR İşlemi: Resimdeki yazıları tara
            const { data: { text } } = await Tesseract.recognize(ss.url, 'eng+tur');

            // Kontrol Edilecek Kelimeler (Senin kanal ismin ve handle adın)
            const lowerText = text.toLowerCase();
            const isSubbed = lowerText.includes('ryphera scr1pt') || lowerText.includes('@rypherascr1pt');

            if (isSubbed) {
                const member = interaction.guild.members.cache.get(interaction.user.id);
                await member.roles.add(roleId);

                const successEmbed = new EmbedBuilder()
                    .setTitle('RYPHERA | ABONE ONAYI')
                    .setColor('#00FF00')
                    .setDescription(
                        `Durum: \`ONAYLANDI\`\n` +
                        `Kanal: \`Ryphera Scr1pt\`\n\n` +
                        `Sistem resimdeki kanıtı doğruladı. \`Abone\` rolünüz verildi.`
                    );

                return interaction.editReply({ embeds: [successEmbed] });
            } else {
                const failEmbed = new EmbedBuilder()
                    .setTitle('RYPHERA | ONAY REDDEDİLDİ')
                    .setColor('#FF0000')
                    .setDescription(
                        `Durum: \`GEÇERSİZ\`\n` +
                        `Sebep: \`Kanal ismi veya kullanıcı adı bulunamadı.\`\n\n` +
                        `Lütfen ekran görüntüsünde \`Ryphera Scr1pt\` isminin göründüğünden emin olun.`
                    );

                return interaction.editReply({ embeds: [failEmbed] });
            }

        } catch (error) {
            console.error(error);
            return interaction.editReply({ content: '`HATA: Resim işlenirken bir sorun oluştu.`' });
        }
    },
};