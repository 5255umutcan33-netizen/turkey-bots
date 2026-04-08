const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keyalkureng')
        .setDescription('Setup English license panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        
        // 💎 KULLANICILARIN GÖRECEĞİ PREMIUM LİSANS EKRANI
        const enEmbed = new EmbedBuilder()
            .setTitle('💎 Ryphera OS | License Center')
            .setColor('#2B2D31')
            .setDescription(
                `👋 **Welcome to the License Center!**\n\n` +
                `📌 **Status -->** \`🟢 Active\`\n` +
                `⚙️ **System -->** \`Ryphera OS\`\n` +
                `📝 **Action -->** \`Click the button below to generate your personal key.\`\n\n` +
                `⚠️ **Note!! DO NOT SHARE YOUR KEY WITH ANYONE**`
            )
            .setFooter({ text: 'Ryphera OS Security' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('get_key_en')
                .setLabel('Get Key')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔑')
        );

        await interaction.channel.send({ embeds: [enEmbed], components: [row] });

        // 💎 SADECE SANA GÖRÜNECEK PREMIUM ONAY MESAJI
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Setup Complete')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`İngilizce Key Menüsü Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Oluşturuldu\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};