const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KeyModel = require('../models/key'); // Veritabanı modelinle aynı olduğundan emin ol

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // --- SLASH KOMUTLAR ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.execute(interaction); } catch (e) { console.error(e); }
        }

        // --- BUTONLAR ---
        if (!interaction.isButton()) return;
        const cid = interaction.customId;

        // 1. Tüm Keyleri Silme (Onay)
        if (cid === 'confirm_delete_all') {
            try {
                await KeyModel.deleteMany({});
                return interaction.update({ content: '`SİSTEM: Veritabanı tamamen temizlendi.`', embeds: [], components: [] });
            } catch (err) {
                return interaction.reply({ content: '`HATA: Veriler silinemedi.`', ephemeral: true });
            }
        }

        // 2. İşlem İptal (Genel)
        if (cid === 'cancel_delete_all' || cid === 'cancel_list_keys') {
            return interaction.update({ content: '`İŞLEM: Kullanıcı tarafından iptal edildi.`', embeds: [], components: [] });
        }

        // 3. Mevcut Keyleri Listeleme (Sayfalama)
        if (cid === 'confirm_list_keys' || cid.startsWith('page_')) {
            let page = cid.startsWith('page_') ? parseInt(cid.split('_')[1]) : 0;
            const allKeys = await KeyModel.find().sort({ createdAt: 1 });
            const pageSize = 5;
            const pages = Math.ceil(allKeys.length / pageSize);
            const current = allKeys.slice(page * pageSize, (page + 1) * pageSize);

            const listEmbed = new EmbedBuilder()
                .setTitle('RYPHERA | DATABASE')
                .setColor('#FF0000');

            if (allKeys.length === 0) {
                listEmbed.setDescription('`SİSTEM: Veritabanında kayıtlı anahtar yok.`');
            } else {
                current.forEach((k, i) => {
                    listEmbed.addFields({
                        name: `Kayıt #${(page * pageSize) + i + 1}`,
                        value: `Key: \`${k.key}\` | ID: \`${k.keyId}\` | Sahibi: <@${k.createdBy}> | Durum: \`${k.hwid ? 'LOCKED' : 'READY'}\``
                    });
                });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`page_${page - 1}`).setLabel('Geri').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId(`page_${page + 1}`).setLabel('İleri').setStyle(ButtonStyle.Secondary).setDisabled(page + 1 >= pages || allKeys.length === 0)
            );
            return interaction.update({ embeds: [listEmbed], components: [row] });
        }

        // 4. Key Alma (TR/EN)
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            const isEn = cid === 'get_key_en';
            const existing = await KeyModel.findOne({ createdBy: interaction.user.id });

            if (existing) {
                return interaction.reply({ 
                    content: isEn ? `System: Your active key is \`${existing.key}\`` : `Sistem: Aktif anahtarın \`${existing.key}\``, 
                    ephemeral: true 
                });
            }

            const teknikId = Math.floor(100000 + Math.random() * 900000).toString();
            const rypKey = `RYP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

            const newEntry = new KeyModel({ key: rypKey, keyId: teknikId, createdBy: interaction.user.id });

            try {
                await newEntry.save();
                const dmEmbed = new EmbedBuilder()
                    .setTitle('RYPHERA | LICENSE')
                    .setColor('#FF0000')
                    .setDescription(
                        isEn ? 
                        `Key: \`${rypKey}\`\nID: \`${teknikId}\`\nStatus: \`LIFETIME\`` :
                        `Anahtar: \`${rypKey}\`\nID: \`${teknikId}\`\nSüre: \`SINIRSIZ\``
                    );

                await interaction.user.send({ embeds: [dmEmbed] });
                return interaction.reply({ content: isEn ? '`SUCCESS: Key sent to DMs.`' : '`BAŞARILI: Anahtar DM kutuna gönderildi.`', ephemeral: true });
            } catch (err) {
                return interaction.reply({ content: '`HATA: DM kutun kapalı.`', ephemeral: true });
            }
        }
    },
};