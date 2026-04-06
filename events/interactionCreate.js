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

        // --- 2. BUTON KONTROLLERİ ---
        if (!interaction.isButton()) return;

        const customId = interaction.customId;

        // A. LİSTELEME İPTAL
        if (customId === 'cancel_list_keys') {
            return interaction.update({ content: '❌ İşlem iptal edildi kanka.', embeds: [], components: [] });
        }

        // B. LİSTELEME ONAY VE SAYFALAMA (ADMİN ÖZEL)
        if (customId === 'confirm_list_keys' || customId.startsWith('page_')) {
            let page = 0;
            if (customId.startsWith('page_')) {
                page = parseInt(customId.split('_')[1]);
            }

            const allKeys = await KeyModel.find().sort({ createdAt: 1 });
            const totalKeys = allKeys.length;
            const pageSize = 5; 
            const totalPages = Math.ceil(totalKeys / pageSize);
            
            const start = page * pageSize;
            const currentKeys = allKeys.slice(start, start + pageSize);

            const listEmbed = new EmbedBuilder()
                .setTitle(`🇹🇷 TURKEY HUB | LİSANS LİSTESİ (${totalKeys})`)
                .setColor('#FF0000')
                .setFooter({ text: `Sayfa ${page + 1} / ${totalPages}` });

            if (totalKeys === 0) {
                listEmbed.setDescription('Veritabanında henüz hiç key yok kanka.');
            } else {
                currentKeys.forEach((k, index) => {
                    const status = k.hwid ? `✅ Kullanıldı (\`${k.hwid.substring(0, 10)}...\`)` : '❌ Boşta (Kullanılmadı)';
                    listEmbed.addFields({
                        name: `🔑 #${start + index + 1} - ${k.key}`,
                        value: `**Sahibi:** <@${k.createdBy}>\n**Durum:** ${status}\n**Tarih:** ${moment(k.createdAt).format('DD/MM/YYYY HH:mm')}`,
                        inline: false
                    });
                });
            }

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
                    .setDisabled(page + 1 >= totalPages || totalKeys === 0)
            );

            return interaction.update({ embeds: [listEmbed], components: [row] });
        }

        // C. KEY ALMA BUTONLARI (TR & EN)
        if (customId === 'get_key_tr' || customId === 'get_key_en') {
            const isEnglish = customId === 'get_key_en';

            // "Zaten keyin var" kontrolünü SADECE burada yapıyoruz!
            const existingKey = await KeyModel.findOne({ createdBy: interaction.user.id });
            if (existingKey) {
                const msg = isEnglish ? "You already have a key!" : "Zaten bir keyin var kanka!";
                return interaction.reply({ content: `❌ ${msg} \nKey: \`${existingKey.key}\``, ephemeral: true });
            }

            const generatedKey = `TURKEY-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
            const newKey = new KeyModel({
                key: generatedKey,
                createdBy: interaction.user.id
            });

            try {
                await newKey.save();
                const dmEmbed = new EmbedBuilder()
                    .setTitle(isEnglish ? '🇺🇸 LICENSE' : '🇹🇷 LİSANS')
                    .setColor('#FF0000')
                    .setDescription(isEnglish ? `Your key: \`${generatedKey}\`` : `Anahtarın: \`${generatedKey}\``)
                    .addFields({ name: '⚠️ Info', value: isEnglish ? 'If you leave, your key dies!' : 'Çıkarsan keyin patlar!' });

                await interaction.user.send({ embeds: [dmEmbed] });
                return interaction.reply({ content: isEnglish ? '✅ Check DMs!' : '✅ Keyin DM kutuna atıldı!', ephemeral: true });
            } catch (err) {
                return interaction.reply({ content: '❌ DM Closed!', ephemeral: true });
            }
        }
    },
};