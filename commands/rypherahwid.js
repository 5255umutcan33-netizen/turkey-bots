const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rypherahwid')
        .setDescription('HWID sıfırlama işlemi yapar.')
        .addStringOption(opt => opt.setName('id').setDescription('6 Haneli Teknik ID').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const id = interaction.options.getString('id');
        const data = await KeyModel.findOne({ keyId: id });

        if (!data) return interaction.reply({ content: '❌ `ID bulunamadı!`', ephemeral: true });

        data.hwid = null;
        await data.save();

        const resEmbed = new EmbedBuilder()
            .setTitle('💎 RYPHERA | HWID RESET')
            .setColor('#00FF00')
            .setDescription(
                `🟢 **İşlem Başarılı**\n` +
                `↳ Hedef ID: \`${id}\`\n` +
                `↳ Durum: \`SIFIRLANDI\`\n\n` +
                `⚪ **Not**\n` +
                `↳ Kullanıcı artık yeni bir cihazdan giriş yapabilir.`
            );

        await interaction.reply({ embeds: [resEmbed] });
    },
};