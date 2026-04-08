const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('authorizedapplicationsystem')
        .setDescription('Sets up the English staff application menu.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        
        // 💎 KULLANICILARIN GÖRECEĞİ PREMIUM BAŞVURU EKRANI
        const embed = new EmbedBuilder()
            .setTitle('📩 Ryphera OS | Staff Application')
            .setColor('#2B2D31')
            .setDescription(
                `👋 **Want to join our team?**\n\n` +
                `📌 **Status -->** \`Applications Open\`\n` +
                `👥 **Position -->** \`Server Staff\`\n` +
                `📝 **Action -->** \`Click the button below to fill out the form.\`\n\n` +
                `⚠️ **Note!! PLEASE ANSWER ALL QUESTIONS HONESTLY**`
            )
            .setFooter({ text: 'Ryphera OS System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apply_en')
                .setLabel('Apply Now')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // 💎 SADECE SANA GÖRÜNECEK PREMIUM ONAY MESAJI
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Setup Complete')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`İngilizce Başvuru Menüsü Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Oluşturuldu\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};