const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keyalkurtr')
        .setDescription('Türkçe LUAWARE lisans panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        
        // 💎 KULLANICILARIN GÖRECEĞİ LUAWARE PREMIUM EKRANI
        const trEmbed = new EmbedBuilder()
            .setTitle('💎 LUAWARE | Lisans Merkezi')
            .setColor('#2B2D31')
            .setDescription(
                `👋 **LUAWARE Lisans Merkezine Hoş Geldiniz!**\n\n` +
                `📌 **Durum -->** \`🟢 Aktif\`\n` +
                `⚙️ **Sistem -->** \`LUAWARE Security\`\n` +
                `📝 **İşlem -->** \`Hile anahtarınızı almak, aktif etmek veya sıfırlamak için aşağıdaki butonları kullanın.\`\n\n` +
                `⚠️ **Dikkat!! ANAHTARINIZI KİMSE İLE PAYLAŞMAYIN**`
            )
            .setImage('https://cdn.discordapp.com/attachments/1111/1111/luaware_banner.png') // İstersen buraya havalı bir banner linki koyabilirsin
            .setFooter({ text: 'LUAWARE Security System' });

        // 1. SATIR BUTONLARI (Anahtar Al ve Aktif Et)
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('get_key_tr')
                .setLabel('Anahtar Al')
                .setStyle(ButtonStyle.Danger) 
                .setEmoji('🔑'),
            new ButtonBuilder()
                .setCustomId('activate_key_tr')
                .setLabel('Key Aktif Et')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🚀')
        );

        // 2. SATIR BUTONLARI (HWID Sıfırla ve Nasıl Alınır)
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('reset_hwid_tr')
                .setLabel('HWID Sıfırla')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('💻'),
            new ButtonBuilder()
                .setCustomId('how_to_get_tr')
                .setLabel('Nasıl Alınır?')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('❓')
        );

        await interaction.channel.send({ embeds: [trEmbed], components: [row1, row2] });

        // 💎 SADECE SANA GÖRÜNECEK ONAY MESAJI
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Kurulum Başarılı')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`Türkçe LUAWARE Key Menüsü Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Oluşturuldu\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};