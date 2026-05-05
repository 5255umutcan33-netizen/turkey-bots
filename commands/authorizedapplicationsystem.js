const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enscriptsuggestsetup')
        .setDescription('Sets up the English script suggestion menu.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        
        // --- KULLANICILARIN GÖRECEĞİ LUAWARE İNGİLİZCE ÖNERİ EKRANI ---
        const embed = new EmbedBuilder()
            .setTitle('💡 LUAWARE | Script & Game Suggestion')
            .setColor('#00D4FF') // LUAWARE Mavi Teması
            .setDescription(
                `👋 **Do you have a great idea?**\n\n` +
                `📌 **Status -->** \`Suggestions Open\`\n` +
                `🎮 **Topic -->** \`New Script & Feature Ideas\`\n` +
                `📝 **Action -->** \`Click the button below to submit your idea.\`\n\n` +
                `⚠️ *Your suggestions will shape future LUAWARE updates!*`
            )
            .setFooter({ text: 'LuaWare Support System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_suggest_en')
                .setLabel('Suggest Script')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝')
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // --- SADECE SANA GÖRÜNECEK ONAY MESAJI ---
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Setup Complete')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **Process -->** \`English Script Suggestion Menu Setup\`\n` +
                `✅ **Status -->** \`Successfully Created\`\n` +
                `📍 **Channel -->** <#${interaction.channelId}>\n` +
                `👮 **Admin -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};