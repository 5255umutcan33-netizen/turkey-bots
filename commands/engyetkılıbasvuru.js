const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('engyetkilibasvurukur')
        .setDescription('Sets up the English staff application menu.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        
        // --- KULLANICILARIN GÖRECEĞİ LUAWARE İNGİLİZCE BAŞVURU EKRANI ---
        const embed = new EmbedBuilder()
            .setTitle('📩 LUAWARE | Staff Application Form')
            .setColor('#00D4FF') // LUAWARE Teması
            .setDescription(
                `👋 **Opportunity to Join the LUAWARE Team!**\n\n` +
                `📌 **Status -->** \`🟢 Hiring Active\`\n` +
                `💼 **Position -->** \`Moderator / Support Staff\`\n` +
                `📝 **Action -->** \`Click the button below to open the application form.\`\n\n` +
                `⚠️ *Note: Applications are carefully reviewed. Make sure to fill out the form completely.*`
            )
            .setFooter({ text: 'LUAWARE Staff System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apply_en')
                .setLabel('Apply Now')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // --- SADECE SANA GÖRÜNECEK ONAY MESAJI ---
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Setup Complete')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **Process -->** \`English Staff App Menu Setup\`\n` +
                `✅ **Status -->** \`Successfully Created\`\n` +
                `📍 **Channel -->** <#${interaction.channelId}>\n` +
                `👮 **Admin -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};