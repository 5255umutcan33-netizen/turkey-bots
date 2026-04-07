const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KeyModel = require('../models/key');
const Tesseract = require('tesseract.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // --- AYARLAR (ID'LER) ---
        const ROLE_ID = '1490996828974612530'; // Abone Rolü
        const LOG_CHANNEL_ID = '1490998881553743932'; // Log Kanalı
        const OWNER_ID = 'SENIN_ID_BURAYA'; // Kendi Discord ID'ni yaz kanka

        // --- 1. SLASH KOMUTLARINI ÇALIŞTIR ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            // ABONE SS KONTROL MANTIĞI (/aboneat & /subproof)
            if (interaction.commandName === 'aboneat' || interaction.commandName === 'subproof') {
                const isEn = interaction.commandName === 'subproof';
                const ss = interaction.options.getAttachment('ss');
                const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

                await interaction.deferReply({ ephemeral: true });

                try {
                    // OCR Taraması (Resimdeki yazıları oku)
                    const { data: { text } } = await Tesseract.recognize(ss.url, 'eng+tur');
                    const lowerText = text.toLowerCase();
                    
                    // Kontrol: Ryphera ismi geçiyor mu?
                    const isSubbed = lowerText.includes('ryphera scr1pt') || lowerText.includes('@rypherascr1pt');

                    if (isSubbed) {
                        await interaction.member.roles.add(ROLE_ID);
                        await interaction.editReply({ content: isEn ? '`VERIFIED: Welcome to Ryphera!`' : '`ONAYLANDI: Ryphera ailesine hoş geldin!`' });

                        const logEmbed = new EmbedBuilder()
                            .setTitle('✅ ABONE ONAYLANDI')
                            .setColor('#00FF00')
                            .addFields(
                                { name: 'Kullanıcı', value: `<@${interaction.user.id}> (\`${interaction.user.id}\`)` },
                                { name: 'Durum', value: '`BAŞARILI`' }
                            )
                            .setImage(ss.url).setTimestamp();
                        logChannel.send({ embeds: [logEmbed] });
                    } else {
                        await interaction.editReply({ 
                            content: isEn ? '`REJECTED: Channel name not found. Make sure "Ryphera Scr1pt" is visible.`' : '`REDDEDİLDİ: "Ryphera Scr1pt" ismi bulunamadı. Lütfen SS\'in net olduğundan emin olun.`' 
                        });

                        const logFailEmbed = new EmbedBuilder()
                            .setTitle('❌ ONAY REDDEDİLDİ')
                            .setColor('#FF0000')
                            .addFields({ name: 'Kullanıcı', value: `<@${interaction.user.id}>` }, { name: 'Hata', value: '`Kanal ismi saptanamadı.`' })
                            .setImage(ss.url).setTimestamp();
                        logChannel.send({ embeds: [logFailEmbed] });
                    }
                } catch (err) {
                    await interaction.editReply({ content: '`HATA: Resim işlenemedi.`' });
                }
                return;
            }

            try { await command.execute(interaction); } catch (e) { console.error(e); }
        }

        // --- 2. BUTON ETKİLEŞİMLERİ ---
        if (!interaction.isButton()) return;
        const cid = interaction.customId;

        // A. KEY ALMA BUTONLARI (TR/EN)
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            const isEn = cid === 'get_key_en';
            const existing = await KeyModel.findOne({ createdBy: interaction.user.id });

            if (existing) {
                return interaction.reply({ content: isEn ? `\`System: Your key is ${existing.key}\`` : `\`Sistem: Mevcut keyin ${existing.key}\``, ephemeral: true });
            }

            const teknikId = Math.floor(100000 + Math.random() * 900000).toString();
            const rypKey = `RYP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

            const newEntry = new KeyModel({ key: rypKey, keyId: teknikId, createdBy: interaction.user.id });

            try {
                await newEntry.save();
                const dmEmbed = new EmbedBuilder()
                    .setTitle('RYPHERA | LICENSE')
                    .setColor('#FF0000')
                    .setDescription(isEn ? `Key: \`${rypKey}\`\nID: \`${teknikId}\`\nStatus: \`LIFETIME\`` : `Anahtar: \`${rypKey}\`\nID: \`${teknikId}\`\nSüre: \`SINIRSIZ\``);

                await interaction.user.send({ embeds: [dmEmbed] });
                return interaction.reply({ content: isEn ? '`SUCCESS: Key sent to DMs.`' : '`BAŞARILI: Anahtar DM kutuna atıldı.`', ephemeral: true });
            } catch (err) {
                return interaction.reply({ content: '`HATA: DM kutun kapalı!`', ephemeral: true });
            }
        }

        // B. ABONE SS BUTONLARI (YÖNLENDİRME)
        if (cid === 'abone_onay_tr') return interaction.reply({ content: '`Lütfen /aboneat komutunu kullanarak SS yükleyin.`', ephemeral: true });
        if (cid === 'abone_onay_en') return interaction.reply({ content: '`Please use /subproof command to upload your SS.`', ephemeral: true });

        // C. VERİTABANI LİSTELEME (SAYFALAMA)
        if (cid === 'confirm_list_keys' || cid.startsWith('page_')) {
            let page = cid.startsWith('page_') ? parseInt(cid.split('_')[1]) : 0;
            const allKeys = await KeyModel.find().sort({ createdAt: 1 });
            const pageSize = 5;
            const pages = Math.ceil(allKeys.length / pageSize);
            const current = allKeys.slice(page * pageSize, (page + 1) * pageSize);

            const listEmbed = new EmbedBuilder().setTitle('RYPHERA | DATABASE').setColor('#FF0000');
            if (allKeys.length === 0) listEmbed.setDescription('`Sistem: Kayıtlı anahtar yok.`');
            else {
                current.forEach((k, i) => {
                    listEmbed.addFields({ name: `Kayıt #${(page * pageSize) + i + 1}`, value: `Key: \`${k.key}\` | ID: \`${k.keyId}\` | Sahibi: <@${k.createdBy}>` });
                });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`page_${page - 1}`).setLabel('Geri').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId(`page_${page + 1}`).setLabel('İleri').setStyle(ButtonStyle.Secondary).setDisabled(page + 1 >= pages || allKeys.length === 0)
            );
            return interaction.update({ embeds: [listEmbed], components: [row] });
        }

        // D. TÜMÜNÜ SİLME ONAYI
        if (cid === 'confirm_delete_all') {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '`YETKİ: Erişim reddedildi.`', ephemeral: true });
            await KeyModel.deleteMany({});
            return interaction.update({ content: '`SİSTEM: Tüm veritabanı temizlendi.`', embeds: [], components: [] });
        }

        // E. İPTAL BUTONU
        if (cid === 'cancel_delete_all' || cid === 'cancel_list_keys') {
            return interaction.update({ content: '`İŞLEM: İptal edildi.`', embeds: [], components: [] });
        }
    },
};