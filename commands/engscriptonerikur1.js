const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('engscriptonerikur')
        .setDescription('Setup English script suggestion panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        
        // 💎 KULLANICILARIN GÖRECEĞİ PREMIUM ÖNERİ EKRANI
        const embed = new EmbedBuilder()
            .setTitle('💡 Ryphera OS | Script Suggestion')
            .setColor('#2B2D31')
            .setDescription(
                `👋 **Have a great idea?**\n\n` +
                `📌 **Status -->** \`Suggestions Open\`\n` +
                `🎮 **Topic -->** \`Script & Game Features\`\n` +
                `📝 **Action -->** \`Click the button below to submit your idea.\`\n\n` +
                `⚠️ **Note!! YOUR SUGGESTIONS SHAPE OUR FUTURE UPDATES**`
            )
            .setFooter({ text: 'Ryphera OS System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('suggest_script_en')
                .setLabel('Suggest Script')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('💡')
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // 💎 SADECE SANA GÖRÜNECEK PREMIUM ONAY MESAJI
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Setup Complete')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`İngilizce Script Öneri Menüsü Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Oluşturuldu\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};