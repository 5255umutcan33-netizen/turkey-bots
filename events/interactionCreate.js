const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key');
const Counter = require('../models/counter'); // Sayı sayacı dosyası şart!

const cooldown = new Set(); 

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const OWNER_ID = '345821033414262794'; 

        // --- 1. SLASH KOMUTLARI ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.execute(interaction); } catch (error) { console.error(error); }
            return;
        }

        // --- 2. BUTONLAR ---
        if (!interaction.isButton()) return;
        const cid = interaction.customId;

        // --- TICKET KAPATMA ---
        if (cid === 'close_ticket_tr' || cid === 'close_ticket_en') {
            const isEn = cid === 'close_ticket_en';
            await interaction.reply(`\`${isEn ? 'Channel is closing... 📩' : 'Kanal imha ediliyor... 📩'}\``);
            setTimeout(() => { interaction.channel.delete().catch(() => {}); }, 3000);
            return;
        }

        // --- YETKİLİ SAHİPLEN ---
        if (cid === 'claim_ticket_tr' || cid === 'claim_ticket_en') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ content: '`⚠️ YETKİ YOK`', ephemeral: true });
            }
            const isEn = cid === 'claim_ticket_en';
            const row = ActionRowBuilder.from(interaction.message.components[0]);
            row.components[0].setDisabled(true).setLabel(isEn ? `Claimed: ${interaction.user.username}` : `Sahiplenen: ${interaction.user.username}`);
            await interaction.update({ components: [row] });

            const claimEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(isEn 
                    ? `>>> 🗪 **STAFF CONNECTED!**\n\nStaff <@${interaction.user.id}> is now handling your request.` 
                    : `>>> 🗪 **YETKİLİ BAĞLANDI!**\n\nYetkili <@${interaction.user.id}> talebinizle ilgileniyor.`);
            return interaction.channel.send({ embeds: [claimEmbed] });
        }

        // --- TICKET AÇMA (BOŞ KANAL HATASI FİXLENDİ) ---
        const ticketIds = ['ticket_tr_support', 'ticket_tr_partner', 'ticket_tr_key', 'ticket_en_support', 'ticket_en_partner', 'ticket_en_key'];
        if (ticketIds.includes(cid)) {
            const isEn = cid.startsWith('ticket_en_');

            // KORUMA: 1 Kişi sadece 1 ticket açabilir
            const existingTicket = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id);
            if (existingTicket) {
                return interaction.reply({ content: isEn ? '`You already have an open ticket.`' : '`Zaten açık bir biletiniz var.`', ephemeral: true });
            }

            // SIRALI NUMARA ÇEKME
            let counter = await Counter.findOneAndUpdate({ id: 'ticket' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
            const ticketNo = counter ? counter.seq : Math.floor(Math.random() * 1000); // Sayaç bozuksa rastgele atar

            let typeName = 'bilet', titleName = 'DESTEK';
            if (cid.includes('support')) { typeName = isEn ? 'support' : 'destek'; titleName = isEn ? 'SUPPORT' : 'DESTEK'; }
            else if (cid.includes('partner')) { typeName = isEn ? 'partner' : 'is-birligi'; titleName = isEn ? 'PARTNER' : 'İŞ BİRLİĞİ'; }
            else if (cid.includes('key')) { typeName = 'key'; titleName = isEn ? 'KEY OPS' : 'KEY İŞLEMLERİ'; }

            try {
                // KANAL OLUŞTURMA
                const ticketChannel = await interaction.guild.channels.create({
                    name: `${typeName}-${interaction.user.username}-${ticketNo}`,
                    type: ChannelType.GuildText,
                    topic: interaction.user.id, 
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, 
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }, 
                        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                    ]
                });

                // KANAL İÇİ MESAJ
                const ticketEmbed = new EmbedBuilder()
                    .setTitle(`💬 RYPHERA OS | ${titleName}`)
                    .setColor('#2B2D31')
                    .setDescription(isEn 
                        ? `>>> 👋 **Hello, <@${interaction.user.id}>**\n\nPlease describe your issue. Our staff will assist you shortly.`
                        : `>>> 👋 **Merhaba, <@${interaction.user.id}>**\n\nLütfen talebinizi buraya yazın. Yetkililerimiz birazdan sizinle ilgilenecek.`)
                    .setFooter({ text: `Bilet #${ticketNo} | ${interaction.user.tag}` })
                    .setTimestamp();

                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(isEn ? 'claim_ticket_en' : 'claim_ticket_tr').setLabel(isEn ? 'Claim' : 'Sahiplen').setEmoji('🗪').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(isEn ? 'close_ticket_en' : 'close_ticket_tr').setLabel(isEn ? 'Close' : 'Kapat').setEmoji('📩').setStyle(ButtonStyle.Danger)
                );

                // Mesajı kanala gönder
                await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [actionRow] });

                // Kullanıcıya bildirim ver
                return interaction.reply({ content: isEn ? `\`Ticket created:\` <#${ticketChannel.id}>` : `\`Bilet oluşturuldu:\` <#${ticketChannel.id}>`, ephemeral: true });

            } catch (err) {
                console.error(err);
                return interaction.reply({ content: '`SİSTEMSEL HATA: Kanal oluşturulamadı!`', ephemeral: true });
            }
        }

        // --- MOBİL KOPYALAMA ---
        if (cid === 'mobil_kopyala_btn') {
            const embed = interaction.message.embeds[0];
            const scriptAlani = embed.fields[1]; 
            let temizKod = scriptAlani.value.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            return interaction.reply({ content: `💬 **Script Kodu:**\n${temizKod}`, ephemeral: true });
        }

        // --- VERİTABANI SİLME ---
        if (cid === 'confirm_delete_all') {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '`⚠️ YETKİ YOK`', ephemeral: true });
            await KeyModel.deleteMany({});
            return interaction.update({ content: '`✅ Veritabanı temizlendi.`', components: [] });
        }

        // --- KEY ALMA ---
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            if (cooldown.has(interaction.user.id)) return interaction.reply({ content: '`Bekle...`', ephemeral: true });
            cooldown.add(interaction.user.id);
            setTimeout(() => cooldown.delete(interaction.user.id), 5000);
            const isEn = cid === 'get_key_en';
            const existing = await KeyModel.findOne({ createdBy: interaction.user.id });
            if (existing) return interaction.reply({ content: `\`Key: ${existing.key}\``, ephemeral: true });
            const rypKey = `RYP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            await new KeyModel({ key: rypKey, keyId: "123456", createdBy: interaction.user.id }).save();
            try {
                await interaction.user.send(`👋 **RYPHERA KEY:** \`${rypKey}\``);
                return interaction.reply({ content: isEn ? '`SUCCESS: Check DMs!`' : '`BAŞARILI: DM kutuna bak!`', ephemeral: true });
            } catch (e) { return interaction.reply({ content: '`DM KAPALI!`', ephemeral: true }); }
        }
    }
};