const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('engticketkur')
        .setDescription('Sets up the professional English ticket system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        
        // 💎 KULLANICILARIN GÖRECEĞİ PREMIUM BİLET EKRANI
        const embed = new EmbedBuilder()
            .setTitle('💬 Ryphera OS | Support System')
            .setColor('#2B2D31')
            .setDescription(
                `👋 **Need Assistance?**\n\n` +
                `📌 **Status -->** \`Support Active\`\n` +
                `🏢 **Departments -->** \`Support, Partnership, Key Operations\`\n` +
                `📝 **Action -->** \`Select a department below to open a ticket.\`\n\n` +
                `⚠️ **Note!! DO NOT OPEN MULTIPLE TICKETS FOR THE SAME ISSUE**`
            )
            .setFooter({ text: 'Ryphera OS System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_en_support').setLabel('Support').setEmoji('📩').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_en_partner').setLabel('Partnership').setEmoji('🤝').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_en_key').setLabel('Key Operations').setEmoji('🔑').setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // 💎 SADECE SANA GÖRÜNECEK PREMIUM ONAY MESAJI
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Setup Complete')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`İngilizce Ticket Menüsü Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Oluşturuldu\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};