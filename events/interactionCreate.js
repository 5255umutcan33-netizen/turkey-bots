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

        // --- TICKET KAPATMA ---
        if (cid === 'close_ticket_tr' || cid === 'close_ticket_en') {
            const isEn = cid === 'close_ticket_en';
            await interaction.reply(`\`${isEn ? 'Closing... 📩' : 'Kapatılıyor... 📩'}\``);
            setTimeout(() => { interaction.channel.delete().catch(() => {}); }, 2000);
            return;
        }

        // --- SAHİPLEN ---
        if (cid === 'claim_ticket_tr' || cid === 'claim_ticket_en') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ content: '`⚠️ YETKİ YOK`', ephemeral: true });
            }
            const row = ActionRowBuilder.from(interaction.message.components[0]);
            row.components[0].setDisabled(true).setLabel(`OK: ${interaction.user.username}`);
            await interaction.update({ components: [row] });
            return interaction.channel.send({ content: `⚡ <@${interaction.user.id}> biletle ilgileniyor.` });
        }

        // --- TICKET AÇMA (HATA RAPORLU) ---
        const ticketIds = ['ticket_tr_support', 'ticket_tr_partner', 'ticket_tr_key', 'ticket_en_support', 'ticket_en_partner', 'ticket_en_key'];
        if (ticketIds.includes(cid)) {
            await interaction.deferReply({ ephemeral: true });

            const isEn = cid.startsWith('ticket_en_');
            // Cache yerine aktif kontrol
            const existingTicket = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id);
            if (existingTicket) {
                return interaction.editReply({ content: isEn ? '`You have an open ticket!`' : '`Zaten bir biletin var!`' });
            }

            try {
                // SAYAÇ KONTROLÜ
                let counter = await Counter.findOneAndUpdate({ id: 'ticket' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
                const ticketNo = counter ? counter.seq : "ERR";

                let typeName = isEn ? 'support' : 'destek';
                let title = isEn ? 'SUPPORT' : 'DESTEK';

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

                const embed = new EmbedBuilder()
                    .setTitle(`💬 RYPHERA OS | ${title}`)
                    .setColor('#2B2D31')
                    .setDescription(`>>> 👋 **Merhaba <@${interaction.user.id}>**\nLütfen bekleyin, yetkililer biletinizi sahiplenecektir.`)
                    .setFooter({ text: `Bilet #${ticketNo}` });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(isEn ? 'claim_ticket_en' : 'claim_ticket_tr').setLabel('Sahiplen').setEmoji('🗪').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(isEn ? 'close_ticket_en' : 'close_ticket_tr').setLabel('Kapat').setEmoji('📩').setStyle(ButtonStyle.Danger)
                );

                await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
                return interaction.editReply({ content: `✅ <#${ticketChannel.id}>` });

            } catch (err) {
                console.error("TICKET HATASI:", err);
                // HATAYI EKRANA YAZDIRALIM Kİ ANLAYALIM
                return interaction.editReply({ content: `\`❌ HATA: ${err.message}\`` });
            }
        }

        // --- MOBİL KOPYALAMA ---
        if (cid === 'mobil_kopyala_btn') {
            try {
                const embed = interaction.message.embeds[0];
                const scriptAlani = embed.fields[1]; 
                let temizKod = scriptAlani.value.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
                return interaction.reply({ content: `💬 **Kod:**\n${temizKod}`, ephemeral: true });
            } catch (e) { return interaction.reply({ content: '`Kod okunamadı.`', ephemeral: true }); }
        }

        // --- KEY SİSTEMİ ---
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            const isEn = cid === 'get_key_en';
            const rypKey = `RYP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            try {
                await interaction.user.send(`👋 **KEY:** \`${rypKey}\``);
                return interaction.reply({ content: isEn ? '`Check DMs!`' : '`DM kutuna bak!`', ephemeral: true });
            } catch (e) { return interaction.reply({ content: '`DM KAPALI!`', ephemeral: true }); }
        }
    }
};