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
    Events,
    StringSelectMenuBuilder
} = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const KeyModel = require('../models/key');
const Counter = require('../models/counter'); 
const StaffStat = require('../models/staffStat');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        const OWNER_ID = '345821033414262794'; 
        
        // --- LOG KANALLARI ---
        const LOG_TR = '1501635353470308533'; 
        const LOG_EN = '1501635464824623297'; 
        const SUGGEST_LOG_TR = '1501260343727620309'; 
        const SUGGEST_LOG_EN = '1501263655180828792'; 
        const VERIFY_LOG_ID = '1500269916304052364';
        const ABONE_LOG_ID = '1500587963338326228'; 
        const TICKET_LOG_CHANNEL = '1501639133628469268'; 
        const FEEDBACK_LOG = '1502613775499399300'; 

        // --- LUAWARE ROL VE KANAL AYARLARI ---
        const TR_ROLE = '1500268780037607544';
        const EN_ROLE = '1500268646545756392';
        const STAFF_ROLE = '1501638556026802287'; 
        const VERIFY_CHANNEL_ID = '1500266130495897722';
        
        const TR_KEY_CHANNEL_ID = '1500249077000966404';
        const EN_KEY_CHANNEL_ID = '1500249098219946155';

        const TR_SUGGEST_CHANNEL = '1501262738800902334'; 
        const EN_SUGGEST_CHANNEL = '1501266602891415835'; 

        // ==========================================
        // 1. SLASH KOMUTLARI MOTORU
        // ==========================================
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                const errorContent = { content: '❌ Komut çalıştırılırken bir hata oluştu!', ephemeral: true };
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(errorContent).catch(() => {});
                } else {
                    await interaction.reply(errorContent).catch(() => {});
                }
            }
            return;
        }

        // ==========================================
        // 2. FORM GÖNDERME (MODAL SUBMIT)
        // ==========================================
        if (interaction.isModalSubmit()) {
            
            // --- TICKET FORMU GÖNDERİLDİĞİNDE ---
            if (interaction.customId.startsWith('modal_ticket_')) {
                const originalCid = interaction.customId.replace('modal_', ''); 
                const isEn = originalCid.startsWith('ticket_en_');
                const category = originalCid.split('_')[2].toUpperCase();
                const reason = interaction.fields.getTextInputValue('ticket_reason');

                await interaction.deferReply({ ephemeral: true }); 
                
                let counter = await Counter.findOneAndUpdate({ id: 'ticket' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
                const channel = await interaction.guild.channels.create({
                    name: `🎫-${interaction.user.username}-${counter.seq}`,
                    type: ChannelType.GuildText,
                    topic: interaction.user.id, 
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                        { id: OWNER_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                        { id: STAFF_ROLE, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                    ]
                });

                const tEmbed = new EmbedBuilder()
                    .setTitle(isEn ? '💬 LUAWARE | Support Ticket' : '💬 LUAWARE | Destek Bileti')
                    .setColor('#00D4FF')
                    .setDescription(
                        isEn ? 
                        `👋 **Welcome** <@${interaction.user.id}>,\n\n📝 **Topic -->** \`${category}\`\n🔒 **Status -->** \`Waiting for staff...\`\n\nOur support team has been notified and will assist you as soon as possible.`
                        :
                        `👋 **Merhaba** <@${interaction.user.id}>,\n\n📝 **Konu -->** \`${category}\`\n🔒 **Durum -->** \`Yetkililer bekleniyor...\`\n\nDestek ekibimize bildirim gönderildi, en kısa sürede sizinle ilgileneceklerdir.`
                    )
                    .addFields({ name: isEn ? '🚨 User Issue / Reason:' : '🚨 Kullanıcının Sorunu:', value: `\`\`\`\n${reason}\n\`\`\`` });

                const tRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('close_ticket').setLabel(isEn ? 'Close' : 'Kapat').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                    new ButtonBuilder().setCustomId('claim_ticket').setLabel(isEn ? 'Claim' : 'Sahiplen').setStyle(ButtonStyle.Success).setEmoji('✋')
                );

                await channel.send({ content: `<@${interaction.user.id}> <@&${STAFF_ROLE}>`, embeds: [tEmbed], components: [tRow] });
                
                const ownerUser = await client.users.fetch(OWNER_ID).catch(() => null);
                if (ownerUser) {
                    const adminDmEmbed = new EmbedBuilder()
                        .setTitle('🚨 Yeni Ticket Açıldı! / New Ticket!')
                        .setColor('#FEE75C')
                        .setDescription(`👤 **Kullanıcı:** <@${interaction.user.id}>\n🎫 **Kanal:** <#${channel.id}>\n📌 **Konu:** \`${category}\`\n💬 **Sorun:** \`${reason}\``)
                        .setTimestamp();
                    await ownerUser.send({ embeds: [adminDmEmbed] }).catch(() => {});
                }

                return interaction.editReply({ content: isEn ? `✅ Ticket created: <#${channel.id}>` : `✅ Bilet oluşturuldu: <#${channel.id}>` });
            }

            // --- FEEDBACK FORMU GÖNDERİLDİĞİNDE ---
            if (interaction.customId.startsWith('feedback_modal_')) {
                const stars = interaction.customId.split('_')[2];
                const text = interaction.fields.getTextInputValue('feedback_text');
                const logChannel = client.channels.cache.get(FEEDBACK_LOG);
                
                const starEmoji = '⭐'.repeat(parseInt(stars));
                let embedColor = '#ED4245'; 
                if (stars === '5') embedColor = '#57F287'; 
                if (stars === '3' || stars === '4') embedColor = '#FEE75C'; 
                
                const logEmbed = new EmbedBuilder()
                    .setTitle('📬 Yeni LUAWARE Geri Bildirimi Geldi!')
                    .setColor(embedColor)
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: '👤 Kullanıcı / User', value: `<@${interaction.user.id}> (\`${interaction.user.tag}\`)`, inline: true },
                        { name: '🌟 Puan / Rating', value: `${starEmoji} (${stars}/5)`, inline: true },
                        { name: '💬 Mesaj / Feedback', value: `\`\`\`${text}\`\`\`` }
                    )
                    .setFooter({ text: 'LUAWARE Customer Satisfaction' })
                    .setTimestamp();
                    
                if (logChannel) await logChannel.send({ embeds: [logEmbed] });
                
                return interaction.reply({ content: '✅ 🇹🇷 Geri bildiriminiz başarıyla iletildi, teşekkür ederiz!\n✅ 🇬🇧 Your feedback has been successfully submitted, thank you!', ephemeral: true });
            }

            // --- YETKİLİ BAŞVURUSU FORMU GÖNDERİLDİĞİNDE ---
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
                    .setFooter({ text: 'LUAWARE Staff System' })
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`app_onay_${interaction.user.id}`).setLabel(isEn ? 'Approve' : 'Onayla').setStyle(ButtonStyle.Success).setEmoji('✅'),
                    new ButtonBuilder().setCustomId(`app_red_${interaction.user.id}`).setLabel(isEn ? 'Reject' : 'Reddet').setStyle(ButtonStyle.Danger).setEmoji('❌')
                );

                const logChannel = client.channels.cache.get(isEn ? LOG_EN : LOG_TR);
                if (logChannel) await logChannel.send({ embeds: [logEmbed], components: [row] });

                return interaction.reply({ embeds: [new EmbedBuilder().setColor('#57F287').setDescription(isEn ? '✅ **Your application has been submitted!**' : '✅ **Başvurunuz yönetime başarıyla iletildi!**')], ephemeral: true });
            }

            // --- SCRIPT ÖNERİSİ FORMU GÖNDERİLDİĞİNDE ---
            if (interaction.customId === 'modal_suggest_tr' || interaction.customId === 'modal_suggest_en') {
                const isEn = interaction.customId === 'modal_suggest_en';
                
                const suggestEmbed = new EmbedBuilder()
                    .setTitle(isEn ? '💡 New Script Suggestion' : '💡 Yeni Script Önerisi')
                    .setColor('#00D4FF') 
                    .setDescription(
                        `👤 **${isEn ? 'Sender' : 'Gönderen'} -->** <@${interaction.user.id}>\n` +
                        `🎮 **${isEn ? 'Game/Script' : 'Oyun/Script'} -->** \`${interaction.fields.getTextInputValue('suggest_name')}\`\n` +
                        `📝 **${isEn ? 'Features' : 'Özellikler'} -->**\n\`\`\`\n${interaction.fields.getTextInputValue('suggest_features')}\n\`\`\``
                    )
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: 'LUAWARE Suggestions' })
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`sug_onay_${interaction.user.id}`).setLabel(isEn ? 'Approve' : 'Onayla').setStyle(ButtonStyle.Success).setEmoji('✅'),
                    new ButtonBuilder().setCustomId(`sug_red_${interaction.user.id}`).setLabel(isEn ? 'Reject' : 'Reddet').setStyle(ButtonStyle.Danger).setEmoji('❌')
                );

                const logChannel = client.channels.cache.get(isEn ? SUGGEST_LOG_EN : SUGGEST_LOG_TR);
                if (logChannel) await logChannel.send({ embeds: [suggestEmbed], components: [row] });

                return interaction.reply({ embeds: [new EmbedBuilder().setColor('#57F287').setDescription(isEn ? '✅ **Suggestion sent!**' : '✅ **Öneriniz iletildi, teşekkür ederiz.**')], ephemeral: true });
            }
        }

        // ==========================================
        // 3. SEÇİM MENÜSÜ (STRING SELECT MENU) 
        // ==========================================
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'feedback_stars') {
                const stars = interaction.values[0];
                
                const modal = new ModalBuilder()
                    .setCustomId(`feedback_modal_${stars}`)
                    .setTitle('📝 Geri Bildirim / Feedback');
                    
                const textInput = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('feedback_text')
                        .setLabel('Mesajınız / Your Message')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Görüşlerinizi buraya yazın... / Write your thoughts here...')
                        .setRequired(true)
                        .setMinLength(5)
                        .setMaxLength(1000)
                );
                    
                modal.addComponents(textInput);
                await interaction.showModal(modal);
                return interaction.message.delete().catch(() => {});
            }
        }

        // ==========================================
        // 4. BUTON ETKİLEŞİMLERİ
        // ==========================================
        if (!interaction.isButton()) return;
        const cid = interaction.customId; 

        // --- TICKET BUTONUNA BASILINCA (MODAL AÇILIR) ---
        const tIds = ['ticket_tr_support', 'ticket_tr_partner', 'ticket_tr_key', 'ticket_en_support', 'ticket_en_partner', 'ticket_en_key'];
        if (tIds.includes(cid)) {
            const isEn = cid.startsWith('ticket_en_');

            const existingTicket = interaction.guild.channels.cache.find(c => c.name.startsWith('🎫-') && c.topic === interaction.user.id);
            if (existingTicket) {
                return interaction.reply({ content: isEn ? `❌ **You already have an open ticket:** <#${existingTicket.id}>` : `❌ **Zaten açık bir biletiniz var:** <#${existingTicket.id}>`, ephemeral: true });
            }

            const modal = new ModalBuilder().setCustomId(`modal_${cid}`).setTitle(isEn ? 'Ticket Details' : 'Bilet Detayları');
            const reasonInput = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('ticket_reason')
                    .setLabel(isEn ? 'Describe your issue in detail:' : 'Lütfen sorununuzu detaylıca anlatın:')
                    .setPlaceholder(isEn ? 'I need help with...' : 'Şu konuda yardıma ihtiyacım var...')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMinLength(10)
            );

            modal.addComponents(reasonInput);
            return await interaction.showModal(modal);
        }

        // --- FEEDBACK BUTONUNA BASILINCA (YILDIZ SEÇİMİ) ---
        if (cid === 'feedback_start') {
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('feedback_stars')
                    .setPlaceholder('⭐ Puanınızı Seçin / Select your rating')
                    .addOptions([
                        { label: '5 Yıldız / 5 Stars', value: '5', emoji: '🌟' },
                        { label: '4 Yıldız / 4 Stars', value: '4', emoji: '⭐' },
                        { label: '3 Yıldız / 3 Stars', value: '3', emoji: '🆗' },
                        { label: '2 Yıldız / 2 Stars', value: '2', emoji: '⚠️' },
                        { label: '1 Yıldız / 1 Star', value: '1', emoji: '❌' }
                    ])
            );
            return interaction.reply({ content: '🇹🇷 Önce hizmetimize puan verin.\n🇬🇧 First, rate our service.', components: [row], ephemeral: true });
        }

        // --- SCRIPT ÖNERİ MODAL'INI AÇMA ---
        if (cid === 'btn_suggest_tr' || cid === 'btn_suggest_en') {
            const isEn = cid === 'btn_suggest_en';
            const modal = new ModalBuilder().setCustomId(isEn ? 'modal_suggest_en' : 'modal_suggest_tr').setTitle(isEn ? 'LUAWARE Script Suggestion' : 'LUAWARE Script Önerisi');
            
            const gameInput = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('suggest_name').setLabel(isEn ? 'Which Game or Script?' : 'Hangi Oyun veya Script?').setStyle(TextInputStyle.Short).setRequired(true));
            const featureInput = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('suggest_features').setLabel(isEn ? 'Features / What is your idea?' : 'Özellikler / Fikriniz Nedir?').setStyle(TextInputStyle.Paragraph).setRequired(true));

            modal.addComponents(gameInput, featureInput);
            return await interaction.showModal(modal);
        }

        // --- ÖNERİ ONAY / RED SİSTEMİ ---
        if (cid.startsWith('sug_onay_') || cid.startsWith('sug_red_')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== OWNER_ID) {
                return interaction.reply({ content: '⚠️ **Yetkin yok! / No permission!**', ephemeral: true });
            }
            
            await interaction.deferUpdate(); 
            
            const action = cid.startsWith('sug_onay_') ? 'onay' : 'red';
            const targetId = cid.split('_')[2]; 
            
            const targetUser = await client.users.fetch(targetId).catch(() => null);
            const guildMember = await interaction.guild.members.fetch(targetId).catch(() => null);

            let isTurkish = true; 
            if (guildMember && guildMember.roles.cache.has(EN_ROLE) && !guildMember.roles.cache.has(TR_ROLE)) {
                isTurkish = false;
            }

            if (targetUser) {
                const resEmbed = new EmbedBuilder()
                    .setTitle(isTurkish ? '💡 LUAWARE | Öneri Sonucu' : '💡 LUAWARE | Suggestion Result')
                    .setColor(action === 'onay' ? '#57F287' : '#ED4245')
                    .setDescription(
                        action === 'onay' 
                        ? (isTurkish ? '🎉 **Tebrikler! Gönderdiğiniz script/oyun önerisi ekibimiz tarafından onaylandı ve dikkate alındı. Fikriniz için teşekkür ederiz!**' : '🎉 **Congratulations! Your script/game suggestion has been approved by our team. Thank you for your idea!**')
                        : (isTurkish ? '❌ **Maalesef gönderdiğiniz script/oyun önerisi uygun bulunmadı veya halihazırda mevcut olduğu için reddedildi.**' : '❌ **Unfortunately, your script/game suggestion was not deemed suitable or was rejected because it already exists.**')
                    )
                    .setTimestamp();
                await targetUser.send({ embeds: [resEmbed] }).catch(() => {});
            }

            const logEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setColor(action === 'onay' ? '#57F287' : '#ED4245')
                .addFields({ name: 'Durum / Status', value: action === 'onay' ? `✅ Onaylandı / Approved (Yetkili: <@${interaction.user.id}>)` : `❌ Reddedildi / Rejected (Yetkili: <@${interaction.user.id}>)` });

            return interaction.editReply({ embeds: [logEmbed], components: [] });
        }

        // --- YETKİLİ BAŞVURUSU MODAL'INI AÇMA ---
        if (cid === 'apply_tr' || cid === 'apply_en') {
            const isEn = cid === 'apply_en';
            const modal = new ModalBuilder().setCustomId(isEn ? 'modal_en' : 'modal_tr').setTitle(isEn ? 'Staff Application' : 'Yetkili Başvurusu');
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel(isEn ? 'Name?' : 'İsminiz?').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('age').setLabel(isEn ? 'Age?' : 'Yaşınız?').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('active').setLabel(isEn ? 'Daily Activity?' : 'Günlük Aktifliğiniz?').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('cmd').setLabel(isEn ? 'Bot/Command Knowledge?' : 'Bot/Komut Bilginiz?').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('why').setLabel(isEn ? 'Additional Info / Why Us?' : 'Ek Açıklama / Neden Biz?').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        // --- DOĞRULAMA (VERIFY) VE KANAL GİZLEME ---
        if (cid === 'verify_tr' || cid === 'verify_en') {
            await interaction.deferReply({ ephemeral: true }); 

            const isTr = cid === 'verify_tr';
            
            try {
                const trKeyChan = interaction.guild.channels.cache.get(TR_KEY_CHANNEL_ID);
                const enKeyChan = interaction.guild.channels.cache.get(EN_KEY_CHANNEL_ID);
                const trSugChan = interaction.guild.channels.cache.get(TR_SUGGEST_CHANNEL);
                const enSugChan = interaction.guild.channels.cache.get(EN_SUGGEST_CHANNEL);

                if (isTr) {
                    await interaction.member.roles.add(TR_ROLE);
                    if (interaction.member.roles.cache.has(EN_ROLE)) await interaction.member.roles.remove(EN_ROLE);
                    
                    if (enKeyChan) await enKeyChan.permissionOverwrites.edit(interaction.user.id, { ViewChannel: false }).catch(() => {});
                    if (trKeyChan) await trKeyChan.permissionOverwrites.edit(interaction.user.id, { ViewChannel: null }).catch(() => {}); 
                    if (enSugChan) await enSugChan.permissionOverwrites.edit(interaction.user.id, { ViewChannel: false }).catch(() => {});
                    if (trSugChan) await trSugChan.permissionOverwrites.edit(interaction.user.id, { ViewChannel: null }).catch(() => {});
                } else {
                    await interaction.member.roles.add(EN_ROLE);
                    if (interaction.member.roles.cache.has(TR_ROLE)) await interaction.member.roles.remove(TR_ROLE);

                    if (trKeyChan) await trKeyChan.permissionOverwrites.edit(interaction.user.id, { ViewChannel: false }).catch(() => {});
                    if (enKeyChan) await enKeyChan.permissionOverwrites.edit(interaction.user.id, { ViewChannel: null }).catch(() => {});
                    if (trSugChan) await trSugChan.permissionOverwrites.edit(interaction.user.id, { ViewChannel: false }).catch(() => {});
                    if (enSugChan) await enSugChan.permissionOverwrites.edit(interaction.user.id, { ViewChannel: null }).catch(() => {});
                }
                
                const vChannel = interaction.guild.channels.cache.get(VERIFY_CHANNEL_ID);
                if (vChannel) await vChannel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: false }).catch(() => {});

                const logChan = client.channels.cache.get(VERIFY_LOG_ID);
                if (logChan) {
                    const vLog = new EmbedBuilder()
                        .setTitle('✅ LUAWARE | New Verification')
                        .setColor('#00D4FF')
                        .setDescription(`👤 **User -->** <@${interaction.user.id}>\n🌍 **Lang -->** \`${isTr ? 'Turkish 🇹🇷' : 'English 🇬🇧'}\``)
                        .setTimestamp();
                    logChan.send({ embeds: [vLog] });
                }

                const guideEmbed = new EmbedBuilder()
                    .setTitle(isTr ? '✅ LUAWARE\'e Hoş Geldin!' : '✅ Welcome to LUAWARE!')
                    .setColor('#57F287')
                    .setDescription(
                        isTr 
                        ? "Rollerin verildi! Ancak hileyi kullanabilmek için bir **Key** alman gerekiyor.\n\n" +
                          "🔑 **ADIM ADIM KEY NASIL ALINIR?**\n" +
                          "**1.** [Buraya Tıklayarak YouTube Kanalımıza Abone Ol](https://www.youtube.com/@LuawareScrpt)\n" +
                          "**2.** İçinde `@Luawarescrpt` yazısı olan Abone kanıtı ekran görüntünü <#1500594950839075088> kanalına gönder.\n" +
                          "⚠️ *(ÖNEMLİ: Lütfen resmi kırpmayın veya kesmeyin! Sayfanın **tamamını** SS alıp gönderin.)*\n" +
                          "**3.** Yapay Zeka seni anında onaylayıp **Abone** rolünü verecek.\n" +
                          "**4.** Rolü aldıktan sonra **Key Alma** kanalına gidip butonla keyini saniyeler içinde oluşturabilirsin!\n\n" +
                          "*(Lütfen bu adımları yapmadan boş yere ticket açmayın!)*"
                        : "Your roles have been granted! But you need a **Key** to use the script.\n\n" +
                          "🔑 **HOW TO GET A KEY STEP BY STEP?**\n" +
                          "**1.** [Click Here to Subscribe to Our YouTube Channel](https://www.youtube.com/@LuawareScrpt)\n" +
                          "**2.** Send a screenshot (SS) containing the text `@Luawarescrpt` to the <#1500588822994358282> channel.\n" +
                          "⚠️ *(IMPORTANT: Please do not crop or cut the image! Take a screenshot of the **entire page/screen**.)*\n" +
                          "**3.** The AI will instantly approve you and give you the **Subscriber** role.\n" +
                          "**4.** After getting the role, go to the **Key Generation** channel to get your key!\n\n" +
                          "*(Please follow these steps before opening a ticket!)*"
                    )
                    .setFooter({ text: 'LUAWARE Auto-Guide' });

                return interaction.editReply({ embeds: [guideEmbed] });
            } catch (e) { 
                console.error(e);
                return interaction.editReply({ content: '❌ Role or Channel permission error! Check Bot Rank.' }); 
            }
        }

        // =========================================================================
        // 🚨 LUAWARE PARA KAZANDIRAN (LOOTLABS) KEY OLUŞTURMA SİSTEMİ 🚨
        // =========================================================================
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            const isTR = cid === 'get_key_tr';
            const ABONE_ROLU = '1500587633649127445';
            const VIP_ROLU = STAFF_ROLE; // Şimdilik Yetkililer (Staff) direkt key alabilir.

            if (!interaction.member.roles.cache.has(ABONE_ROLU)) {
                return interaction.reply({ content: isTR ? '❌ **Abone rolün yok!**' : '❌ **No Subscriber role!**', ephemeral: true }).catch(() => {});
            }

            // 1. VIP/YETKİLİ KONTROLÜ (Bu adamlar reklam izlemez, direkt keyi alır)
            if (interaction.member.roles.cache.has(VIP_ROLU) || interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.deferReply({ ephemeral: true }).catch(() => {});
                try {
                    let userKey = await KeyModel.findOne({ owner: interaction.user.id });
                    if (userKey) {
                        return interaction.editReply({ 
                            embeds: [new EmbedBuilder().setColor('#ED4245').setDescription(isTR ? `❌ **Zaten anahtarın var:** \`${userKey.key}\`` : `❌ **You already have a key:** \`${userKey.key}\``)]
                        }).catch(() => {});
                    }

                    const part1 = Math.random().toString(36).substr(2, 4).toUpperCase();
                    const part2 = Math.random().toString(36).substr(2, 4).toUpperCase();
                    const newKeyString = `LUA-USER-${part1}-${part2}`;
                    const licenseId = Math.floor(10000 + Math.random() * 90000).toString(); 

                    await new KeyModel({ key: newKeyString, expiry: 'Sınırsız', owner: interaction.user.id, licenseId: licenseId }).save();

                    const premiumEmbed = new EmbedBuilder()
                        .setTitle('💎 LUAWARE | License Generated')
                        .setColor('#00D4FF')
                        .setDescription(`🔑 **Key -->** \`${newKeyString}\`\n🆔 **ID -->** \`#${licenseId}\`\n👤 **Owner -->** <@${interaction.user.id}>\n⏳ **Expiry -->** \`Lifetime\`\n📅 **Date -->** <t:${Math.floor(Date.now() / 1000)}:f>\n\n⚠️ **Note!! DO NOT SHARE THIS KEY WITH ANYONE**`)
                        .setFooter({ text: 'LUAWARE Security' })
                        .setTimestamp();

                    await interaction.user.send({ embeds: [premiumEmbed] }).catch(() => {});
                    await interaction.user.send({ content: `${newKeyString}` }).catch(() => {}); 
                    
                    const logChan = client.channels.cache.get(VERIFY_LOG_ID);
                    if (logChan) logChan.send({ embeds: [premiumEmbed] }).catch(() => {});

                    return interaction.editReply({ content: isTR ? '✅ **VIP Keyin DM kutuna gönderildi!**' : '✅ **VIP Key sent to your DM!**' }).catch(() => {});
                } catch (err) {
                    return interaction.editReply({ content: '❌ **Sistem hatası! Veritabanı bağlantısı koptu.**' }).catch(() => {});
                }
            }

            // 2. NORMAL ÜYELER İÇİN REKLAMLI LİNK ÜRETME (LootLabs API Sistemi)
            const LOOTLABS_API_KEY = 'bc6587fa9727215e117132a52b05272b945f578b9a3eb302a5de8a511218c734'; 
            
            // Kullanıcı reklamı geçince Vercel/Render sitene geri dönecek
            const hedefLink = `https://turkey-bots-1.onrender.com/key-al?userid=${interaction.user.id}`;
            
            // LootLabs sistemi Base64 değil, direkt URL Encode ister (encodeURIComponent).
            const encodedHedef = encodeURIComponent(hedefLink);
            
            // LootLabs standart yönlendirme URL'si (Otomatik olarak en iyi domaini seçer)
            const paraKazandiranLink = `https://loot-link.com/s?api=${LOOTLABS_API_KEY}&url=${encodedHedef}`;

            const adEmbed = new EmbedBuilder()
                .setTitle(isTR ? '💰 LUAWARE | Ücretsiz Key Sistemi' : '💰 LUAWARE | Free Key System')
                .setColor('#FEE75C')
                .setDescription(
                    isTR 
                    ? `👋 Merhaba <@${interaction.user.id}>,\n\nSistemimizi ücretsiz tutabilmek ve LUAWARE sunucularını desteklemek için kısa bir reklam geçmeniz gerekmektedir.\n\n👇 **Aşağıdaki butona tıklayıp sadece 10 saniye içinde anahtarını alabilirsin:**`
                    : `👋 Hello <@${interaction.user.id}>,\n\nTo keep our system free and support LUAWARE servers, you need to pass a short advertisement.\n\n👇 **Click the button below to get your key in just 10 seconds:**`
                )
                .setFooter({ text: 'LUAWARE Monetization System (Powered by LootLabs)' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel(isTR ? '🔗 Reklamı Geç ve Key Al' : '🔗 Pass Ads & Get Key')
                    .setStyle(ButtonStyle.Link)
                    .setURL(paraKazandiranLink)
            );

            return interaction.reply({ embeds: [adEmbed], components: [row], ephemeral: true });
        }
        // =========================================================================

        // --- YETKİLİ BAŞVURU ONAY / RED & OTO ROL SİSTEMİ ---
        if (cid.startsWith('app_onay_') || cid.startsWith('app_red_')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== OWNER_ID) {
                return interaction.reply({ content: '⚠️ **Yetkin yok!**', ephemeral: true });
            }
            
            await interaction.deferUpdate();

            const action = cid.startsWith('app_onay_') ? 'onay' : 'red';
            const targetId = cid.split('_')[2]; 
            const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
            
            if (targetMember) {
                if (action === 'onay') await targetMember.roles.add(STAFF_ROLE).catch(() => {});

                const resEmbed = new EmbedBuilder()
                    .setTitle('📩 LUAWARE | Başvuru Sonucu')
                    .setColor(action === 'onay' ? '#57F287' : '#ED4245')
                    .setDescription(action === 'onay' ? '🎉 **Tebrikler! Yetkili başvurunuz kabul edildi.**\nYetkili rolünüz başarıyla verildi!' : '❌ **Maalesef yetkili başvurunuz reddedildi.**')
                    .setTimestamp();
                await targetMember.send({ embeds: [resEmbed] }).catch(() => {});
            }

            return interaction.editReply({ content: `> **KARAR:** ${action === 'onay' ? '✅ Onaylandı (Rol Verildi)' : '❌ Reddedildi'}\n> **Yetkili:** <@${interaction.user.id}>`, components: [] });
        }

        // --- TICKET KAPATMA VE HTML LOG SİSTEMİ ---
        if (cid === 'close_ticket') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== OWNER_ID && !interaction.member.roles.cache.has(STAFF_ROLE)) {
                return interaction.reply({ content: '⚠️ **Bu bileti kapatmak için Yetkili olmanız gerekmektedir!**', ephemeral: true });
            }

            await interaction.reply({ content: '`Sistem: Ticket loglanıyor ve 5 saniye içinde kapatılacak...`' });
            
            try {
                const attachment = await discordTranscripts.createTranscript(interaction.channel, {
                    limit: -1, 
                    returnType: 'attachment', 
                    filename: `${interaction.channel.name}-log.html`, 
                    saveImages: true,
                    poweredBy: false
                });

                const logChannel = interaction.guild.channels.cache.get(TICKET_LOG_CHANNEL);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('🎫 Ticket Kapatıldı (Log)')
                        .setColor('#ED4245')
                        .setDescription(`**Kapatılan Kanal:** \`${interaction.channel.name}\`\n**Kapatan Yetkili:** <@${interaction.user.id}>`)
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed], files: [attachment] });
                }
            } catch (err) {
                console.error("Transcript Error: ", err);
            }

            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        }

        // --- TICKET SAHİPLENME VE İSTATİSTİK SİSTEMİ ---
        if (cid === 'claim_ticket') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== OWNER_ID && !interaction.member.roles.cache.has(STAFF_ROLE)) {
                return interaction.reply({ content: '⚠️ **Bu bileti sahiplenmek için Yetkili olmanız gerekmektedir!**', ephemeral: true });
            }

            await interaction.deferUpdate(); 

            await StaffStat.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { claims: 1 } }, { upsert: true, new: true });
            
            const disabledRow = ActionRowBuilder.from(interaction.message.components[0]);
            disabledRow.components[1].setDisabled(true).setLabel('Sahiplenildi (Claimed)').setStyle(ButtonStyle.Secondary);
            
            await interaction.editReply({ components: [disabledRow] });
            await interaction.channel.send({ content: `✅ **Bu bilet <@${interaction.user.id}> tarafından sahiplenildi.**` });
        }

        // --- YEDEK MANUEL (BUTONLU) SS ONAY/RED SİSTEMİ ---
        if (cid.startsWith('abone_yes_') || cid.startsWith('abone_no_')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ **Bu işlem için Yönetici yetkisine sahip olmalısınız!**', ephemeral: true });
            }

            await interaction.deferUpdate(); 

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
                    await interaction.editReply({ embeds: [updatedEmbed], components: [] });
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
                    await interaction.editReply({ embeds: [updatedEmbed], components: [] });
                    
                    if (logChannelObj) {
                        await logChannelObj.send(`❌ <@${userId}> adlı kullanıcının SS gönderimi <@${interaction.user.id}> tarafından **reddedildi.**`);
                    }
                } catch (e) { console.error("Update error:", e); }
            }
        }

        // --- VERİTABANI YÖNETİMİ (WIPE & LIST) ---
        if (cid === 'confirm_delete_all') {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '⚠️ **Yetkin yok!**', ephemeral: true });
            
            await interaction.deferUpdate();
            await KeyModel.deleteMany({});
            const wipeEmbed = new EmbedBuilder()
                .setTitle('💥 LUAWARE | SİSTEM SIFIRLANDI')
                .setColor('#ED4245')
                .setDescription(`⚙️ **İşlem -->** \`Tüm Veritabanını Temizleme (WIPE)\`\n✅ **Durum -->** \`Başarıyla Gerçekleşti\``)
                .setTimestamp();

            return interaction.editReply({ embeds: [wipeEmbed], components: [], content: null });
        }

        if (cid === 'confirm_list_keys') {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '⚠️ **Yetkin yok!**', ephemeral: true });
            
            await interaction.deferUpdate();
            const keys = await KeyModel.find();
            if (keys.length === 0) return interaction.editReply({ content: '`⚠️ Veritabanı boş!`', embeds: [], components: [] });

            const desc = keys.map(k => `🆔 \`#${k.licenseId || '00000'}\` | 🔑 \`${k.key}\` | 👤 <@${k.owner}>`).join('\n');
            const listEmbed = new EmbedBuilder()
                .setTitle('📋 LUAWARE | Lisans Listesi')
                .setColor('#00D4FF')
                .setDescription(desc.substring(0, 4000));
            
            return interaction.editReply({ embeds: [listEmbed], components: [], content: null });
        }

        if (cid.startsWith('cancel_')) {
            return interaction.update({ content: '`❌ İşlem iptal edildi.`', embeds: [], components: [] });
        }
    }
};