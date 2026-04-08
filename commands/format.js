const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('format')
        .setDescription('Profesyonel script tanıtım şablonu oluşturur. (Sadece Yetkililer)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) 
        .addStringOption(option => option.setName('isim').setDescription('Scriptin Adı (Örn: Ryphera Hub)').setRequired(true))
        .addStringOption(option => option.setName('kod').setDescription('Script Kodu (Örn: loadstring...)').setRequired(true))
        .addStringOption(option => option.setName('ozellikler').setDescription('Özellikler (Boşluk bırakarak yazın. Örn: Aimbot ESP Fly)').setRequired(true))
        .addAttachmentOption(option => option.setName('resim').setDescription('Scriptin Görseli').setRequired(false)),

    async execute(interaction) {
        const isim = interaction.options.getString('isim');
        const kod = interaction.options.getString('kod');
        const ozellikler = interaction.options.getString('ozellikler');
        const resim = interaction.options.getAttachment('resim');

        const ozellikListesi = ozellikler.split(/\s+/)
            .slice(0, 20) 
            .filter(ozellik => ozellik.length > 0) 
            .map(ozellik => `• ${ozellik}`)
            .join('\n');

        // 💎 PREMİUM FORMAT EKRANI
        const embed = new EmbedBuilder()
            .setTitle(`💎 Ryphera OS | Script Paylaşımı`)
            .setColor('#2B2D31')
            .setDescription(
                `📌 **Durum -->** \`Aktif ve Çalışıyor\`\n` +
                `🎮 **Oyun / Script Adı -->** \`${isim}\`\n` +
                `👮 **Paylaşan -->** <@${interaction.user.id}>`
            )
            // ⚠️ DİKKAT: Mobil kopyalama butonu kodları fields[1]'den çektiği için sıra bozulmadı!
            .addFields(
                { name: '✨ Özellikler', value: `>>> ${ozellikListesi}`, inline: false },
                { name: '💻 Script Kodu', value: `\`\`\`lua\n${kod}\n\`\`\``, inline: false }
            )
            .setFooter({ text: 'Ryphera OS System | Mobiller için butona tıklayın' })
            .setTimestamp();

        if (resim) {
            embed.setImage(resim.url);
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('mobil_kopyala_btn')
                .setLabel('Mobiller İçin Kopyala')
                .setEmoji('📱')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};