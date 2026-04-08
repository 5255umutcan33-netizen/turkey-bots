const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js');
const KeyModel = require('../models/key');
const Counter = require('../models/counter'); 

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        const OWNER_ID = '345821033414262794'; 
        
        // --- LOG KANALLARI ---
        const LOG_TR = '1491105445564387359';
        const LOG_EN = '1491105631434969218';
        const SUGGEST_LOG_TR = '1491388986923552869'; 
        const SUGGEST_LOG_EN = '1491389032524021790';
        const VERIFY_LOG_ID = '1491473038204469308'; 

        // ==========================================
        // 1. SLASH KOMUTLARI
        // ==========================================
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.execute(interaction); } catch (e) { console.error(e); }
            return;
        }

        // ==========================================
        // 2. FORM GÖNDERME (MODAL SUBMIT)
        // ==========================================
        if (interaction.isModalSubmit()) {
            
            // A. YETKİLİ BAŞVURU FORMU
            if (interaction.customId === 'modal_en' || interaction.customId === 'modal_tr') {
                const isEn = interaction.customId === 'modal_en';
                const logEmbed = new EmbedBuilder()
                    .setTitle(isEn ? '📩 NEW STAFF APPLICATION' : '📩 YENİ YETKİLİ BAŞVURUSU')
                    .setColor('#2B2D31')
                    .addFields(
                        { name: isEn ? 'User:' : 'Kullanıcı:', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                        { name: isEn ? 'Name:' : 'İsim:', value: interaction.fields.getTextInputValue('name'), inline: true },
                        { name: isEn ? 'Age:' : 'Yaş:', value: interaction.fields.getTextInputValue('age'), inline: true },
                        { name: isEn ? 'Active Hours:' : 'Aktiflik Süresi:', value: interaction.fields.getTextInputValue('active'), inline: false },
                        { name: isEn ? 'Command Knowledge:' : 'Komut Bilgisi:', value: interaction.fields.getTextInputValue('cmd'), inline: false },
                        { name: isEn ? 'Reason:' : 'Neden:', value: interaction.fields.getTextInputValue('why'), inline: false }
                    ).setTimestamp();

                const logChannel = client.channels.cache.get(isEn ? LOG_EN : LOG_TR);
                if (logChannel) await logChannel.send({ embeds: [logEmbed] });

                return interaction.reply({ content: isEn ? '`✅ Your application has been submitted!`' : '`✅ Başvurunuz başarıyla iletildi!`', ephemeral: true });
            }

            // B. SCRİPT ÖNERİ FORMU
            if (interaction.customId === 'modal_suggest_tr' || interaction.customId === 'modal_suggest_en') {
                const isEn = interaction.customId === 'modal_suggest_en';
                const suggestEmbed = new EmbedBuilder()
                    .setTitle(isEn ? '💡 NEW SCRIPT SUGGESTION' : '💡 YENİ SCRIPT ÖNERİSİ')
                    .setColor('#FFD700') 
                    .addFields(
                        { name: isEn ? 'User:' : 'Öneren Kullanıcı:', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: false },
                        { name: isEn ? 'Game/Script Name:' : 'Oyun / Script Adı:', value: `> **${interaction.fields.getTextInputValue('suggest_name')}**`, inline: false },
                        { name: isEn ? 'Desired Features:' : 'İstenen Özellikler:', value: `\`\`\`\n${interaction.fields.getTextInputValue('suggest_features')}\n\`\`\``, inline: false }
                    ).setThumbnail(interaction.user.displayAvatarURL({ dynamic: true })).setTimestamp();

                const logChannel = client.channels.cache.get(isEn ? SUGGEST_LOG_EN : SUGGEST_LOG_TR);
                if (logChannel) await logChannel.send({ embeds: [suggestEmbed] });

                return interaction.reply({ content: isEn ? '`✅ Thank you! Suggestion sent.`' : '`✅ Öneriniz iletildi.`', ephemeral: true });
            }
        }

        // ==========================================
        // 3. BUTON ETKİLEŞİMLERİ
        // ==========================================
        if (!interaction.isButton()) return;
        const cid = interaction.customId; 

        // --- A. DOĞRULAMA (VERIFY) VE LOG SİSTEMİ ---
        if (cid === 'verify_tr' || cid === 'verify_en') {
            const isTr = cid === 'verify_tr';
            const ENTRY_ROLE = '1491450686637080737'; 
            const VERIFIED_ROLE = '1491452394087780552'; 
            const TR_ROLE = '1491090280466747685';
            const GB_ROLE = '1491090834165334167';

            try {
                if (interaction.member.roles.cache.has(VERIFIED_ROLE)) {
                    return interaction.reply({ content: isTr ? '❌ Zaten doğrulandın!' : '❌ Already verified!', ephemeral: true });
                }

                await interaction.member.roles.add(VERIFIED_ROLE);
                await interaction.member.roles.add(isTr ? TR_ROLE : GB_ROLE);
                await interaction.member.roles.remove(ENTRY_ROLE).catch(() => {});
                await interaction.channel.permissionOverwrites.create(interaction.user, { ViewChannel: false }).catch(() => {});

                await interaction.reply({ content: isTr ? '`✅ Doğrulandı!`' : '`✅ Verified!`', ephemeral: true });

                const logChannel = client.channels.cache.get(VERIFY_LOG_ID);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('✅ ÜYE DOĞRULANDI / MEMBER VERIFIED')
                        .setColor('#57F287')
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .addFields(
                            { name: 'Kullanıcı / User', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                            { name: 'Seçilen Dil / Language', value: isTr ? '🇹🇷 Türkçe' : '🇬🇧 English', inline: true }
                        ).setTimestamp();
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
                return;
            } catch (err) { return interaction.reply({ content: '`❌ Hata!`', ephemeral: true }); }
        }

        // --- B. SCRIPT ÖNERİ MODALI AÇMA ---
        if (cid === 'suggest_script_tr' || cid === 'suggest_script_en') {
            const isEn = cid === 'suggest_script_en';
            const modal = new ModalBuilder().setCustomId(isEn ? 'modal_suggest_en' : 'modal_suggest_tr').setTitle(isEn ? 'Script Suggestion Form' : 'Script Öneri Formu');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('suggest_name').setLabel(isEn ? 'Game Name' : 'Oyun Adı').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('suggest_features').setLabel(isEn ? 'Features' : 'İstediğiniz Özellikler').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return interaction.showModal(modal);
        }

        // --- C. KEY ÜRETME SİSTEMİ ---
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            const isTR = cid === 'get_key_tr';
            await interaction.deferReply({ ephemeral: true }); 
            try {
                let userKey = await KeyModel.findOne({ owner: interaction.user.id });
                if (userKey) {
                    return interaction.editReply({ content: isTR ? `❌ Zaten kayıtlı keyin var:\n🔑 \`${userKey.key}\`` : `❌ You already have a key:\n🔑 \`${userKey.key}\`` });
                }

                const newKeyString = `RYP-USER-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
                const licenseId = Math.floor(10000 + Math.random() * 90000); 

                await new KeyModel({ key: newKeyString, expiry: 'Sınırsız', hwid: null, owner: interaction.user.id }).save();

                const dmEmbed = new EmbedBuilder()
                    .setTitle(isTR ? '💎 RYPHERA OS | LİSANS' : '💎 RYPHERA OS | LICENSE')
                    .setColor('#5865F2')
                    .addFields(
                        { name: '🆔 ID', value: `#${licenseId}`, inline: true },
                        { name: '🔑 Key', value: `\`\`\`\n${newKeyString}\n\`\`\``, inline: false }
                    ).setTimestamp();

                let dmSuccess = true;
                await interaction.user.send({ embeds: [dmEmbed] }).catch(() => { dmSuccess = false; });

                if (dmSuccess) {
                    return interaction.editReply({ content: isTR ? `✅ Keyin **Özel Mesaj (DM)** kutuna gönderildi.` : `✅ Key sent to your **DM**.` });
                } else {
                    return interaction.editReply({ content: isTR ? `⚠️ DM Kutun Kapalı! Anahtarın:\n🔑 \`${newKeyString}\`` : `⚠️ DMs closed! Your key:\n🔑 \`${newKeyString}\`` });
                }
            } catch (err) { return interaction.editReply({ content: '❌ Hata oluştu.' }); }
        }

        // --- D. BAŞVURU ONAY/RED ---
        if (cid.startsWith('app_onay_') || cid.startsWith('app_red_')) {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '`⚠️ Yetkiniz yok!`', ephemeral: true });
            const action = cid.startsWith('app_onay_') ? 'onay' : 'red';
            const targetId = cid.split('_')[2]; 
            try {
                const targetUser = await client.users.fetch(targetId);
                const dmEmbed = new EmbedBuilder().setTitle('Ryphera OS | Başvuru Sonucu').setTimestamp();
                if (action === 'onay') dmEmbed.setColor('#00FF00').setDescription('🎉 Başvurunuz **ONAYLANDI**.');
                else dmEmbed.setColor('#FF0000').setDescription('❌ Başvurunuz **REDDEDİLMİŞTİR**.');
                
                await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
                const statusText = action === 'onay' ? '✅ **KABUL EDİLDİ**' : '❌ **REDDEDİLDİ**';
                
                return interaction.update({ content: `> **DURUM:** ${statusText} \n> **Yapan:** <@${interaction.user.id}>`, embeds: [interaction.message.embeds[0]], components: [] });
            } catch (err) { return interaction.reply({ content: '`❌ Hata!`', ephemeral: true }); }
        }

        // --- E. TİCKET SİSTEMİ ---
        if (cid.startsWith('close_ticket')) {
            await interaction.reply('`Kapatılıyor... 📩`');
            return setTimeout(() => interaction.channel.delete().catch(() => {}), 2500);
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
            if (interaction.guild.channels.cache.find(c => c.topic === interaction.user.id)) return interaction.editReply({ content: isEn ? '`Ticket exists!`' : '`Zaten biletin var!`' });
            
            try {
                let counter = await Counter.findOneAndUpdate({ id: 'ticket' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
                const ticketChannel = await interaction.guild.channels.create({
                    name: `${isEn ? 'support' : 'destek'}-${interaction.user.username}-${counter.seq}`,
                    type: ChannelType.GuildText,
                    topic: interaction.user.id,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                    ]
                });
                const embed = new EmbedBuilder().setTitle('💬 RYPHERA OS').setColor('#2B2D31').setDescription(isEn ? '👋 Welcome!' : '👋 Merhaba!');
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(isEn ? 'claim_ticket_en' : 'claim_ticket_tr').setLabel(isEn ? 'Claim' : 'Sahiplen').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(isEn ? 'close_ticket_en' : 'close_ticket_tr').setLabel(isEn ? 'Close' : 'Kapat').setStyle(ButtonStyle.Danger)
                );
                await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
                return interaction.editReply({ content: `✅ <#${ticketChannel.id}>` });
            } catch (err) { return interaction.editReply({ content: `❌ Hata!` }); }
        }

        // --- F. KOPYALA BUTONU ---
        if (cid === 'mobil_kopyala_btn') {
            const embed = interaction.message.embeds[0];
            const scriptField = embed.fields[1];
            if (!scriptField) return interaction.reply({ content: '`Kod yok!`', ephemeral: true });
            let cleanCode = scriptField.value.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            return interaction.reply({ content: `💬 **Kod:**\n${cleanCode}`, ephemeral: true });
        }

        // --- G. ADMIN KEY SİSTEMİ (LİSTELEME VE SİLME BUTONLARI) ---
        if (cid === 'cancel_delete_all' || cid === 'cancel_list_keys') {
            return interaction.update({ content: '`❌ İşlem iptal edildi.`', embeds: [], components: [] });
        }

        if (cid === 'confirm_delete_all') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return;
            try {
                await KeyModel.deleteMany({}); 
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

        if (cid === 'confirm_list_keys') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return;
            try {
                const keys = await KeyModel.find(); 
                if (!keys || keys.length === 0) {
                    return interaction.update({ 
                        content: '`⚠️ Veritabanında kayıtlı hiçbir lisans anahtarı bulunamadı.`', 
                        embeds: [], 
                        components: [] 
                    });
                }

                let desc = keys.map(k => {
                    let hwidStatus = k.hwid ? `[DOLU: \`${k.hwid}\`]` : '[BOŞ]';
                    return `🔑 \`${k.key}\` - ${hwidStatus}`;
                }).join('\n');

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

    }
};