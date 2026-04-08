const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../spam-db.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spamkorumakur')
        .setDescription('Bu kanala flood/spam koruması kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
        let protectedChannels = JSON.parse(fs.readFileSync(dbPath));

        const channelId = interaction.channel.id;

        if (protectedChannels.includes(channelId)) {
            return interaction.reply({ content: '❌ Bu kanalda zaten spam koruması aktif!', ephemeral: true });
        }

        protectedChannels.push(channelId);
        fs.writeFileSync(dbPath, JSON.stringify(protectedChannels, null, 2));

        await interaction.reply(`✅ **${interaction.channel.name}** kanalı Ryphera Spam koruması altına alındı! (5 mesaj = 2 Dk Mute)`);
    },
};