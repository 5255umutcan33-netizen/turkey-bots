const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../spam-db.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spamdashboard')
        .setDescription('Spam koruması aktif olan kanalları yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
        let protectedChannels = JSON.parse(fs.readFileSync(dbPath));

        if (protectedChannels.length === 0) {
            return interaction.reply({ content: '🛡️ Şu anda spam koruması aktif olan hiçbir kanal yok.', ephemeral: true });
        }

        // Açılır menü seçeneklerini hazırla
        const options = protectedChannels.map(id => ({
            label: interaction.guild.channels.cache.get(id)?.name || 'Bilinmeyen Kanal',
            description: 'Bu kanaldan korumayı kaldır',
            value: id,
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('remove_spam_protection')
            .setPlaceholder('Korumayı kaldırmak için kanal seçin...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Ryphera Spam Dashboard')
            .setDescription(`Aşağıdaki kanallarda koruma aktif. Kapatmak istediğini menüden seç.\n\n` + 
                            protectedChannels.map(id => `> <#${id}>`).join('\n'))
            .setColor('#2F3136');

        const response = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        // Tıklamaları dinle
        const collector = response.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'remove_spam_protection') {
                const channelIdToRemove = i.values[0];
                
                // Veritabanından sil
                protectedChannels = protectedChannels.filter(id => id !== channelIdToRemove);
                fs.writeFileSync(dbPath, JSON.stringify(protectedChannels, null, 2));

                await i.update({ content: `✅ <#${channelIdToRemove}> kanalından spam koruması **kaldırıldı**!`, embeds: [], components: [] });
            }
        });
    },
};