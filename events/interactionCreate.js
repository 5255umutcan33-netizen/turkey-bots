const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KeyModel = require('../models/key');

const cooldown = new Set(); // Çift tıklamayı engellemek için

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // --- 1. KOMUT ÇALIŞTIRICI ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: '`HATA: Komut çalıştırılamadı.`', ephemeral: true });
                } else {
                    await interaction.reply({ content: '`HATA: Komut çalıştırılamadı.`', ephemeral: true });
                }
            }
            return;
        }

        // --- 2. BUTON KONTROLLERİ ---
        if (!interaction.isButton()) return;
        
        // Cooldown Kontrolü (Çift İşlemi Engeller)
        if (cooldown.has(interaction.user.id)) {
            return interaction.reply({ content: '`SİSTEM: Lütfen işlemin bitmesini bekleyin...`', ephemeral: true });
        }

        const cid = interaction.customId;
        const OWNER_ID = 'SENIN_ID_BURAYA_YAZILACAK'; // KENDI ID'NI YAZ!

        // A) KEY ALMA BUTONLARI
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            cooldown.add(interaction.user.id);
            setTimeout(() => cooldown.delete(interaction.user.id), 5000); // 5 sn bekleme süresi

            const isEn = cid === 'get_key_en';
            const existing = await KeyModel.findOne({ createdBy: interaction.user.id });

            if (existing) {
                return interaction.reply({ 
                    content: isEn ? `\`SYSTEM: You already have a key: ${existing.key}\`` : `\`SİSTEM: Zaten bir anahtarın var: ${existing.key}\``, 
                    ephemeral: true 
                });
            }

            const rypKey = `RYP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            const keyId = Math.floor(100000 + Math.random() * 900000).toString();

            const newKey = new KeyModel({ key: rypKey, keyId: keyId, createdBy: interaction.user.id });
            await newKey.save();

            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('RYPHERA | LICENSE')
                    .setColor('#00FF00')
                    .setDescription(isEn ? `Key: \`${rypKey}\`\nStatus: \`Lifetime\`` : `Anahtar: \`${rypKey}\`\nDurum: \`Sınırsız\``);
                
                await interaction.user.send({ embeds: [dmEmbed] });
                return interaction.reply({ content: isEn ? '`SUCCESS: Key sent to your DMs!`' : '`BAŞARILI: Key DM kutuna atıldı!`', ephemeral: true });
            } catch (e) {
                return interaction.reply({ content: isEn ? '`ERROR: Open your DMs!`' : '`HATA: DM kutun kapalı!`', ephemeral: true });
            }
        }

        // B) VERİTABANI SAYFALAMA
        if (cid === 'confirm_list_keys' || cid.startsWith('page_')) {
            let page = cid.startsWith('page_') ? parseInt(cid.split('_')[1]) : 0;
            const allKeys = await KeyModel.find().sort({ createdAt: -1 });
            const pageSize = 5;
            const pages = Math.ceil(allKeys.length / pageSize);
            const current = allKeys.slice(page * pageSize, (page + 1) * pageSize);

            const listEmbed = new EmbedBuilder().setTitle('RYPHERA | DATABASE').setColor('#FF0000').setFooter({ text: `Sayfa ${page + 1} / ${pages || 1}` });

            if (allKeys.length === 0) {
                listEmbed.setDescription('`Veritabanı boş.`');
            } else {
                current.forEach((k, i) => listEmbed.addFields({ name: `Kayıt #${(page * pageSize) + i + 1}`, value: `Key: \`${k.key}\` | Sahip: <@${k.createdBy}>` }));
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`page_${page - 1}`).setLabel('Geri').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId(`page_${page + 1}`).setLabel('İleri').setStyle(ButtonStyle.Secondary).setDisabled(page + 1 >= pages || allKeys.length === 0)
            );

            return interaction.update({ embeds: [listEmbed], components: [row] });
        }

        // C) VERİTABANI TEMİZLEME
        if (cid === 'confirm_delete_all') {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '`YETKİ YOK`', ephemeral: true });
            await KeyModel.deleteMany({});
            return interaction.update({ content: '`SİSTEM: Veritabanı temizlendi.`', embeds: [], components: [] });
        }

        if (cid === 'cancel_delete_all' || cid === 'cancel_list_keys') {
            return interaction.update({ content: '`İptal edildi.`', embeds: [], components: [] });
        }
    }
};