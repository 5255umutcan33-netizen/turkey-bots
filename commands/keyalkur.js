const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keyalkur')
        .setDescription('Key alma panelini bu kanala kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🔥 Premium Script Sistemine Hoş Geldin')
            .setDescription('Scripti kullanmak için aşağıdaki **Key Al** butonuna tıklayarak sistemden sana özel bir Key oluşturabilirsin.\n\nOluşturulan key bot tarafından sana **Özel Mesaj (DM)** yoluyla iletilecektir.')
            .setColor('#2b2d31')
            .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzMxeG5qZ2YzeHJxZ3J0Z3N1YmJtbnp1NXg2Z2R2eWV1YXR1cjZxeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svkIWwpVYr/giphy.gif') // Havalı bir hacker gifi koydum, istersen silebilirsin
            .setFooter({ text: 'Sistem 7/24 Aktif' });

        const button = new ButtonBuilder()
            .setCustomId('generate_key')
            .setLabel('🔑 Key Al')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Panel başarıyla kuruldu kanka!', ephemeral: true });
    },
};