const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('formateng')
        .setDescription('Creates a professional script presentation template. (Admins Only)')
        // YALNIZCA YÖNETİCİLER (ADMİN) KULLANABİLİR
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) 
        .addStringOption(option => option.setName('name').setDescription('Script Name (e.g., Ryphera Hub)').setRequired(true))
        .addStringOption(option => option.setName('code').setDescription('Script Code (e.g., loadstring...)').setRequired(true))
        .addStringOption(option => option.setName('features').setDescription('Features (separate with spaces. e.g., Aimbot ESP Fly)').setRequired(true))
        .addAttachmentOption(option => option.setName('image').setDescription('Script Image').setRequired(false)),

    async execute(interaction) {
        const name = interaction.options.getString('name');
        const code = interaction.options.getString('code');
        const features = interaction.options.getString('features');
        const image = interaction.options.getAttachment('image');

        const featureList = features.split(/\s+/)
            .slice(0, 20)
            .filter(feature => feature.length > 0)
            .map(feature => `• ${feature}`)
            .join('\n');

        // 💎 PREMİUM FORMAT EKRANI (İNGİLİZCE)
        const embed = new EmbedBuilder()
            .setTitle(`💎 Ryphera OS | Script Release`)
            .setColor('#2B2D31')
            .setDescription(
                `📌 **Status -->** \`Active & Working\`\n` +
                `🎮 **Game / Script Name -->** \`${name}\`\n` +
                `👮 **Shared by -->** <@${interaction.user.id}>`
            )
            // ⚠️ DİKKAT: Mobil kopyalama butonu kodları fields[1]'den çektiği için sıra bozulmadı!
            .addFields(
                { name: '✨ Features', value: `>>> ${featureList}`, inline: false },
                { name: '💻 Script Code', value: `\`\`\`lua\n${code}\n\`\`\``, inline: false }
            )
            .setFooter({ text: 'Ryphera OS System | Mobile users click the button below' })
            .setTimestamp();

        if (image) {
            embed.setImage(image.url);
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('mobil_kopyala_btn')
                .setLabel('Copy for Mobile')
                .setEmoji('📱') // TR versiyonundaki gibi uyumlu olması için emoji eklendi
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};