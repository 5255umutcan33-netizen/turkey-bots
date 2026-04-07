const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // --- 1. SLASH KOMUTLARI ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: '`HATA: Komut çalıştırılırken bir sorun oluştu!`', ephemeral: true });
                } else {
                    await interaction.reply({ content: '`HATA: Komut çalıştırılırken bir sorun oluştu!`', ephemeral: true });
                }
            }
        }

        // --- 2. BUTON ETKİLEŞİMLERİ ---
        if (!interaction.isButton()) return;

        const cid = interaction.customId;
        const OWNER_ID = 'SENIN_DISCORD_ID_BURAYA'; // Kendi ID'ni buraya yaz kanka!

        // --- A. KEY (LİSANS) ALMA SİSTEMİ ---
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            const isEn = cid === 'get_key_en';
            
            // Kullanıcının zaten keyi var mı kontrol et
            const existingKey = await KeyModel.findOne({ createdBy: interaction.user.id });

            if (existingKey) {
                return interaction.reply({ 
                    content: isEn ? `\`SYSTEM: You already have a key: ${existingKey.key}\`` : `\`SİSTEM: Zaten bir anahtarın var: ${existingKey.key}\``, 
                    ephemeral: true 
                });
            }

            // Yeni Key Oluştur (RYP-XXXX-XXXX formatında)
            const rypKey = `RYP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            const keyId = Math.floor(100000 + Math.random() * 900000).toString();

            const newEntry = new KeyModel({
                key: rypKey,
                keyId: keyId,
                createdBy: interaction.user.id
            });

            try {
                await newEntry.save();
                
                const dmEmbed = new EmbedBuilder()
                    .setTitle('RYPHERA | LICENSE GRANTED')
                    .setColor('#00FF00')
                    .setDescription(isEn ? 
                        `Your license has been generated successfully.\n\n**Key:** \`${rypKey}\`\n**ID:** \`${keyId}\`\n**Status:** \`Lifetime\`` : 
                        `Lisansınız başarıyla oluşturuldu.\n\n**Anahtar:** \`${rypKey}\`\n**ID:** \`${keyId}\`\n**Durum:** \`Sınırsız\``
                    )
                    .setFooter({ text: 'Ryphera Scripting Solutions' });

                await interaction.user.send({ embeds: [dmEmbed] });
                return interaction.reply({ content: isEn ? '`SUCCESS: Key sent to your DMs!`' : '`BAŞARILI: Anahtar DM kutuna gönderildi!`', ephemeral: true });
            } catch (err) {
                return interaction.reply({ content: isEn ? '`ERROR: Please open your DMs!`' : '`HATA: DM kutun kapalı olduğu için gönderemedim!`', ephemeral: true });
            }
        }

        // --- B. VERİTABANI LİSTELEME VE SAYFALAMA ---
        if (cid === 'confirm_list_keys' || cid.startsWith('page_')) {
            let page = cid.startsWith('page_') ? parseInt(cid.split('_')[1]) : 0;
            const allKeys = await KeyModel.find().sort({ createdAt: -1 });
            const pageSize = 5;
            const pages = Math.ceil(allKeys.length / pageSize);
            const current = allKeys.slice(page * pageSize, (page + 1) * pageSize);

            const listEmbed = new EmbedBuilder()
                .setTitle('RYPHERA | DATABASE')
                .setColor('#FF0000')
                .setFooter({ text: `Sayfa ${page + 1} / ${pages || 1}` });

            if (allKeys.length === 0) {
                listEmbed.setDescription('`Sistem: Veritabanında kayıtlı anahtar bulunamadı.`');
            } else {
                current.forEach((k, i) => {
                    listEmbed.addFields({ 
                        name: `Kayıt #${(page * pageSize) + i + 1}`, 
                        value: `Key: \`${k.key}\` | Sahibi: <@${k.createdBy}>` 
                    });
                });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`page_${page - 1}`).setLabel('⬅️ Geri').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId(`page_${page + 1}`).setLabel('İleri ➡️').setStyle(ButtonStyle.Secondary).setDisabled(page + 1 >= pages || allKeys.length === 0)
            );

            return interaction.update({ embeds: [listEmbed], components: [row] });
        }

        // --- C. TÜM KEYLERİ SİLME (OWNER ONLY) ---
        if (cid === 'confirm_delete_all') {
            if (interaction.user.id !== OWNER_ID) {
                return interaction.reply({ content: '`YETKİ: Bu işlemi sadece kurucu yapabilir!`', ephemeral: true });
            }

            await KeyModel.deleteMany({});
            return interaction.update({ content: '`⚠️ SİSTEM: Tüm veritabanı başarıyla temizlendi!`', embeds: [], components: [] });
        }

        // --- D. İPTAL BUTONLARI ---
        if (cid === 'cancel_delete_all' || cid === 'cancel_list_keys') {
            return interaction.update({ content: '`İŞLEM: Kullanıcı tarafından iptal edildi.`', embeds: [], components: [] });
        }
    },
};