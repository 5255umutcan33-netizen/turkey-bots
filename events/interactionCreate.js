const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KeyModel = require('../models/key');
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
        const customId = interaction.customId;

        // --- TÜM KEYLERİ SİLME ONAYI ---
        if (customId === 'confirm_delete_all') {
            await KeyModel.deleteMany({});
            return interaction.update({ content: '✅ Veritabanı tamamen temizlendi kanka. Tüm keyler silindi!', embeds: [], components: [] });
        }
        if (customId === 'cancel_delete_all') {
            return interaction.update({ content: '❌ İşlem iptal edildi.', embeds: [], components: [] });
        }

        // --- MEVCUT KEYLERİ LİSTELEME (SAYFALAMA) ---
        if (customId === 'confirm_list_keys' || customId.startsWith('page_')) {
            let page = customId.startsWith('page_') ? parseInt(customId.split('_')[1]) : 0;
            const allKeys = await KeyModel.find().sort({ createdAt: 1 });
            const pageSize = 5;
            const totalPages = Math.ceil(allKeys.length / pageSize);
            const currentKeys = allKeys.slice(page * pageSize, (page + 1) * pageSize);

            const listEmbed = new EmbedBuilder()
                .setTitle(`🇹🇷 MEVCUT LİSANSLAR (${allKeys.length})`)
                .setColor('#FF0000')
                .setFooter({ text: `Sayfa ${page + 1} / ${totalPages}` });

            currentKeys.forEach((k, index) => {
                const status = k.hwid ? '✅ Aktif' : '❌ Beklemede';
                listEmbed.addFields({
                    name: `🆔 ID: ${k.keyId} | Key: ${k.key}`,
                    value: `**Sahibi:** <@${k.createdBy}>\n**Durum:** ${status}\n**Tarih:** ${moment(k.createdAt).format('DD/MM/YYYY')}`,
                    inline: false
                });
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`page_${page - 1}`).setLabel('⬅️').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId(`page_${page + 1}`).setLabel('➡️').setStyle(ButtonStyle.Secondary).setDisabled(page + 1 >= totalPages)
            );
            return interaction.update({ embeds: [listEmbed], components: [row] });
        }

        // --- KEY ALMA (TR & EN) ---
        if (customId === 'get_key_tr' || customId === 'get_key_en') {
            const isEnglish = customId === 'get_key_en';
            const existingKey = await KeyModel.findOne({ createdBy: interaction.user.id });

            if (existingKey) {
                return interaction.reply({ content: isEnglish ? `❌ Already have: \`${existingKey.key}\`` : `❌ Zaten var: \`${existingKey.key}\``, ephemeral: true });
            }

            // 6 Haneli Teknik ID ve Lisans Üretimi
            const teknikId = Math.floor(100000 + Math.random() * 900000).toString();
            const lisans = `TURKEY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

            const newKey = new KeyModel({
                key: lisans,
                keyId: teknikId,
                createdBy: interaction.user.id
            });

            try {
                await newKey.save();
                const dmEmbed = new EmbedBuilder()
                    .setTitle(isEnglish ? '🇺🇸 LICENSE GRANTED' : '🇹🇷 LİSANS TANIMLANDI')
                    .setColor('#FF0000')
                    .addFields(
                        { name: isEnglish ? '🔑 KEY' : '🔑 ANAHTAR', value: `\`${lisans}\``, inline: true },
                        { name: '🆔 KEY ID', value: `\`${teknikId}\``, inline: true },
                        { name: isEnglish ? '⚠️ INFO' : '⚠️ BİLGİ', value: isEnglish ? 'Lifetime access. Leaves = Delete.' : 'Sınırsız erişim. Çıkarsan silinir.' }
                    );

                await interaction.user.send({ embeds: [dmEmbed] });
                return interaction.reply({ content: isEnglish ? '✅ Check DMs!' : '✅ Key DMden gönderildi!', ephemeral: true });
            } catch (err) {
                return interaction.reply({ content: '❌ DM Closed!', ephemeral: true });
            }
        }
    },
};