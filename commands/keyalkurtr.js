const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keyalkurtr')
        .setDescription('Türkçe lisans panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        
        // 💎 KULLANICILARIN GÖRECEĞİ PREMIUM LİSANS EKRANI
        const trEmbed = new EmbedBuilder()
            .setTitle('💎 Ryphera OS | Lisans Merkezi')
            .setColor('#2B2D31')
            .setDescription(
                `👋 **Lisans Merkezine Hoş Geldiniz!**\n\n` +
                `📌 **Durum -->** \`🟢 Aktif\`\n` +
                `⚙️ **Sistem -->** \`Ryphera OS\`\n` +
                `📝 **İşlem -->** \`Kişisel anahtarınızı oluşturmak için aşağıdaki butona tıklayın.\`\n\n` +
                `⚠️ **Dikkat!! ANAHTARINIZI KİMSE İLE PAYLAŞMAYIN**`
            )
            .setFooter({ text: 'Ryphera OS Güvenlik' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('get_key_tr')
                .setLabel('Anahtar Al')
                .setStyle(ButtonStyle.Danger) // Türkçe versiyondaki kırmızı detayı koruduk
                .setEmoji('🔑')
        );

        await interaction.channel.send({ embeds: [trEmbed], components: [row] });

        // 💎 SADECE SANA GÖRÜNECEK PREMIUM ONAY MESAJI
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Kurulum Başarılı')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`Türkçe Key Menüsü Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Oluşturuldu\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};