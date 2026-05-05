const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('engticketkur')
        .setDescription('Sets up the professional English ticket system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        
        // --- KULLANICILARIN GÖRECEĞİ LUAWARE BİLET EKRANI ---
        const embed = new EmbedBuilder()
            .setTitle('💬 LUAWARE | Support System')
            .setColor('#00D4FF') // LUAWARE Teması
            .setDescription(
                `👋 **Need Assistance?**\n\n` +
                `📌 **Status -->** \`Support Active\`\n` +
                `🏢 **Departments -->** \`Support, Partnership, Key Operations\`\n` +
                `📝 **Action -->** \`Select a department below to open a ticket.\`\n\n` +
                `⚠️ *Please do not open multiple tickets for the same issue!*`
            )
            .setFooter({ text: 'LUAWARE Support System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_en_support').setLabel('Support').setEmoji('📩').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_en_partner').setLabel('Partnership').setEmoji('🤝').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_en_key').setLabel('Key Operations').setEmoji('🔑').setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // --- SADECE SANA GÖRÜNECEK ONAY MESAJI ---
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Setup Complete')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **Process -->** \`English Ticket Menu Setup\`\n` +
                `✅ **Status -->** \`Successfully Created\`\n` +
                `📍 **Channel -->** <#${interaction.channelId}>\n` +
                `👮 **Admin -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};