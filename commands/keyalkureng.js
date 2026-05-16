const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keyalkureng')
        .setDescription('Setup English LUAWARE license panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        
        // 💎 USERS WILL SEE THIS PREMIUM SCREEN
        const enEmbed = new EmbedBuilder()
            .setTitle('💎 LUAWARE | License Center')
            .setColor('#2B2D31')
            .setDescription(
                `👋 **Welcome to the LUAWARE License Center!**\n\n` +
                `📌 **Status -->** \`🟢 Active\`\n` +
                `⚙️ **System -->** \`LUAWARE Security\`\n` +
                `📝 **Action -->** \`Use the buttons below to get, activate or reset your script key.\`\n\n` +
                `⚠️ **Note!! DO NOT SHARE YOUR KEY WITH ANYONE**`
            )
            .setFooter({ text: 'LUAWARE Security System' });

        // ROW 1 BUTTONS
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('get_key_en')
                .setLabel('Get Key')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔑'),
            new ButtonBuilder()
                .setCustomId('activate_key_en')
                .setLabel('Activate Key')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🚀')
        );

        // ROW 2 BUTTONS
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('reset_hwid_en')
                .setLabel('Reset HWID')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('💻'),
            new ButtonBuilder()
                .setCustomId('how_to_get_en')
                .setLabel('How to Get?')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('❓')
        );

        await interaction.channel.send({ embeds: [enEmbed], components: [row1, row2] });

        // 💎 ONLY VISIBLE TO ADMIN
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Setup Complete')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **Action -->** \`English LUAWARE Key Menu Setup\`\n` +
                `✅ **Status -->** \`Successfully Created\`\n` +
                `📍 **Channel -->** <#${interaction.channelId}>\n` +
                `👮 **Admin -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};