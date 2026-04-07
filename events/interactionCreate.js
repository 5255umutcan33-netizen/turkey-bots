const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const RypheraKey = require('../models/key');
const moment = require('moment');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.execute(interaction); } catch (e) { console.error(e); }
        }

        if (!interaction.isButton()) return;
        const cid = interaction.customId;

        // --- LİSANS ALMA (TR & EN) ---
        if (cid === 'get_ryp_tr' || cid === 'get_ryp_en') {
            const isEn = cid === 'get_ryp_en';
            const existing = await RypheraKey.findOne({ createdBy: interaction.user.id });

            if (existing) {
                return interaction.reply({ 
                    content: isEn ? `❌ **System Alert**\n↳ Key: \`${existing.key}\`` : `❌ **Sistem Uyarısı**\n↳ Mevcut Key: \`${existing.key}\``, 
                    ephemeral: true 
                });
            }

            const teknikId = Math.floor(100000 + Math.random() * 900000).toString();
            const rypKey = `RYP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

            const newEntry = new RypheraKey({ key: rypKey, keyId: teknikId, createdBy: interaction.user.id });

            try {
                await newEntry.save();
                const dmEmbed = new EmbedBuilder()
                    .setTitle(isEn ? '💎 RYPHERA | INVENTORY' : '💎 RYPHERA | ENVANTER')
                    .setColor('#FF0000')
                    .setDescription(
                        isEn ? 
                        `🟢 **License Info**\n` +
                        `↳ Key: \`${rypKey}\`\n` +
                        `↳ ID: \`${teknikId}\`\n\n` +
                        `🔵 **Membership**\n` +
                        `↳ Status: \`LIFETIME\`\n` +
                        `↳ Leave: \`AUTO-DELETE\`` :
                        `🟢 **Lisans Bilgisi**\n` +
                        `↳ Key: \`${rypKey}\`\n` +
                        `↳ Teknik ID: \`${teknikId}\`\n\n` +
                        `🔵 **Üyelik Durumu**\n` +
                        `↳ Süre: \`SINIRSIZ\`\n` +
                        `↳ Çıkış: \`OTOMATİK SİLİNME\``
                    );

                await interaction.user.send({ embeds: [dmEmbed] });
                return interaction.reply({ content: isEn ? '✅ `Sent to DMs!`' : '✅ `DM Kutuna Atıldı!`', ephemeral: true });
            } catch (err) {
                return interaction.reply({ content: '❌ `DMs Closed!`', ephemeral: true });
            }
        }

        // --- LİSTELEME VE SAYFALAMA ---
        if (cid === 'confirm_list_keys' || cid.startsWith('page_')) {
            let page = cid.startsWith('page_') ? parseInt(cid.split('_')[1]) : 0;
            const keys = await RypheraKey.find().sort({ createdAt: 1 });
            const pageSize = 5;
            const pages = Math.ceil(keys.length / pageSize);
            const current = keys.slice(page * pageSize, (page + 1) * pageSize);

            const listEmbed = new EmbedBuilder()
                .setTitle('💎 RYPHERA | DATABASE')
                .setColor('#FF0000')
                .setFooter({ text: `Page ${page + 1} / ${pages}` });

            current.forEach((k, i) => {
                listEmbed.addFields({
                    name: `📁 **Entry #${(page * pageSize) + i + 1}**`,
                    value: `↳ Key: \`${k.key}\`\n↳ ID: \`${k.keyId}\`\n↳ Owner: <@${k.createdBy}>\n↳ HWID: \`${k.hwid ? 'LOCKED' : 'EMPTY'}\``
                });
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`page_${page - 1}`).setLabel('⬅️').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId(`page_${page + 1}`).setLabel('➡️').setStyle(ButtonStyle.Secondary).setDisabled(page + 1 >= pages)
            );
            return interaction.update({ embeds: [listEmbed], components: [row] });
        }
    },
};