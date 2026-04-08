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
        const VERIFY_LOG_ID = '1491473038204469308'; // Kayıt ve Key Logları

        // ==========================================
        // 1. SLASH KOMUTLARI MOTORU
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

        // --- A. DOĞRULAMA (VERIFY) SİSTEMİ ---
        if (cid === 'verify_tr' || cid === 'verify_en') {
            const isTr = cid === 'verify_tr';
            const ENTRY_ROLE = '1491450686637080737'; 
            const VERIFIED_ROLE = '1491452394087780552'; 
            const TR_ROLE = '1491090280466747685';
            const GB_ROLE = '1491090834165334167';

            try {
                if (interaction.member.roles.cache.has(VERIFIED_ROLE)) return interaction.reply({ content: isTr ? '❌ Zaten doğrulandın!' : '❌ Already verified!', ephemeral: true });

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
                            { name: 'Kullanıcı / User', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Dil / Language', value: isTr ? '🇹🇷 Türkçe' : '🇬🇧 English', inline: true }
                        ).setTimestamp();
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
                return;
            } catch (err) { return interaction.reply({ content: '`❌ Hata!`', ephemeral: true }); }
        }

        // --- B. SCRIPT ÖNERİ MODALI ---
        if (cid === 'suggest_script_tr' || cid === 'suggest_script_en') {
            const isEn = cid === 'suggest_script_en';
            const modal = new ModalBuilder().setCustomId(isEn ? 'modal_suggest_en' : 'modal_suggest_tr').setTitle(isEn ? 'Script Suggestion' : 'Script Öneri');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('suggest_name').setLabel('Oyun Adı').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('suggest_features').setLabel('İstediğiniz Özellikler').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return interaction.showModal(modal);
        }

        // --- C. 💎 KEY ÜRETME SİSTEMİ (PREMIUM FORMAT & MOBİL KOPYALAMA) ---
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            const isTR = cid === 'get_key_tr';
            await interaction.deferReply({ ephemeral: true }); 
            try {
                let userKey = await KeyModel.findOne({ owner: interaction.user.id });
                if (userKey) {
                    return interaction.editReply({ content: isTR ? `❌ Zaten kayıtlı bir keyin var!\n🔑 **Key:** \`${userKey.key}\`` : `❌ You already have a key!\n🔑 **Key:** \`${userKey.key}\`` });
                }

                // 5 Haneli ID ve Key Hazırlığı
                const newKeyString = `RYP-USER-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
                const licenseId = Math.floor(10000 + Math.random() * 90000).toString(); 
                const timestamp = `<t:${Math.floor(Date.now() / 1000)}:F>`;

                const newKeyDoc = new KeyModel({ key: newKeyString, expiry: 'Sınırsız', hwid: null, owner: interaction.user.id, licenseId: licenseId });
                await newKeyDoc.save();

                // 💎 GÖRSELDEKİ FORMAT (ABONE KEY OLUŞTURULDU)
                const premiumEmbed = new EmbedBuilder()
                    .setTitle('Abone Key Oluşturuldu')
                    .setColor('#2B2D31')
                    .setDescription(
                        `🖇️ **Abone Key -->** \`${newKeyString}\`\n` +
                        `🆔 **Abone Key ID -->** \`${licenseId}\`\n` +
                        `🎭 **Abone Key'i Oluşturan Kişi -->** <@${client.user.id}>\n` +
                        `👑 **Abone Key Sahibi -->** <@${interaction.user.id}>\n` +
                        `📝 **Abone Key'in Oluşturulma Sebebi -->** Abone Key\n` +
                        `📅 **Abone Key'in Oluşturulma Zamanı -->** ${timestamp}\n` +
                        `⌛ **Abone Key'in Bitiş Zamanı -->** \`Sınırsız\`\n\n` +
                        `⚠️ **Dikkat!! KEY TEK KULLANIMLIKTIR KİMSE İLE PAYLAŞMAYIN**`
                    )
                    .setTimestamp();

                let dmSuccess = true;
                // Mobiller kopyalayabilsin diye altına yalın mesaj atıyoruz
                await interaction.user.send({ embeds: [premiumEmbed] })
                    .then(() => interaction.user.send({ content: `${newKeyString}` }))
                    .catch(() => { dmSuccess = false; });

                // Log Kanalına Bildir
                const logChan = client.channels.cache.get(VERIFY_LOG_ID);
                if (logChan) logChan.send({ embeds: [premiumEmbed] }).catch(()=>{});

                if (dmSuccess) {
                    return interaction.editReply({ content: isTR ? `✅ Keyin oluşturuldu ve **DM** kutuna gönderildi.` : `✅ Key created and sent to your **DM**.` });
                } else {
                    return interaction.editReply({ content: isTR ? `⚠️ DM Kapalı! Anahtarın: \`${newKeyString}\`\n🆔 ID: #${licenseId}` : `⚠️ DMs closed! Key: \`${newKeyString}\`` });
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

        // --- G. ADMIN KEY SİSTEMİ (SAYFALAMA & 5 HANELİ ID) ---
        if (cid === 'cancel_delete_all' || cid === 'cancel_list_keys') {
            return interaction.update({ content: '`❌ İşlem iptal edildi.`', embeds: [], components: [] });
        }

        if (cid === 'confirm_delete_all') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return;
            try {
                await KeyModel.deleteMany({}); 
                return interaction.update({ content: '`✅ ONAYLANDI:` **Tüm lisans anahtarları sistemden kalıcı olarak silindi!**', components: [], embeds: [] });
            } catch (err) { return interaction.reply({ content: '`❌ Hata!`', ephemeral: true }); }
        }

        if (cid === 'confirm_list_keys') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return;
            try {
                const keys = await KeyModel.find(); 
                if (!keys || keys.length === 0) return interaction.update({ content: '`⚠️ Kayıtlı lisans bulunamadı.`', embeds: [], components: [] });

                const pageSize = 10;
                const embeds = [];
                for (let i = 0; i < keys.length; i += pageSize) {
                    const currentKeys = keys.slice(i, i + pageSize);
                    const desc = currentKeys.map(k => {
                        let hwidStatus = k.hwid ? `DOLU: \`${k.hwid}\`` : 'BOŞ';
                        let gosterilenID = k.licenseId ? `#${k.licenseId}` : 'ID Yok'; 
                        return `🆔 **ID:** \`${gosterilenID}\`\n🔑 **Key:** \`${k.key}\`\n💻 **HWID:** ${hwidStatus}\n👤 **Sahibi:** <@${k.owner}>`;
                    }).join('\n\n');

                    embeds.push(new EmbedBuilder().setTitle(`RYPHERA | AKTİF LİSANSLAR (Sayfa ${Math.floor(i/pageSize)+1})`).setColor('#00FF00').setDescription(desc));
                }

                return interaction.update({ content: `✅ **${keys.length}** adet lisans bulundu.`, embeds: embeds.slice(0, 10), components: [] });
            } catch (err) { return interaction.reply({ content: '`❌ Hata oluştu.`', ephemeral: true }); }
        }
    }
};