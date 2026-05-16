const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sifrelekur')
        .setDescription('Kullanıcıların kodlarını şifreleyebileceği paneli kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        // 💎 Şifreleme Paneli Tasarımı
        const panelEmbed = new EmbedBuilder()
            .setTitle('🔐 LUAWARE | Gelişmiş Şifreleme Merkezi')
            .setColor('#2B2D31')
            .setDescription(
                `👋 **LUAWARE Obfuscation Motoruna Hoş Geldiniz!**\n\n` +
                `Lua kodlarınızı hırsızlara (Skid) karşı korumak ve güvenli hale getirmek için XOR-Byte şifreleme teknolojimizi kullanabilirsiniz.\n\n` +
                `👇 **Nasıl Yapılır?**\n` +
                `Aşağıdaki butona tıklayın ve açılan pencereye şifrelemek istediğiniz kodunuzu yapıştırın.`
            )
            .setFooter({ text: 'LUAWARE Anti-Skid Security' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_obfuscate')
                .setLabel('Kodu Şifrele')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🛡️')
        );

        await interaction.channel.send({ embeds: [panelEmbed], components: [row] });

        // Yöneticiye giden gizli onay mesajı
        await interaction.reply({ content: '✅ Şifreleme paneli başarıyla kuruldu!', ephemeral: true });
    }
};