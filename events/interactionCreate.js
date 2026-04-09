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
        const VERIFY_LOG_ID = '1491555788945227967';

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
                    .setTitle(isEn ? '📩 New Staff Application' : '📩 Yeni Yetkili Başvurusu')
                    .setColor('#2B2D31')
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(
                        `👤 **${isEn ? 'Applicant' : 'Başvuran'} -->** <@${interaction.user.id}> (\`${interaction.user.tag}\`)\n` +
                        `🆔 **ID -->** \`${interaction.user.id}\`\n` +
                        `👤 **${isEn ? 'Name' : 'İsim'} -->** \`${interaction.fields.getTextInputValue('name')}\`\n` +
                        `🎂 **${isEn ? 'Age' : 'Yaş'} -->** \`${interaction.fields.getTextInputValue('age')}\`\n` +
                        `⏳ **${isEn ? 'Activity' : 'Aktiflik'} -->** \`${interaction.fields.getTextInputValue('active')}\`\n` +
                        `⚙️ **${isEn ? 'Knowledge' : 'Bilgi'} -->** \`${interaction.fields.getTextInputValue('cmd')}\`\n` +
                        `📝 **${isEn ? 'Note' : 'Açıklama'} -->** \`${interaction.fields.getTextInputValue('why')}\``
                    )
                    .setFooter({ text: 'Ryphera OS Staff System' })
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`app_onay_${interaction.user.id}`).setLabel(isEn ? 'Approve' : 'Onayla').setStyle(ButtonStyle.Success).setEmoji('✅'),
                    new ButtonBuilder().setCustomId(`app_red_${interaction.user.id}`).setLabel(isEn ? 'Reject' : 'Reddet').setStyle(ButtonStyle.Danger).setEmoji('❌')
                );

                const logChannel = client.channels.cache.get(isEn ? LOG_EN : LOG_TR);
                if (logChannel) await logChannel.send({ embeds: [logEmbed], components: [row] });

                return interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor('#57F287').setDescription(isEn ? '✅ **Your application has been submitted!**' : '✅ **Başvurunuz yönetime başarıyla iletildi!**')], 
                    ephemeral: true 
                });
            }

            // B. SCRİPT ÖNERİ FORMU
            if (interaction.customId === 'modal_suggest_tr' || interaction.customId === 'modal_suggest_en') {
                const isEn = interaction.customId === 'modal_suggest_en';
                const suggestEmbed = new EmbedBuilder()
                    .setTitle(isEn ? '💡 New Script Suggestion' : '💡 Yeni Script Önerisi')
                    .setColor('#FEE75C') 
                    .setDescription(
                        `👤 **${isEn ? 'Sender' : 'Gönderen'} -->** <@${interaction.user.id}>\n` +
                        `🎮 **${isEn ? 'Game/Script' : 'Oyun/Script'} -->** \`${interaction.fields.getTextInputValue('suggest_name')}\`\n` +
                        `📝 **${isEn ? 'Features' : 'Özellikler'} -->**\n\`\`\`\n${interaction.fields.getTextInputValue('suggest_features')}\n\`\`\``
                    )
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: 'Ryphera OS Suggestions' })
                    .setTimestamp();

                const logChannel = client.channels.cache.get(isEn ? SUGGEST_LOG_EN : SUGGEST_LOG_TR);
                if (logChannel) await logChannel.send({ embeds: [suggestEmbed] });

                return interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor('#57F287').setDescription(isEn ? '✅ **Suggestion sent!**' : '✅ **Öneriniz iletildi, teşekkür ederiz.**')], 
                    ephemeral: true 
                });
            }
        }

        // ==========================================
        // 3. BUTON ETKİLEŞİMLERİ
        // ==========================================
        if (!interaction.isButton()) return;
        const cid = interaction.customId; 

        // --- YETKİLİ BAŞVURU FORMLARINI AÇMA ---
        if (cid === 'apply_tr') {
            const modal = new ModalBuilder()
                .setCustomId('modal_tr') 
                .setTitle('Yetkili Başvurusu');

            const nameInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('name').setLabel('İsim ve Soyisminiz?').setStyle(TextInputStyle.Short).setRequired(true)
            );
            const ageInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('age').setLabel('Yaşınız?').setStyle(TextInputStyle.Short).setRequired(true)
            );
            const activeInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('active').setLabel('Günlük Aktifliğiniz?').setStyle(TextInputStyle.Short).setRequired(true)
            );
            const cmdInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('cmd').setLabel('Bot/Komut Bilginiz?').setStyle(TextInputStyle.Paragraph).setRequired(true)
            );
            const whyInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('why').setLabel('Ek Açıklama / Neden Biz?').setStyle(TextInputStyle.Paragraph).setRequired(true)
            );

            modal.addComponents(nameInput, ageInput, activeInput, cmdInput, whyInput);
            return await interaction.showModal(modal);
        }

        if (cid === 'apply_en') {
            const modal = new ModalBuilder()
                .setCustomId('modal_en') 
                .setTitle('Staff Application');

            const nameInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('name').setLabel('Full Name?').setStyle(TextInputStyle.Short).setRequired(true)
            );
            const ageInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('age').setLabel('Age?').setStyle(TextInputStyle.Short).setRequired(true)
            );
            const activeInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('active').setLabel('Daily Activity?').setStyle(TextInputStyle.Short).setRequired(true)
            );
            const cmdInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('cmd').setLabel('Bot/Command Knowledge?').setStyle(TextInputStyle.Paragraph).setRequired(true)
            );
            const whyInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('why').setLabel('Additional Info / Why Us?').setStyle(TextInputStyle.Paragraph).setRequired(true)
            );

            modal.addComponents(nameInput, ageInput, activeInput, cmdInput, whyInput);
            return await interaction.showModal(modal);
        }

        // --- A. DOĞRULAMA (VERIFY) SİSTEMİ ---
        if (cid === 'verify_tr' || cid === 'verify_en') {
            const isTr = cid === 'verify_tr';
            const ENTRY_ROLE = '1491450686637080737'; // Kayıtsız Rolü
            const VERIFIED_ROLE = '1491452394087780552'; // Doğrulanmış Üye
            const TR_ROLE = '1491090280466747685';
            const GB_ROLE = '1491090834165334167';

            if (interaction.member.roles.cache.has(VERIFIED_ROLE)) return interaction.reply({ content: isTr ? '❌ Zaten doğrulandın!' : '❌ Already verified!', ephemeral: true });

            try {
                // Rolleri veriyoruz
                await interaction.member.roles.add(VERIFIED_ROLE);
                await interaction.member.roles.add(isTr ? TR_ROLE : GB_ROLE);
                
                // Kayıtsız rolünü siliyoruz
                await interaction.member.roles.remove(ENTRY_ROLE).catch(() => {});
                
                // KANAL GİZLEME İŞLEMLERİ
                const member = interaction.member;

                if (isTr) {
                    const trIcinGizlenecekKanallar = ['1491474439865368677', '1491457214974656552'];
                    for (const kanalId of trIcinGizlenecekKanallar) {
                        const channel = interaction.guild.channels.cache.get(kanalId);
                        if (channel) {
                            await channel.permissionOverwrites.edit(member.id, { ViewChannel: false }).catch(console.error);
                        }
                    }
                } else {
                    const engIcinGizlenecekKanallar = ['1491460319002755152', '1491474379354148934'];
                    for (const kanalId of engIcinGizlenecekKanallar) {
                        const channel = interaction.guild.channels.cache.get(kanalId);
                        if (channel) {
                            await channel.permissionOverwrites.edit(member.id, { ViewChannel: false }).catch(console.error);
                        }
                    }
                }

                const logChan = client.channels.cache.get(VERIFY_LOG_ID);
                if (logChan) {
                    const vLog = new EmbedBuilder()
                        .setTitle('✅ New Verification')
                        .setColor('#57F287')
                        .setDescription(`👤 **User -->** <@${interaction.user.id}>\n🌍 **Lang -->** \`${isTr ? 'Turkish 🇹🇷' : 'English 🇬🇧'}\``)
                        .setTimestamp();
                    logChan.send({ embeds: [vLog] });
                }

                return interaction.reply({ content: isTr ? '✅ **Doğrulama başarılı! Dil seçimine göre kanallar düzenlendi.**' : '✅ **Verification successful! Channels updated based on your language.**', ephemeral: true });
            } catch (e) { return interaction.reply({ content: '❌ Role or Channel permission error!', ephemeral: true }); }
        }

        // --- B. 💎 KEY ÜRETME SİSTEMİ (PREMIUM) ---
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            const isTR = cid === 'get_key_tr';
            await interaction.deferReply({ ephemeral: true }); 
            
            let userKey = await KeyModel.findOne({ owner: interaction.user.id });
            if (userKey) {
                return interaction.editReply({ 
                    embeds: [new EmbedBuilder().setColor('#ED4245').setDescription(isTR ? `❌ **Zaten bir anahtarın var!**\n🔑 **Anahtarın:** \`${userKey.key}\`` : `❌ **You already have a key!**\n🔑 **Key:** \`${userKey.key}\``)]
                });
            }

            const newKeyString = `RYP-USER-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            const licenseId = Math.floor(10000 + Math.random() * 90000).toString(); 

            await new KeyModel({ key: newKeyString, expiry: 'Sınırsız', hwid: null, owner: interaction.user.id, licenseId: licenseId }).save();

            const premiumEmbed = new EmbedBuilder()
                .setTitle('💎 Ryphera OS | License Generated')
                .setColor('#2B2D31')
                .setDescription(
                    `🔑 **Key -->** \`${newKeyString}\`\n` +
                    `🆔 **License ID -->** \`#${licenseId}\`\n` +
                    `👤 **Owner -->** <@${interaction.user.id}>\n` +
                    `⏳ **Expiry -->** \`Sınırsız / Lifetime\`\n` +
                    `📅 **Date -->** <t:${Math.floor(Date.now() / 1000)}:f>\n\n` +
                    `⚠️ **Note!! DO NOT SHARE THIS KEY WITH ANYONE**`
                )
                .setFooter({ text: 'Ryphera OS Security' })
                .setTimestamp();

            await interaction.user.send({ embeds: [premiumEmbed] }).catch(() => {});
            await interaction.user.send({ content: `${newKeyString}` }).catch(() => {}); 

            const logChan = client.channels.cache.get(VERIFY_LOG_ID);
            if (logChan) logChan.send({ embeds: [premiumEmbed] });

            return interaction.editReply({ content: isTR ? '✅ **Keyin oluşturuldu ve DM kutuna gönderildi!**' : '✅ **Key created and sent to your DM!**' });
        }

        // --- C. BAŞVURU ONAY/RED ---
        if (cid.startsWith('app_onay_') || cid.startsWith('app_red_')) {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '⚠️ **Yetkin yok!**', ephemeral: true });
            const action = cid.startsWith('app_onay_') ? 'onay' : 'red';
            const targetId = cid.split('_')[2]; 
            
            const targetUser = await client.users.fetch(targetId).catch(() => null);
            if (targetUser) {
                const resEmbed = new EmbedBuilder()
                    .setTitle('📩 Ryphera OS | Başvuru Sonucu')
                    .setColor(action === 'onay' ? '#57F287' : '#ED4245')
                    .setDescription(action === 'onay' ? '🎉 **Tebrikler! Yetkili başvurunuz kabul edildi.**' : '❌ **Maalesef yetkili başvurunuz reddedildi.**')
                    .setTimestamp();
                await targetUser.send({ embeds: [resEmbed] }).catch(() => {});
            }

            return interaction.update({ 
                content: `> **KARAR:** ${action === 'onay' ? '✅ Onaylandı' : '❌ Reddedildi'}\n> **Yetkili:** <@${interaction.user.id}>`, 
                components: [] 
            });
        }

        // --- D. TİCKET SİSTEMİ ---
        const ticketIds = ['ticket_tr_support', 'ticket_tr_partner', 'ticket_tr_key', 'ticket_en_support', 'ticket_en_partner', 'ticket_en_key'];
        if (ticketIds.includes(cid)) {
            await interaction.deferReply({ ephemeral: true });
            const isEn = cid.startsWith('ticket_en_');
            
            let counter = await Counter.findOneAndUpdate({ id: 'ticket' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
            const channel = await interaction.guild.channels.create({
                name: `🎫-${interaction.user.username}-${counter.seq}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                    { id: OWNER_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ]
            });

            const tEmbed = new EmbedBuilder()
                .setTitle('💬 Ryphera OS | Destek')
                .setColor('#2B2D31')
                .setDescription(
                    `👋 **Merhaba** <@${interaction.user.id}>,\n` +
                    `📝 **Konu -->** \`${cid.split('_')[2].toUpperCase()}\`\n` +
                    `🔒 **Durum -->** \`Yetkililer bekleniyor...\`\n\n` +
                    `Destek ekibimiz en kısa sürede burada olacaktır.`
                );

            const tRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close_ticket').setLabel(isEn ? 'Close' : 'Kapat').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                new ButtonBuilder().setCustomId('claim_ticket').setLabel(isEn ? 'Claim' : 'Sahiplen').setStyle(ButtonStyle.Success).setEmoji('✋')
            );

            await channel.send({ content: `<@${interaction.user.id}> | <@${OWNER_ID}>`, embeds: [tEmbed], components: [tRow] });
            return interaction.editReply({ content: isEn ? `✅ Ticket created: <#${channel.id}>` : `✅ Bilet oluşturuldu: <#${channel.id}>` });
        }

        if (cid === 'close_ticket') {
            await interaction.reply({ content: '`Sistem: Kanal 3 saniye içinde imha ediliyor...`' });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }

        if (cid === 'claim_ticket') {
            await interaction.reply({ content: `✅ **Bu bilet <@${interaction.user.id}> tarafından sahiplenildi.**` });
            const disabledRow = ActionRowBuilder.from(interaction.message.components[0]);
            disabledRow.components[1].setDisabled(true).setLabel('Sahiplenildi');
            await interaction.message.edit({ components: [disabledRow] });
        }

        // --- E. KRİTİK İŞLEM: TÜM KEYLERİ SİLME ONAYI ---
        if (cid === 'confirm_delete_all') {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '⚠️ **Bu işlemi sadece kurucu yapabilir!**', ephemeral: true });
            
            try {
                await KeyModel.deleteMany({}); // Veritabanındaki tüm keyleri yok eder
                
                const wipeEmbed = new EmbedBuilder()
                    .setTitle('💥 Ryphera OS | SİSTEM SIFIRLANDI')
                    .setColor('#ED4245')
                    .setDescription(
                        `⚙️ **İşlem -->** \`Tüm Veritabanını Temizleme (WIPE)\`\n` +
                        `✅ **Durum -->** \`Başarıyla Gerçekleşti\`\n` +
                        `🛑 **Sonuç -->** \`Sistemdeki TÜM lisans anahtarları kalıcı olarak silindi.\`\n` +
                        `👮 **Yetkili -->** <@${interaction.user.id}>`
                    )
                    .setFooter({ text: 'Ryphera OS Core Security' })
                    .setTimestamp();

                return interaction.update({ embeds: [wipeEmbed], components: [], content: null });
            } catch (err) { 
                return interaction.reply({ content: '❌ **Sistem sıfırlanırken bir hata oluştu!**', ephemeral: true }); 
            }
        }
        if (cid === 'confirm_list_keys') {
            const keys = await KeyModel.find();
            if (keys.length === 0) return interaction.update({ content: '`⚠️ Veritabanı boş!`', embeds: [], components: [] });

            const desc = keys.map(k => `🆔 \`#${k.licenseId || '00000'}\` | 🔑 \`${k.key}\` | 👤 <@${k.owner}>`).join('\n');
            const listEmbed = new EmbedBuilder()
                .setTitle('📋 Ryphera | Lisans Listesi')
                .setColor('#2B2D31')
                .setDescription(desc.length > 4000 ? desc.substring(0, 4000) + '...' : desc);
            
            return interaction.update({ embeds: [listEmbed], components: [], content: null });
        }

        if (cid === 'cancel_list_keys' || cid === 'cancel_delete_all') {
            return interaction.update({ content: '`❌ İşlem iptal edildi.`', embeds: [], components: [] });
        }
    }
};