const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sifrelekur')
        .setDescription('Kullanıcıların kodlarını şifreleyebileceği paneli kurar (TR/EN).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        // 💎 TR/EN Şifreleme Paneli Tasarımı
        const panelEmbed = new EmbedBuilder()
            .setTitle('🔐 LUAWARE | Advanced Obfuscation Center')
            .setColor('#2B2D31')
            .setDescription(
                `🇹🇷 **LUAWARE Şifreleme Motoruna Hoş Geldiniz!**\nLua kodlarınızı hırsızlara (Skid) karşı korumak ve güvenli hale getirmek için XOR-Byte şifreleme teknolojimizi kullanabilirsiniz. Kodu yapıştırmak için butona tıklayın.\n\n` +
                `🇬🇧 **Welcome to LUAWARE Obfuscation Engine!**\nYou can use our XOR-Byte encryption technology to protect your Lua scripts against thieves (Skids). Click the button to paste your code.`
            )
            .setFooter({ text: 'LUAWARE Anti-Skid Security' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_obfuscate_tr')
                .setLabel('Kodu Şifrele (TR)')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🛡️'),
            new ButtonBuilder()
                .setCustomId('btn_obfuscate_en')
                .setLabel('Obfuscate Code (EN)')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🛡️')
        );

        await interaction.channel.send({ embeds: [panelEmbed], components: [row] });
        await interaction.reply({ content: '✅ TR/EN Şifreleme paneli başarıyla kuruldu!', ephemeral: true });
    }
};