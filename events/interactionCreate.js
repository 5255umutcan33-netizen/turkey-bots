const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const KeyModel = require('../models/key');

const cooldown = new Set(); 

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const OWNER_ID = '345821033414262794'; // SENİN ID'N (Bütün yetkiler buna bağlı)

        // --- 1. SLASH KOMUTLARINI ÇALIŞTIR ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) await interaction.followUp({ content: '`HATA`', ephemeral: true });
                else await interaction.reply({ content: '`HATA`', ephemeral: true });
            }
            return;
        }

        // --- 2. BUTONLARI ÇALIŞTIR ---
        if (!interaction.isButton()) return;
        const cid = interaction.customId;

        // --- TICKET KAPATMA BUTONU ---
        if (cid === 'close_ticket') {
            await interaction.reply('`Kanal 3 saniye içinde imha ediliyor... / Channel is closing...`');
            setTimeout(() => { interaction.channel.delete().catch(() => {}); }, 3000);
            return;
        }

        // --- TICKET AÇMA BUTONLARI ---
        const ticketIds = ['ticket_tr_support', 'ticket_tr_partner', 'ticket_tr_key', 'ticket_en_support', 'ticket_en_partner', 'ticket_en_key'];
        if (ticketIds.includes(cid)) {
            const isEn = cid.startsWith('ticket_en_');

            // KORUMA: Adamın zaten bir ticketi var mı? (Topic kısmında ID saklayarak anlıyoruz)
            const existingTicket = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id);
            if (existingTicket) {
                return interaction.reply({ content: isEn ? '`You already have an open ticket.`' : '`Zaten açık bir biletiniz var.`', ephemeral: true });
            }

            // Hangi butona bastığına göre başlıkları ayarla
            let typeName = '', titleName = '', desc = '';

            if (cid === 'ticket_tr_support') { typeName = 'destek'; titleName = 'DESTEK'; desc = 'Destek talebiniz alındı. Yetkililer birazdan ilgilenecektir.'; }
            if (cid === 'ticket_tr_partner') { typeName = 'is-birligi'; titleName = 'İŞ BİRLİĞİ'; desc = 'İş birliği talebiniz alındı. Lütfen teklifinizi yazın.'; }
            if (cid === 'ticket_tr_key') { typeName = 'key'; titleName = 'KEY İŞLEMLERİ'; desc = 'Key işlemleri için lütfen sorununuzu belirtin.'; }

            if (cid === 'ticket_en_support') { typeName = 'support'; titleName = 'SUPPORT'; desc = 'Support request received. Staff will be with you shortly.'; }
            if (cid === 'ticket_en_partner') { typeName = 'partner'; titleName = 'PARTNERSHIP'; desc = 'Partnership request received. Please state your offer.'; }
            if (cid === 'ticket_en_key') { typeName = 'key'; titleName = 'KEY OPS'; desc = 'Please state your issue regarding keys.'; }

            // Özel Kanal Oluşturma
            const ticketChannel = await interaction.guild.channels.create({
                name: `${typeName}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                topic: interaction.user.id, // Korumayı sağlamak için adamın ID'sini buraya gizliyoruz
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, // Herkese kapat
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }, // Sadece butona basan kişiye aç
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] } // Bota tam yetki
                ]
            });

            // İçerideki Karşılama Mesajı (Kapatma butonlu)
            const ticketEmbed = new EmbedBuilder()
                .setTitle(`RYPHERA OS | ${titleName}`)
                .setColor('#2B2D31')
                .setDescription(`>>> ${desc}`)
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            const closeRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close_ticket').setLabel(isEn ? 'Close Ticket' : 'Bileti Kapat').setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [closeRow] });

            return interaction.reply({ content: isEn ? `\`Ticket created:\` <#${ticketChannel.id}>` : `\`Bilet oluşturuldu:\` <#${ticketChannel.id}>`, ephemeral: true });
        }

        // --- MOBİL SCRIPT KOPYALAMA BUTONU (GARANTİLİ YÖNTEM) ---
        if (cid === 'mobil_kopyala_btn') {
            const embed = interaction.message.embeds[0];
            if (!embed) return interaction.reply({ content: '`Embed bulunamadı.`', ephemeral: true });

            const isEn = embed.footer && embed.footer.text.includes('Mobile users');
            const scriptAlani = embed.fields[1]; 
            
            if (!scriptAlani) return interaction.reply({ content: isEn ? '`Code not found.`' : '`Kod bulunamadı.`', ephemeral: true });

            let temizKod = scriptAlani.value.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            return interaction.reply({ content: `${temizKod}`, ephemeral: true });
        }

        // --- VERİTABANI SİLME (SADECE SEN) ---
        if (cid === 'confirm_delete_all') {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '`⚠️ YETKİ YOK`', ephemeral: true });
            await KeyModel.deleteMany({});
            return interaction.update({ content: '`✅ Tüm veritabanı mermi gibi temizlendi!`', embeds: [], components: [] });
        }

        if (cid === 'cancel_delete_all') return interaction.update({ content: '`İptal edildi.`', embeds: [], components: [] });

        // --- KEY ALMA (TR/EN) ---
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