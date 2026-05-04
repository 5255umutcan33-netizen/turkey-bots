const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType, 
    PermissionFlagsBits, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    Events 
} = require('discord.js');
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
        const VERIFY_LOG_ID = '1500269916304052364';
        const ABONE_LOG_ID = '1500587963338326228'; 

        // --- LUAWARE ROL VE KANAL AYARLARI ---
        const TR_ROLE = '1500268780037607544';
        const EN_ROLE = '1500268646545756392';
        const VERIFY_CHANNEL_ID = '1500266130495897722';
        
        // --- TR VE EN KEY KANALLARI ---
        const TR_KEY_CHANNEL_ID = '1500249077000966404';
        const EN_KEY_CHANNEL_ID = '1500249098219946155';

        // ==========================================
        // 1. SLASH KOMUTLARI MOTORU
        // ==========================================
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try { 
                await command.execute(interaction); 
            } catch (e) { 
                console.error(e); 
            }
            return;
        }

        // ==========================================
        // 2. FORM GÖNDERME (MODAL SUBMIT)
        // ==========================================
        if (interaction.isModalSubmit()) {
            
            if (interaction.customId === 'modal_en' || interaction.customId === 'modal_tr') {
                const isEn = interaction.customId === 'modal_en';
                
                const logEmbed = new EmbedBuilder()
                    .setTitle(isEn ? '📩 New LUAWARE Staff Application' : '📩 Yeni LUAWARE Yetkili Başvurusu')
                    .setColor('#00D4FF')
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
                    .setFooter({ text: 'LUAWARE OS Staff System' })
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
                    .setFooter({ text: 'LUAWARE OS Suggestions' })
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

        if (cid === 'apply_tr') {
            const modal = new ModalBuilder().setCustomId('modal_tr').setTitle('Yetkili Başvurusu');
            
            const nameInput = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel('İsim ve Soyisminiz?').setStyle(TextInputStyle.Short).setRequired(true));
            const ageInput = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('age').setLabel('Yaşınız?').setStyle(TextInputStyle.Short).setRequired(true));
            const activeInput = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('active').setLabel('Günlük Aktifliğiniz?').setStyle(TextInputStyle.Short).setRequired(true));
            const cmdInput = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('cmd').setLabel('Bot/Komut Bilginiz?').setStyle(TextInputStyle.Paragraph).setRequired(true));
            const whyInput = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('why').setLabel('Ek Açıklama / Neden Biz?').setStyle(TextInputStyle.Paragraph).setRequired(true));

            modal.addComponents(nameInput, ageInput, activeInput, cmdInput, whyInput);
            return await interaction.showModal(modal);
        }

        if (cid === 'apply_en') {
            const modal = new ModalBuilder().setCustomId('modal_en').setTitle('Staff Application');

            const nameInput = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel('Full Name?').setStyle(TextInputStyle.Short).setRequired(true));
            const ageInput = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('age').setLabel('Age?').setStyle(TextInputStyle.Short).setRequired(true));
            const activeInput = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('active').setLabel('Daily Activity?').setStyle(TextInputStyle.Short).setRequired(true));
            const cmdInput = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('cmd').setLabel('Bot/Command Knowledge?').setStyle(TextInputStyle.Paragraph).setRequired(true));
            const whyInput = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('why').setLabel('Additional Info / Why Us?').setStyle(TextInputStyle.Paragraph).setRequired(true));

            modal.addComponents(nameInput, ageInput, activeInput, cmdInput, whyInput);
            return await interaction.showModal(modal);
        }

        // --- DOĞRULAMA (VERIFY) SİSTEMİ ---
        if (cid === 'verify_tr' || cid === 'verify_en') {
            const isTr = cid === 'verify_tr';
            
            try {
                const trKeyChan = interaction.guild.channels.cache.get(TR_KEY_CHANNEL_ID);
                const enKeyChan = interaction.guild.channels.cache.get(EN_KEY_CHANNEL_ID);

                if (isTr) {
                    await interaction.member.roles.add(TR_ROLE);
                    if (interaction.member.roles.cache.has(EN_ROLE)) await interaction.member.roles.remove(EN_ROLE);
                    
                    if (enKeyChan) await enKeyChan.permissionOverwrites.edit(interaction.user.id, { ViewChannel: false }).catch(() => {});
                    if (trKeyChan) await trKeyChan.permissionOverwrites.edit(interaction.user.id, { ViewChannel: null }).catch(() => {}); 
                } else {
                    await interaction.member.roles.add(EN_ROLE);
                    if (interaction.member.roles.cache.has(TR_ROLE)) await interaction.member.roles.remove(TR_ROLE);

                    if (trKeyChan) await trKeyChan.permissionOverwrites.edit(interaction.user.id, { ViewChannel: false }).catch(() => {});
                    if (enKeyChan) await enKeyChan.permissionOverwrites.edit(interaction.user.id, { ViewChannel: null }).catch(() => {});
                }
                
                const vChannel = interaction.guild.channels.cache.get(VERIFY_CHANNEL_ID);
                if (vChannel) {
                    await vChannel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: false }).catch(() => {});
                }

                const logChan = client.channels.cache.get(VERIFY_LOG_ID);
                if (logChan) {
                    const vLog = new EmbedBuilder()
                        .setTitle('✅ LUAWARE | New Verification')
                        .setColor('#00D4FF')
                        .setDescription(`👤 **User -->** <@${interaction.user.id}>\n🌍 **Lang -->** \`${isTr ? 'Turkish 🇹🇷' : 'English 🇬🇧'}\``)
                        .setTimestamp();
                    logChan.send({ embeds: [vLog] });
                }

                // 🚨 KANALLARI ETİKETLEYEN (MENTION) GÜNCEL REHBER MESAJI
                const guideEmbed = new EmbedBuilder()
                    .setTitle(isTr ? '✅ LUAWARE\'e Hoş Geldin!' : '✅ Welcome to LUAWARE!')
                    .setColor('#57F287')
                    .setDescription(
                        isTr 
                        ? "Rollerin verildi! Ancak hileyi kullanabilmek için bir **Key** alman gerekiyor.\n\n" +
                          "🔑 **ADIM ADIM KEY NASIL ALINIR?**\n" +
                          "**1.** [Buraya Tıklayarak YouTube Kanalımıza Abone Ol](https://www.youtube.com/@LuawareScrpt)\n" +
                          "**2.** İçinde \`@Luawarescrpt\` yazısı olan Abone kanıtı ekran görüntünü (SS) <#1500594950839075088> kanalına gönder.\n" +
                          "⚠️ *(ÖNEMLİ: Lütfen resmi kırpmayın veya kesmeyin! Sayfanın **tamamını** SS alıp gönderin, aksi takdirde Yapay Zeka okuyamaz ve reddeder.)*\n" +
                          "**3.** Yapay Zeka seni anında onaylayıp **Abone** rolünü verecek.\n" +
                          "**4.** Rolü aldıktan sonra **Key Alma** kanalına gidip butonla keyini saniyeler içinde oluşturabilirsin!\n\n" +
                          "*(Lütfen bu adımları yapmadan boş yere ticket açmayın!)*"
                        : "Your roles have been granted! But you need a **Key** to use the script.\n\n" +
                          "🔑 **HOW TO GET A KEY STEP BY STEP?**\n" +
                          "**1.** [Click Here to Subscribe to Our YouTube Channel](https://www.youtube.com/@LuawareScrpt)\n" +
                          "**2.** Send a screenshot (SS) containing the text \`@Luawarescrpt\` to the <#1500588822994358282> channel.\n" +
                          "⚠️ *(IMPORTANT: Please do not crop or cut the image! Take a screenshot of the **entire page/screen**, otherwise the AI will not be able to read it and will reject it.)*\n" +
                          "**3.** The AI will instantly approve you and give you the **Subscriber** role.\n" +
                          "**4.** After getting the role, go to the **Key Generation** channel to get your key!\n\n" +
                          "*(Please follow these steps before opening a ticket!)*"
                    )
                    .setFooter({ text: 'LUAWARE Auto-Guide' });

                return interaction.reply({ 
                    embeds: [guideEmbed], 
                    ephemeral: true 
                });
            } catch (e) { 
                console.error(e);
                return interaction.reply({ content: '❌ Role or Channel permission error! Check Bot Rank.', ephemeral: true }); 
            }
        }

        // --- KEY OLUŞTURMA SİSTEMİ ---
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            const isTR = cid === 'get_key_tr';
            
            const ABONE_ROLU = '1500587633649127445';
            if (!interaction.member.roles.cache.has(ABONE_ROLU)) {
                return interaction.reply({ 
                    content: isTR 
                        ? '❌ **Key üretebilmek için Abone rolüne sahip olmalısın! Lütfen Abone SS kanalına kanıt gönder.**' 
                        : '❌ **You must have the Subscriber role to generate a key! Please submit your sub proof.**', 
                    ephemeral: true 
                });
            }

            await interaction.deferReply({ ephemeral: true }); 
            
            let userKey = await KeyModel.findOne({ owner: interaction.user.id });
            if (userKey) {
                return interaction.editReply({ 
                    embeds: [new EmbedBuilder().setColor('#ED4245').setDescription(isTR ? `❌ **Zaten bir anahtarın var!**\n🔑 **Anahtarın:** \`${userKey.key}\`` : `❌ **You already have a key!**\n🔑 **Key:** \`${userKey.key}\``)]
                });
            }

            const newKeyString = `LUA-USER-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            const licenseId = Math.floor(10000 + Math.random() * 90000).toString(); 

            await new KeyModel({ key: newKeyString, expiry: 'Sınırsız', hwid: null, owner: interaction.user.id, licenseId: licenseId }).save();

            const premiumEmbed = new EmbedBuilder()
                .setTitle('💎 LUAWARE | License Generated')
                .setColor('#00D4FF')
                .setDescription(
                    `🔑 **Key -->** \`${newKeyString}\`\n` +
                    `🆔 **ID -->** \`#${licenseId}\`\n` +
                    `👤 **Owner -->** <@${interaction.user.id}>\n` +
                    `⏳ **Expiry -->** \`Lifetime\`\n` +
                    `📅 **Date -->** <t:${Math.floor(Date.now() / 1000)}:f>\n\n` +
                    `⚠️ **Note!! DO NOT SHARE THIS KEY WITH ANYONE**`
                )
                .setFooter({ text: 'LUAWARE Security' })
                .setTimestamp();

            await interaction.user.send({ embeds: [premiumEmbed] }).catch(() => {});
            await interaction.user.send({ content: `${newKeyString}` }).catch(() => {}); 

            const logChan = client.channels.cache.get(VERIFY_LOG_ID);
            if (logChan) logChan.send({ embeds: [premiumEmbed] });

            return interaction.editReply({ content: isTR ? '✅ **Keyin oluşturuldu ve DM kutuna gönderildi!**' : '✅ **Key created and sent to your DM!**' });
        }

        // --- BAŞVURU ONAY / RED SİSTEMİ ---
        if (cid.startsWith('app_onay_') || cid.startsWith('app_red_')) {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '⚠️ **Yetkin yok!**', ephemeral: true });
            const action = cid.startsWith('app_onay_') ? 'onay' : 'red';
            const targetId = cid.split('_')[2]; 
            
            const targetUser = await client.users.fetch(targetId).catch(() => null);
            if (targetUser) {
                const resEmbed = new EmbedBuilder()
                    .setTitle('📩 LUAWARE | Başvuru Sonucu')
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

        // --- DESTEK TİCKET SİSTEMİ ---
        const tIds = ['ticket_tr_support', 'ticket_tr_partner', 'ticket_tr_key', 'ticket_en_support', 'ticket_en_partner', 'ticket_en_key'];
        if (tIds.includes(cid)) {
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
                .setTitle('💬 LUAWARE | Destek')
                .setColor('#00D4FF')
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

        // --- YEDEK MANUEL (BUTONLU) SS ONAY/RED SİSTEMİ ---
        if (cid.startsWith('abone_yes_') || cid.startsWith('abone_no_')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ **Bu işlem için Yönetici yetkisine sahip olmalısınız!**', ephemeral: true });
            }

            const parts = cid.split('_');
            const action = parts[1]; 
            const userId = parts[2];
            const msgId = parts[3];
            const channelId = parts[4];
            const lang = parts[5]; 

            const originalChannel = interaction.guild.channels.cache.get(channelId);
            if (originalChannel) {
                const originalMsg = await originalChannel.messages.fetch(msgId).catch(() => null);
                if (originalMsg) await originalMsg.delete().catch(() => null);
            }

            const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);
            const logChannelObj = interaction.client.channels.cache.get(ABONE_LOG_ID);

            if (action === 'yes') {
                if (targetMember) {
                    await targetMember.roles.add('1500587633649127445').catch(() => {}); 
                    await targetMember.roles.remove('1500249403443908711').catch(() => {}); 
                    
                    if (originalChannel) {
                        await originalChannel.permissionOverwrites.edit(targetMember.id, { ViewChannel: false }).catch(() => {});
                    }

                    const dmMsg = lang === 'tr' 
                        ? `🎉 **Tebrikler!** Abone kanıtınız ONAYLANDI ve rolünüz verildi.\n🔒 *Doğrulama kanalına erişiminiz kapatıldı.*`
                        : `🎉 **Congratulations!** Your sub proof is APPROVED and your role has been given.\n🔒 *Access to the verification channel is now hidden.*`;
                    
                    await targetMember.send(dmMsg).catch(() => {});
                }
                
                try {
                    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                        .setColor('#1aff00') 
                        .addFields({ name: 'Durum / Status', value: `✅ Onaylandı / Approved (Yetkili: <@${interaction.user.id}>)` });
                    await interaction.update({ embeds: [updatedEmbed], components: [] });
                } catch (e) { console.error("Update error:", e); }
                
            } 
            else if (action === 'no') {
                if (targetMember) {
                    const dmMsg = lang === 'tr' 
                        ? `❌ **Reddedildi:** Abone kanıtınız reddedildi. Lütfen doğru görseli tekrar gönderin.`
                        : `❌ **Rejected:** Your sub proof was rejected. Please submit the correct image again.`;
                    
                    await targetMember.send(dmMsg).catch(() => {});
                }
                
                try {
                    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                        .setColor('#ED4245')
                        .addFields({ name: 'Durum / Status', value: `❌ Reddedildi / Rejected (Yetkili: <@${interaction.user.id}>)` });
                    await interaction.update({ embeds: [updatedEmbed], components: [] });
                    
                    if (logChannelObj) {
                        await logChannelObj.send(`❌ <@${userId}> adlı kullanıcının SS gönderimi <@${interaction.user.id}> tarafından **reddedildi.**`);
                    }
                } catch (e) { console.error("Update error:", e); }
            }
        }

        // --- VERİTABANI YÖNETİMİ (WIPE & LIST) ---
        if (cid === 'confirm_delete_all') {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '⚠️ **Yetkin yok!**', ephemeral: true });
            
            await KeyModel.deleteMany({});
            const wipeEmbed = new EmbedBuilder()
                .setTitle('💥 LUAWARE | SİSTEM SIFIRLANDI')
                .setColor('#ED4245')
                .setDescription(`⚙️ **İşlem -->** \`Tüm Veritabanını Temizleme (WIPE)\`\n✅ **Durum -->** \`Başarıyla Gerçekleşti\``)
                .setTimestamp();

            return interaction.update({ embeds: [wipeEmbed], components: [], content: null });
        }

        if (cid === 'confirm_list_keys') {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '⚠️ **Yetkin yok!**', ephemeral: true });
            
            const keys = await KeyModel.find();
            if (keys.length === 0) return interaction.update({ content: '`⚠️ Veritabanı boş!`', embeds: [], components: [] });

            const desc = keys.map(k => `🆔 \`#${k.licenseId || '00000'}\` | 🔑 \`${k.key}\` | 👤 <@${k.owner}>`).join('\n');
            const listEmbed = new EmbedBuilder()
                .setTitle('📋 LUAWARE | Lisans Listesi')
                .setColor('#00D4FF')
                .setDescription(desc.substring(0, 4000));
            
            return interaction.update({ embeds: [listEmbed], components: [], content: null });
        }

        if (cid.startsWith('cancel_')) {
            return interaction.update({ content: '`❌ İşlem iptal edildi.`', embeds: [], components: [] });
        }
    }
};