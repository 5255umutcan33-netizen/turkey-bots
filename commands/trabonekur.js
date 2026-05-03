const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AboneChannel = require('../models/aboneChannel'); // Yolunu kontrol et

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trabonekur')
        .setDescription('📸 Kanalı YZ destekli Abone Onay kanalına çevirir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        await AboneChannel.findOneAndUpdate(
            { channelId: interaction.channelId }, 
            { lang: 'tr' }, 
            { upsert: true }
        );

        // KANAL İZİNLERİNİ OTOMATİK AYARLA (Abone rolü olanlar kanalı göremez)
        const ABONE_ROLU = '1500587633649127445';
        await interaction.channel.permissionOverwrites.edit(ABONE_ROLU, {
            ViewChannel: false // Abone olanlar burayı artık göremez
        }).catch(() => {});

        // 💎 LUAWARE ONAY RAPORU
        const embed = new EmbedBuilder()
            .setTitle('🛡️ LUAWARE OS | Yapay Zeka Destekli SS Sistemi')
            .setColor('#1aff00')
            .setDescription(
                `⚙️ **İşlem -->** \`Abone Onay Kanalı Kurulumu\`\n` +
                `✅ **Durum -->** \`Başarıyla Ayarlandı & YZ Aktif\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>\n` +
                `📅 **İşlem Zamanı -->** <t:${Math.floor(Date.now() / 1000)}:f>`
            )
            .setFooter({ text: 'Luaware System' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};