const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KeyModel = require('../models/key');

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

        // KEY ALMA İŞLEMİ
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            const isEn = cid === 'get_key_en';
            const existing = await KeyModel.findOne({ createdBy: interaction.user.id });

            if (existing) {
                return interaction.reply({ 
                    content: isEn ? `Your Key: \`${existing.key}\`` : `Mevcut Key: \`${existing.key}\``, 
                    ephemeral: true 
                });
            }

            const teknikId = Math.floor(100000 + Math.random() * 900000).toString();
            const rypKey = `RYP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

            const newEntry = new KeyModel({ key: rypKey, keyId: teknikId, createdBy: interaction.user.id });

            try {
                await newEntry.save();
                const dmEmbed = new EmbedBuilder()
                    .setTitle('RYPHERA | LİSANS')
                    .setColor('#FF0000')
                    .setDescription(
                        isEn ? 
                        `Key: \`${rypKey}\`\n` +
                        `ID: \`${teknikId}\`\n` +
                        `Duration: \`LIFETIME\`` :
                        `Anahtar: \`${rypKey}\`\n` +
                        `Teknik ID: \`${teknikId}\`\n` +
                        `Süre: \`SINIRSIZ\``
                    );

                await interaction.user.send({ embeds: [dmEmbed] });
                return interaction.reply({ content: isEn ? `\`Sent to DMs!\`` : `\`Key DM kutuna atıldı!\``, ephemeral: true });
            } catch (err) {
                return interaction.reply({ content: `\`DMs Closed!\``, ephemeral: true });
            }
        }

        // LİSTELEME VE DİĞER BUTONLAR
        if (cid === 'confirm_list_keys' || cid.startsWith('page_')) {
            let page = cid.startsWith('page_') ? parseInt(cid.split('_')[1]) : 0;
            const allKeys = await KeyModel.find().sort({ createdAt: 1 });
            const pageSize = 5;
            const pages = Math.ceil(allKeys.length / pageSize);
            const current = allKeys.slice(page * pageSize, (page + 1) * pageSize);

            const listEmbed = new EmbedBuilder()
                .setTitle('RYPHERA | DATABASE')
                .setColor('#FF0000');

            current.forEach((k, i) => {
                listEmbed.addFields({
                    name: `Giriş #${(page * pageSize) + i + 1}`,
                    value: `Key: \`${k.key}\` | ID: \`${k.keyId}\` | Sahibi: <@${k.createdBy}> | Durum: \`${k.hwid ? 'KİLİTLİ' : 'BOŞTA'}\``
                });
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`page_${page - 1}`).setLabel('Geri').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId(`page_${page + 1}`).setLabel('İleri').setStyle(ButtonStyle.Secondary).setDisabled(page + 1 >= pages)
            );
            return interaction.update({ embeds: [listEmbed], components: [row] });
        }
    },
};