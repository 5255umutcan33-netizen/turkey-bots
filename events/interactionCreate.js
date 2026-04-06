const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KeyModel = require('../models/key');
const moment = require('moment');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // --- 1. SLASH KOMUTLARIN ÇALIŞTIRILMASI ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try { 
                await command.execute(interaction); 
            } catch (error) { 
                console.error(error); 
            }
        }

        // --- 2. BUTON ETKİLEŞİMLERİ ---
        if (!interaction.isButton()) return;
        const customId = interaction.customId;

        // A. TÜM KEYLERİ SİLME ONAYI (Bot Sahibi Özel)
        if (customId === 'confirm_delete_all') {
            await KeyModel.deleteMany({});
            return interaction.update({ 
                content: '✅ **Veritabanı Sıfırlandı**\n↳ Tüm lisanslar başarıyla temizlendi kanka.', 
                embeds: [], 
                components: [] 
            });
        }
        if (customId === 'cancel_delete_all' || customId === 'cancel_list_keys') {
            return interaction.update({ content: '❌ İşlem iptal edildi.', embeds: [], components: [] });
        }

        // B. MEVCUT KEYLERİ LİSTELEME (SAYFALAMALI & ENVANTER STİLİ)
        if (customId === 'confirm_list_keys' || customId.startsWith('page_')) {
            let page = customId.startsWith('page_') ? parseInt(customId.split('_')[1]) : 0;
            const allKeys = await KeyModel.find().sort({ createdAt: 1 });
            const pageSize = 5;
            const totalPages = Math.ceil(allKeys.length / pageSize);
            const currentKeys = allKeys.slice(page * pageSize, (page + 1) * pageSize);

            const listEmbed = new EmbedBuilder()
                .setTitle('🇹🇷 TURKEY HUB | SİSTEM YÖNETİMİ')
                .setColor('#FF0000')
                .setFooter({ text: `Sayfa ${page + 1} / ${totalPages} • Toplam ${allKeys.length} Key` });

            if (allKeys.length === 0) {
                listEmbed.setDescription('🔴 **Sistem Durumu**\n↳ Veritabanında kayıtlı key bulunamadı.');
            } else {
                currentKeys.forEach((k, index) => {
                    const globalIdx = (page * pageSize) + index + 1;
                    const status = k.hwid ? '✅ Aktif' : '❌ Beklemede';
                    listEmbed.addFields({
                        name: `🟢 **Lisans Bilgisi #${globalIdx}**`,
                        value: `↳ Anahtar: \`${k.key}\`\n↳ Teknik ID: \`${k.keyId}\`\n↳ Sahibi: <@${k.createdBy}>\n↳ Durum: **${status}**\n↳ Tarih: **${moment(k.createdAt).format('DD/MM/YYYY')}**`,
                        inline: false
                    });
                });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`page_${page - 1}`).setLabel('⬅️').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId(`page_${page + 1}`).setLabel('➡️').setStyle(ButtonStyle.Secondary).setDisabled(page + 1 >= totalPages || allKeys.length === 0)
            );
            return interaction.update({ embeds: [listEmbed], components: [row] });
        }

        // C. KEY ALMA BUTONLARI (TR & EN - ENVANTER STİLİ)
        if (customId === 'get_key_tr' || customId === 'get_key_en') {
            const isEnglish = customId === 'get_key_en';
            const existingKey = await KeyModel.findOne({ createdBy: interaction.user.id });

            if (existingKey) {
                return interaction.reply({ 
                    content: isEnglish ? `❌ **License Alert**\n↳ You already have a key: \`${existingKey.key}\`` : `❌ **Lisans Uyarısı**\n↳ Zaten bir keyin var kanka: \`${existingKey.key}\``, 
                    ephemeral: true 
                });
            }

            // 6 Haneli Teknik ID ve Key Üretimi
            const teknikId = Math.floor(100000 + Math.random() * 900000).toString();
            const lisans = `TURKEY-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

            const newKey = new KeyModel({
                key: lisans,
                keyId: teknikId,
                createdBy: interaction.user.id
            });

            try {
                await newKey.save();

                const dmEmbed = new EmbedBuilder()
                    .setTitle(isEnglish ? '🇺🇸 TURKEY HUB | INVENTORY' : '🇹🇷 TURKEY HUB | ENVANTER')
                    .setColor('#FF0000')
                    .setDescription(
                        isEnglish ? 
                        `🟢 **License Key Granted**\n↳ You have **1** **License Key** in total\n↳ Use it in **Roblox Cheat Panel**\n\n` +
                        `🔑 **Key Details**\n↳ Key: \`${lisans}\`\n↳ Technical ID: \`${teknikId}\`\n\n` +
                        `🔴 **Hwid Reset Ticket**\n↳ You have **0** **Hwid Reset Tickets**\n↳ Visit **#🔑 | keys** channel to reset` 
                        :
                        `🟢 **Lisans Anahtarı Tanımlandı**\n↳ Toplam **1** **Lisans Anahtarı** Sahipsin\n↳ Kullanmak İçin **Roblox Hile Panelini** Açın\n\n` +
                        `🔑 **Key Detayları**\n↳ Anahtar: \`${lisans}\`\n↳ Teknik ID: \`${teknikId}\`\n\n` +
                        `🔴 **Hwid Sıfırlama Bileti**\n↳ Toplam **0** **Hwid Sıfırlama Bileti** Sahipsin\n↳ Kullanmak İçin **#🔑 | keylerim** Kanalını Ziyaret Edin`
                    );

                await interaction.user.send({ embeds: [dmEmbed] });
                return interaction.reply({ 
                    content: isEnglish ? '✅ **Success**\n↳ Key sent to your DMs!' : '✅ **Başarılı**\n↳ Key DM kutuna mermi gibi gönderildi!', 
                    ephemeral: true 
                });
            } catch (err) {
                return interaction.reply({ 
                    content: isEnglish ? '❌ **Error**\n↳ Open your DMs!' : '❌ **Hata**\n↳ DM kutunu aç kanka!', 
                    ephemeral: true 
                });
            }
        }
    },
};