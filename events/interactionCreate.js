const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key');
const Counter = require('../models/counter'); 

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const OWNER_ID = '345821033414262794'; 

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.execute(interaction); } catch (e) { console.error(e); }
            return;
        }

        if (!interaction.isButton()) return;
        const cid = interaction.customId;

        // --- DOĞRULAMA SİSTEMİ (KANAL GİZLEME EKLENDİ) ---
        if (cid === 'verify_tr' || cid === 'verify_en') {
            const TR_ROLE = '1491090280466747685';
            const GB_ROLE = '1491090834165334167';
            const isTr = cid === 'verify_tr';

            try {
                // 1. Rolü veriyoruz
                await interaction.member.roles.add(isTr ? TR_ROLE : GB_ROLE);
                
                // 2. KANALI ADAMA GİZLİYORUZ (Büyü burada kanka)
                // Bu kod, butona basan kişinin o kanalı görme yetkisini o an kapatır.
                await interaction.channel.permissionOverwrites.create(interaction.user, {
                    ViewChannel: false
                }).catch(() => {}); // Hata olursa bot çökmesin diye boş catch

                // 3. Başarılı mesajını fırlatıyoruz
                return interaction.reply({ 
                    content: isTr ? '`✅ Doğrulandı! Kanal artık sizin için gizlendi ve tüm sunucu açıldı.`' : '`✅ Verified! Channel is now hidden and server is open for you.`', 
                    ephemeral: true 
                });
            } catch (err) {
                console.error(err);
                return interaction.reply({ content: '`❌ Hata: Rol verilemedi veya kanal gizlenemedi!`', ephemeral: true });
            }
        }

        // --- TICKET KAPATMA ---
        if (cid.startsWith('close_ticket')) {
            const isEn = cid.includes('en');
            await interaction.reply(`\`${isEn ? 'Closing channel... 📩' : 'Kanal imha ediliyor... 📩'}\``);
            setTimeout(() => { interaction.channel.delete().catch(() => {}); }, 2500);
            return;
        }

        // --- SAHİPLEN ---
        if (cid.startsWith('claim_ticket')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ content: '`⚠️ Yetkin yok!`', ephemeral: true });
            }
            const isEn = cid.includes('en');
            const row = ActionRowBuilder.from(interaction.message.components[0]);
            row.components[0].setDisabled(true).setLabel(isEn ? `Claimed: ${interaction.user.username}` : `Sahiplenen: ${interaction.user.username}`);
            await interaction.update({ components: [row] });
            return interaction.channel.send({ content: `💬 **<@${interaction.user.id}> ${isEn ? 'is now assisting you.' : 'biletle ilgileniyor.'}**` });
        }

        // --- TICKET AÇMA ---
        const ticketIds = ['ticket_tr_support', 'ticket_tr_partner', 'ticket_tr_key', 'ticket_en_support', 'ticket_en_partner', 'ticket_en_key'];
        if (ticketIds.includes(cid)) {
            await interaction.deferReply({ ephemeral: true });
            const isEn = cid.startsWith('ticket_en_');
            const existing = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id);
            if (existing) return interaction.editReply({ content: isEn ? '`You already have an open ticket!`' : '`Zaten açık bir biletiniz var!`' });

            try {
                let counter = await Counter.findOneAndUpdate({ id: 'ticket' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
                const ticketNo = counter.seq;
                let type = isEn ? 'support' : 'destek';
                let title = isEn ? 'SUPPORT' : 'DESTEK';
                if (cid.includes('partner')) { type = isEn ? 'partner' : 'is-birligi'; title = isEn ? 'PARTNERSHIP' : 'İŞ BİRLİĞİ'; }
                if (cid.includes('key')) { type = 'key'; title = isEn ? 'KEY OPERATIONS' : 'KEY İŞLEMLERİ'; }

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

                const embed = new EmbedBuilder()
                    .setTitle(`💬 RYPHERA OS | ${title}`)
                    .setColor('#2B2D31')
                    .setDescription(isEn ? `>>> 👋 **Hello <@${interaction.user.id}>!**\nPlease state your request.` : `>>> 👋 **Merhaba <@${interaction.user.id}>!**\nLütfen talebinizi buraya yazın.`)
                    .setFooter({ text: `Bilet #${ticketNo}` });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(isEn ? 'claim_ticket_en' : 'claim_ticket_tr').setLabel(isEn ? 'Claim' : 'Sahiplen').setEmoji('💬').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(isEn ? 'close_ticket_en' : 'close_ticket_tr').setLabel(isEn ? 'Close' : 'Kapat').setEmoji('📩').setStyle(ButtonStyle.Danger)
                );

                await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
                return interaction.editReply({ content: `✅ **Bilet Açıldı:** <#${ticketChannel.id}>` });
            } catch (err) {
                console.error(err);
                return interaction.editReply({ content: `❌ **Hata Oluştu:** \`${err.message}\`` });
            }
        }

        // --- MOBİL KOPYALAMA ---
        if (cid === 'mobil_kopyala_btn') {
            const embed = interaction.message.embeds[0];
            const scriptField = embed.fields[1];
            if (!scriptField) return interaction.reply({ content: '`Kod alanı boş!`', ephemeral: true });
            let cleanCode = scriptField.value.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            return interaction.reply({ content: `💬 **Script Kodu:**\n${cleanCode}`, ephemeral: true });
        }
    }
};