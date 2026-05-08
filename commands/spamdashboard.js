const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../spam-db.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guard-panel')
        .setDescription('🎛️ LUAWARE Guard aktif koruma sistemlerini yönetin.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
        let protectedChannels = JSON.parse(fs.readFileSync(dbPath));

        if (protectedChannels.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setTitle('🛡️ LUAWARE OS | Guard Paneli')
                .setColor('#FEE75C')
                .setDescription(
                    `⚙️ **Sistem -->** \`LUAWARE Anti-Spam Guard\`\n` +
                    `⚠️ **Durum -->** \`Aktif koruma altında olan hiçbir kanal bulunmuyor.\``
                );
            return interaction.reply({ embeds: [emptyEmbed], ephemeral: true });
        }

        const options = protectedChannels.map(id => ({
            label: interaction.guild.channels.cache.get(id)?.name || 'Bilinmeyen Kanal',
            description: 'Bu kanalın kalkanını devre dışı bırak.',
            emoji: '🛑',
            value: id,
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('remove_spam_protection')
            .setPlaceholder('Korumayı kaldırmak için bir kanal seçin...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setTitle('🛡️ LUAWARE OS | Guard Kontrol Paneli')
            .setColor('#2B2D31')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setDescription(
                `📌 **Durum -->** \`Aktif Kalkanlar Listeleniyor\`\n` +
                `📝 **İşlem -->** \`Kalkanı indirmek istediğiniz kanalı aşağıdaki menüden seçin.\`\n\n` +
                `🛡️ **Koruma Altındaki Kanallar:**\n` +
                protectedChannels.map(id => `> 🟢 <#${id}>`).join('\n')
            )
            .setFooter({ text: 'LUAWARE Security Systems' })
            .setTimestamp();

        const response = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const collector = response.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'remove_spam_protection') {
                const channelIdToRemove = i.values[0];
                
                protectedChannels = protectedChannels.filter(id => id !== channelIdToRemove);
                fs.writeFileSync(dbPath, JSON.stringify(protectedChannels, null, 2));

                const removedEmbed = new EmbedBuilder()
                    .setTitle('✅ Kalkan Devre Dışı Bırakıldı')
                    .setColor('#ED4245')
                    .setDescription(
                        `⚙️ **İşlem -->** \`Anti-Spam Kalkanı İptali\`\n` +
                        `✅ **Durum -->** \`Başarıyla Kapatıldı\`\n` +
                        `📍 **Kanal -->** <#${channelIdToRemove}>\n` +
                        `👮 **İşlemi Yapan -->** <@${i.user.id}>\n` +
                        `📅 **Zaman -->** <t:${Math.floor(Date.now() / 1000)}:f>`
                    )
                    .setFooter({ text: 'LUAWARE OS Guard' });

                await i.update({ embeds: [removedEmbed], components: [] });
            }
        });
    },
};