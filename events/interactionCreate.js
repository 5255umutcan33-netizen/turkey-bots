const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key');

const cooldown = new Set(); 

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const OWNER_ID = '345821033414262794'; // Bütün nükleer yetkiler sana ait kanka

        // --- 1. SLASH KOMUTLARINI ÇALIŞTIR ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.execute(interaction); } 
            catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) await interaction.followUp({ content: '`HATA`', ephemeral: true });
                else await interaction.reply({ content: '`HATA`', ephemeral: true });
            }
            return;
        }

        // --- 2. BUTON KONTROLLERİ ---
        if (!interaction.isButton()) return;
        const cid = interaction.customId;

        // --- TICKET KAPATMA BUTONU ---
        if (cid === 'close_ticket_tr' || cid === 'close_ticket_en') {
            const isEn = cid === 'close_ticket_en';
            await interaction.reply(`\`${isEn ? 'Channel is closing in 3 seconds...' : 'Kanal 3 saniye içinde imha ediliyor...'}\``);
            setTimeout(() => { interaction.channel.delete().catch(() => {}); }, 3000);
            return;
        }

        // --- YETKİLİ SAHİPLEN BUTONU ---
        if (cid === 'claim_ticket_tr' || cid === 'claim_ticket_en') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ content: '`⚠️ YETKİ YOK: Sadece yetkililer bilet sahiplenebilir.`', ephemeral: true });
            }

            const isEn = cid === 'claim_ticket_en';

            const row = ActionRowBuilder.from(interaction.message.components[0]);
            row.components[0].setDisabled(true).setLabel(isEn ? `Claimed by: ${interaction.user.username}` : `Sahiplenen: ${interaction.user.username}`);

            await interaction.update({ components: [row] });

            const claimEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(isEn 
                    ? `>>> **TICKET CLAIMED!**\n\nStaff member <@${interaction.user.id}> is now handling this ticket.` 
                    : `>>> **BİLET SAHİPLENİLDİ!**\n\nYetkili <@${interaction.user.id}> bu biletle ilgileniyor.`);
            
            return interaction.channel.send({ embeds: [claimEmbed] });
        }

        // --- TICKET AÇMA BUTONLARI ---
        const ticketIds = ['ticket_tr_support', 'ticket_tr_partner', 'ticket_tr_key', 'ticket_en_support', 'ticket_en_partner', 'ticket_en_key'];
        if (ticketIds.includes(cid)) {
            const isEn = cid.startsWith('ticket_en_');

            // KORUMA: 1 Kişi sadece 1 ticket açabilir
            const existingTicket = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id);
            if (existingTicket) {
                return interaction.reply({ content: isEn ? '`You already have an open ticket.`' : '`Zaten açık bir biletiniz var.`', ephemeral: true });
            }

            let typeName = '', titleName = '';
            const ticketNumber = Math.floor(100 + Math.random() * 900); // 3 Haneli jilet gibi bilet no

            if (cid === 'ticket_tr_support') { typeName = 'destek'; titleName = 'DESTEK'; }
            if (cid === 'ticket_tr_partner') { typeName = 'is-birligi'; titleName = 'İŞ BİRLİĞİ'; }
            if (cid === 'ticket_tr_key') { typeName = 'key'; titleName = 'KEY İŞLEMLERİ'; }

            if (cid === 'ticket_en_support') { typeName = 'support'; titleName = 'SUPPORT'; }
            if (cid === 'ticket_en_partner') { typeName = 'partner'; titleName = 'PARTNERSHIP'; }
            if (cid === 'ticket_en_key') { typeName = 'key'; titleName = 'KEY OPS'; }

            const ticketChannel = await interaction.guild.channels.create({
                name: `${typeName}-${interaction.user.username}-${ticketNumber}`,
                type: ChannelType.GuildText,
                topic: interaction.user.id, 
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, 
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }, 
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                ]
            });

            const ticketEmbed = new EmbedBuilder()
                .setTitle(`RYPHERA OS | ${titleName}`)
                .setColor('#2B2D31')
                .setDescription(isEn 
                    ? `>>> **Welcome to the System, <@${interaction.user.id}>**\n\nPlease state your issue or offer in detail.\nRyphera staff will claim your ticket shortly.`
                    : `>>> **Sisteme Hoş Geldin, <@${interaction.user.id}>**\n\nLütfen sorununuzu veya teklifinizi detaylıca belirtin.\nRyphera yetkilileri en kısa sürede biletinizi üstlenecektir.`)
                .setFooter({ text: `Ticket ID: #${ticketNumber} | ${interaction.user.tag}` })
                .setTimestamp();

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(isEn ? 'claim_ticket_en' : 'claim_ticket_tr').setLabel(isEn ? 'Claim Ticket' : 'Sahiplen').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(isEn ? 'close_ticket_en' : 'close_ticket_tr').setLabel(isEn ? 'Close Ticket' : 'Bileti Kapat').setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [actionRow] });

            return interaction.reply({ content: isEn ? `\`Ticket created:\` <#${ticketChannel.id}>` : `\`Bilet oluşturuldu:\` <#${ticketChannel.id}>`, ephemeral: true });
        }

        // --- MOBİL SCRIPT KOPYALAMA BUTONU ---
        if (cid === 'mobil_kopyala_btn') {
            const embed = interaction.message.embeds[0];
            if (!embed) return interaction.reply({ content: '`Embed bulunamadı.`', ephemeral: true });

            const isEn = embed.footer && embed.footer.text.includes('Mobile users');
            const scriptAlani = embed.fields[1]; // Kod her zaman 2. sıradadır
            
            if (!scriptAlani) return interaction.reply({ content: isEn ? '`Code not found.`' : '`Kod bulunamadı.`', ephemeral: true });

            let temizKod = scriptAlani.value.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            return interaction.reply({ content: `${temizKod}`, ephemeral: true });
        }

        // --- VERİTABANI SİLME (NÜKLEER) ---
        if (cid === 'confirm_delete_all') {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '`⚠️ YETKİ YOK`', ephemeral: true });
            await KeyModel.deleteMany({});
            return interaction.update({ content: '`✅ Tüm veritabanı mermi gibi temizlendi!`', embeds: [], components: [] });
        }
        if (cid === 'cancel_delete_all') return interaction.update({ content: '`İptal edildi.`', embeds: [], components: [] });

        // --- KEY ALMA BUTONLARI ---
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
                await interaction.user.send(`🚀 RYPHERA KEY: \`${rypKey}\``);
                return interaction.reply({ content: isEn ? '`SUCCESS: Check DMs!`' : '`BAŞARILI: DM kutuna bak!`', ephemeral: true });
            } catch (e) { return interaction.reply({ content: '`DM KAPALI!`', ephemeral: true }); }
        }
    }
};