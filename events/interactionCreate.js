const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const KeyModel = require('../models/key');
const Counter = require('../models/counter'); 

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const OWNER_ID = '345821033414262794'; 
        const LOG_TR = '1491105445564387359';
        const LOG_EN = '1491105631434969218';

        // --- SLASH KOMUTLARI ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.execute(interaction); } catch (e) { console.error(e); }
            return;
        }

        // --- FORM GÖNDERME (MODAL SUBMIT) ---
        if (interaction.isModalSubmit()) {
            const isEn = interaction.customId === 'modal_en';
            
            const name = interaction.fields.getTextInputValue('name');
            const age = interaction.fields.getTextInputValue('age');
            const active = interaction.fields.getTextInputValue('active');
            const cmd = interaction.fields.getTextInputValue('cmd');
            const why = interaction.fields.getTextInputValue('why');

            const logEmbed = new EmbedBuilder()
                .setTitle(isEn ? '📩 NEW STAFF APPLICATION' : '📩 YENİ YETKİLİ BAŞVURUSU')
                .setColor('#2B2D31')
                .addFields(
                    { name: isEn ? 'User:' : 'Kullanıcı:', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                    { name: isEn ? 'Name:' : 'İsim:', value: name, inline: true },
                    { name: isEn ? 'Age:' : 'Yaş:', value: age, inline: true },
                    { name: isEn ? 'Active Hours:' : 'Aktiflik Süresi:', value: active, inline: false },
                    { name: isEn ? 'Command Knowledge:' : 'Komut Bilgisi:', value: cmd, inline: false },
                    { name: isEn ? 'Reason:' : 'Neden Yetkili Olmak İstiyor:', value: why, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Ryphera OS Staff Application' });

            const logChannel = client.channels.cache.get(isEn ? LOG_EN : LOG_TR);
            if (logChannel) await logChannel.send({ embeds: [logEmbed] });

            return interaction.reply({ 
                content: isEn ? '`✅ Your application has been submitted!`' : '`✅ Başvurunuz başarıyla iletildi!`', 
                ephemeral: true 
            });
        }

        if (!interaction.isButton()) return;
        
        // --- BAŞVURU ONAY/RED BUTONLARI ---
        if (interaction.customId.startsWith('app_onay_') || interaction.customId.startsWith('app_red_')) {
            // Sadece senin ID'n basabilir (Güvenlik)
            if (interaction.user.id !== '345821033414262794') {
                return interaction.reply({ content: '`⚠️ Bu işlemi sadece Kurucu yapabilir!`', ephemeral: true });
            }

            const action = interaction.customId.startsWith('app_onay_') ? 'onay' : 'red';
            const targetId = interaction.customId.split('_')[2]; // ID'yi butondan çektik

            try {
                const targetUser = await client.users.fetch(targetId);
                
                // DM Mesajı Tasarımı
                const dmEmbed = new EmbedBuilder()
                    .setTitle('Ryphera OS | Başvuru Sonucu')
                    .setTimestamp();

                if (action === 'onay') {
                    dmEmbed.setColor('#00FF00').setDescription('🎉 **Tebrikler!** Ryphera OS yetkili başvurunuz başarıyla **ONAYLANDI**. Lütfen kurucularla iletişime geçin.');
                } else {
                    dmEmbed.setColor('#FF0000').setDescription('❌ **Üzgünüz,** Ryphera OS yetkili başvurunuz maalesef **REDDEDİLMİŞTİR**.');
                }

                // Kullanıcıya DM Şutla (Adamın DM'si kapalıysa catch ile hatayı yutar, bot çökmez)
                await targetUser.send({ embeds: [dmEmbed] }).catch(() => console.log('DM atılamadı, adamın özeli kapalı.'));

                // Log Kanalındaki Mesajı Güncelle (Butonları kaldır ki bir daha basılamasın)
                const statusText = action === 'onay' ? '✅ **KABUL EDİLDİ**' : '❌ **REDDEDİLDİ**';
                const originalEmbed = interaction.message.embeds[0];

                await interaction.update({
                    content: `> **DURUM:** ${statusText} \n> **İşlemi Yapan:** <@${interaction.user.id}>`,
                    embeds: [originalEmbed],
                    components: [] // Butonları sildik
                });
                return;

            } catch (err) {
                console.error(err);
                return interaction.reply({ content: '`❌ Hata: Kullanıcı bulunamadı veya işlem başarısız.`', ephemeral: true });
            }
        }
        
        const cid = interaction.customId;

        // ===============================================
        // YENİ EKLENEN: KEY SİSTEMİ BUTONLARI (DB BAĞLANTILI)
        // ===============================================

        // İptal Butonları (Hem listeleme hem silme için ortak)
        if (cid === 'cancel_delete_all' || cid === 'cancel_list_keys') {
            return interaction.update({ content: '`❌ İşlem iptal edildi.`', embeds: [], components: [] });
        }

        // Tüm Keyleri Sil Onayı
        if (cid === 'confirm_delete_all') {
            try {
                await KeyModel.deleteMany({}); // Veritabanını tamamen temizler
                return interaction.update({ 
                    content: '`✅ ONAYLANDI:` **Tüm lisans anahtarları sistemden ve veritabanından kalıcı olarak silindi!**', 
                    components: [], 
                    embeds: [] 
                });
            } catch (err) {
                console.error(err);
                return interaction.reply({ content: '`❌ Veritabanı silinirken bir hata oluştu.`', ephemeral: true });
            }
        }

        // Mevcut Keyleri Listele Onayı
        if (cid === 'confirm_list_keys') {
            try {
                const keys = await KeyModel.find(); // DB'den tüm keyleri çeker
                
                if (!keys || keys.length === 0) {
                    return interaction.update({ 
                        content: '`⚠️ Veritabanında kayıtlı hiçbir lisans anahtarı bulunamadı.`', 
                        embeds: [], 
                        components: [] 
                    });
                }

                // HWID doluluk durumuna göre listeyi fiyakalı hale getirelim
                let desc = keys.map(k => {
                    let hwidStatus = k.hwid ? `[DOLU: \`${k.hwid}\`]` : '[BOŞ]';
                    return `🔑 \`${k.key}\` - ${hwidStatus}`;
                }).join('\n');

                // Eğer çok fazla key varsa Discord'un limitini (4096 karakter) aşmasın diye kesiyoruz
                if (desc.length > 4000) {
                    desc = desc.substring(0, 4000) + '\n... *(Çok fazla kayıt var, devamı kesildi)*';
                }

                const listEmbed = new EmbedBuilder()
                    .setTitle('RYPHERA | AKTİF LİSANSLAR')
                    .setColor('#00FF00')
                    .setDescription(desc)
                    .setTimestamp();

                return interaction.update({ 
                    content: '`✅ Veritabanı başarıyla çekildi.`', 
                    embeds: [listEmbed], 
                    components: [] 
                });
            } catch (err) {
                console.error(err);
                return interaction.reply({ content: '`❌ Veritabanı okunduğunda bir hata oluştu.`', ephemeral: true });
            }
        }

        // ===============================================

        // --- BAŞVURU BUTONU (MODAL AÇMA) ---
        if (cid === 'apply_tr' || cid === 'apply_en') {
            const isEn = cid === 'apply_en';
            const modal = new ModalBuilder()
                .setCustomId(isEn ? 'modal_en' : 'modal_tr')
                .setTitle(isEn ? 'Staff Application' : 'Yetkili Başvuru Formu');

            const nameInput = new TextInputBuilder().setCustomId('name').setLabel(isEn ? 'Your Name' : 'İsminiz nedir?').setStyle(TextInputStyle.Short).setRequired(true);
            const ageInput = new TextInputBuilder().setCustomId('age').setLabel(isEn ? 'Your Age' : 'Kaç yaşındasınız?').setStyle(TextInputStyle.Short).setRequired(true);
            const activeInput = new TextInputBuilder().setCustomId('active').setLabel(isEn ? 'Active Hours' : 'Kaç saat aktifsiniz?').setStyle(TextInputStyle.Short).setRequired(true);
            const cmdInput = new TextInputBuilder().setCustomId('cmd').setLabel(isEn ? 'Command Knowledge' : 'Komut kullanmayı biliyor musunuz?').setStyle(TextInputStyle.Paragraph).setRequired(true);
            const whyInput = new TextInputBuilder().setCustomId('why').setLabel(isEn ? 'Why do you want to be staff?' : 'Neden yetkili olmak istiyorsunuz?').setStyle(TextInputStyle.Paragraph).setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(ageInput),
                new ActionRowBuilder().addComponents(activeInput),
                new ActionRowBuilder().addComponents(cmdInput),
                new ActionRowBuilder().addComponents(whyInput)
            );

            await interaction.showModal(modal);
            return;
        }

        // --- DİĞER BUTONLAR (DOĞRULAMA, TICKET VB.) ---
        if (cid === 'verify_tr' || cid === 'verify_en') {
            const TR_ROLE = '1491090280466747685';
            const GB_ROLE = '1491090834165334167';
            const isTr = cid === 'verify_tr';
            try {
                await interaction.member.roles.add(isTr ? TR_ROLE : GB_ROLE);
                await interaction.channel.permissionOverwrites.create(interaction.user, { ViewChannel: false }).catch(() => {});
                return interaction.reply({ content: isTr ? '`✅ Doğrulandı!`' : '`✅ Verified!`', ephemeral: true });
            } catch (err) { return interaction.reply({ content: '`❌ Hata!`', ephemeral: true }); }
        }

        if (cid.startsWith('close_ticket')) {
            await interaction.reply('`Kapatılıyor... 📩`');
            setTimeout(() => { interaction.channel.delete().catch(() => {}); }, 2500);
            return;
        }

        if (cid.startsWith('claim_ticket')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) return interaction.reply({ content: '`⚠️ Yetkin yok!`', ephemeral: true });
            const row = ActionRowBuilder.from(interaction.message.components[0]);
            row.components[0].setDisabled(true).setLabel(`OK: ${interaction.user.username}`);
            await interaction.update({ components: [row] });
            return interaction.channel.send({ content: `💬 **<@${interaction.user.id}> biletle ilgileniyor.**` });
        }

        const ticketIds = ['ticket_tr_support', 'ticket_tr_partner', 'ticket_tr_key', 'ticket_en_support', 'ticket_en_partner', 'ticket_en_key'];
        if (ticketIds.includes(cid)) {
            await interaction.deferReply({ ephemeral: true });
            const isEn = cid.startsWith('ticket_en_');
            const existing = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id);
            if (existing) return interaction.editReply({ content: isEn ? '`You already have a ticket!`' : '`Zaten bir biletiniz var!`' });
            try {
                let counter = await Counter.findOneAndUpdate({ id: 'ticket' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
                const ticketNo = counter.seq;
                let type = isEn ? 'support' : 'destek';
                const ticketChannel = await interaction.guild.channels.create({
                    name: `${type}-${interaction.user.username}-${ticketNo}`,
                    type: ChannelType.GuildText,
                    topic: interaction.user.id,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                    ]
                });
                const embed = new EmbedBuilder().setTitle('💬 RYPHERA OS').setColor('#2B2D31').setDescription(isEn ? '👋 Welcome!' : '👋 Merhaba!').setFooter({ text: `Bilet #${ticketNo}` });
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(isEn ? 'claim_ticket_en' : 'claim_ticket_tr').setLabel(isEn ? 'Claim' : 'Sahiplen').setEmoji('💬').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(isEn ? 'close_ticket_en' : 'close_ticket_tr').setLabel(isEn ? 'Close' : 'Kapat').setEmoji('📩').setStyle(ButtonStyle.Danger)
                );
                await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
                return interaction.editReply({ content: `✅ <#${ticketChannel.id}>` });
            } catch (err) { return interaction.editReply({ content: `❌ Hata: ${err.message}` }); }
        }

        if (cid === 'mobil_kopyala_btn') {
            const embed = interaction.message.embeds[0];
            const scriptField = embed.fields[1];
            if (!scriptField) return interaction.reply({ content: '`Kod yok!`', ephemeral: true });
            let cleanCode = scriptField.value.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            return interaction.reply({ content: `💬 **Kod:**\n${cleanCode}`, ephemeral: true });
        }
    }
};