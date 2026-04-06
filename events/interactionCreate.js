const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KeyModel = require('../models/key');
const moment = require('moment');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // --- 1. SLASH KOMUTLAR ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.execute(interaction); } catch (e) { console.error(e); }
        }

        // --- 2. BUTONLAR ---
        if (!interaction.isButton()) return;

        // İPTAL BUTONU
        if (interaction.customId === 'cancel_list_keys') {
            return interaction.update({ content: '❌ İşlem iptal edildi.', embeds: [], components: [] });
        }

        // ONAY VE SAYFALAMA MANTIĞI
        if (interaction.customId.startsWith('confirm_list_keys') || interaction.customId.startsWith('page_')) {
            let page = 0;
            if (interaction.customId.startsWith('page_')) {
                page = parseInt(interaction.customId.split('_')[1]);
            }

            const allKeys = await KeyModel.find().sort({ createdAt: 1 }); // Eskiden yeniye sırala
            const totalKeys = allKeys.length;
            const pageSize = 5; // Her sayfada 5 key gösterilsin (Mermi gibi temiz durur)
            const totalPages = math.ceil(totalKeys / pageSize);
            
            // Mevcut sayfa verisini kes
            const start = page * pageSize;
            const currentKeys = allKeys.slice(start, start + pageSize);

            const listEmbed = new EmbedBuilder()
                .setTitle(`🇹🇷 TURKEY HUB | MEVCUT LİSANSLAR (${totalKeys})`)
                .setColor('#FF0000')
                .setFooter({ text: `Sayfa ${page + 1} / ${totalPages}` });

            currentKeys.forEach((k, index) => {
                const globalIndex = start + index + 1;
                const status = k.hwid ? `✅ Kullanılmış (Cihaz: \`${k.hwid.substring(0, 8)}...\`)` : '❌ Kullanılmamış (Boşta)';
                const creator = `<@${k.createdBy}>`;
                const date = moment(k.createdAt).format('DD/MM/YYYY HH:mm');

                listEmbed.addFields({
                    name: `🔑 Key #${globalIndex}`,
                    value: `**Anahtar:** \`${k.key}\`\n**Sahibi:** ${k.createdBy ? `<@${k.createdBy}>` : 'Bilinmiyor'}\n**Durum:** ${status}\n**Yetkili:** ${creator}\n**Tarih:** ${date}`,
                    inline: false
                });
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`page_${page - 1}`)
                    .setLabel('⬅️ Geri')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId(`page_${page + 1}`)
                    .setLabel('İleri ➡️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page + 1 >= totalPages)
            );

            await interaction.update({ embeds: [listEmbed], components: [row] });
        }

        // ... (Diğer get_key buton kodların buraya devam eder)
    },
};